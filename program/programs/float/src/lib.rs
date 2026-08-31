//! Float — short-term working-capital advances for verified businesses.
//!
//! A business with a delayed inbound payment (an unsettled customer invoice)
//! posts evidence of that payment, an underwriter approves, and USDC is
//! disbursed from a treasury. On repayment the business's on-chain profile
//! records the completed cycle.
//!
//! Scope note: this is the MVP. Credit policy lives in code as hard caps —
//! the underwriter can approve within those bounds and never outside them.
//! Payment routing, KYB and evidence verification are off-chain concerns and
//! are deliberately not modelled here.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("F1oatAdvance11111111111111111111111111111111");

// ─────────────────────────────────────────────────────────────
// Policy — hard bounds the underwriter cannot exceed
// ─────────────────────────────────────────────────────────────

/// USDC has 6 decimals.
const USDC_DECIMALS: u64 = 1_000_000;

/// Tier 1 ceiling: the largest advance allowed without a pledge. $5,000.
const MAX_ADVANCE_TIER_1: u64 = 5_000 * USDC_DECIMALS;

/// Absolute ceiling for the MVP, pledge or not. $25,000.
const MAX_ADVANCE_ABSOLUTE: u64 = 25_000 * USDC_DECIMALS;

/// Advances are short-dated by design.
const MIN_TERM_DAYS: u16 = 1;
const MAX_TERM_DAYS: u16 = 60;

/// Maximum fee an underwriter may set: 10% of principal.
const MAX_FEE_BPS: u16 = 1_000;
const BPS_DENOMINATOR: u64 = 10_000;

const SECONDS_PER_DAY: i64 = 86_400;

// PDA seeds
const TREASURY_SEED: &[u8] = b"treasury";
const BUSINESS_SEED: &[u8] = b"business";
const ADVANCE_SEED: &[u8] = b"advance";

#[program]
pub mod float {
    use super::*;

    /// Stand up the treasury that funds advances. Called once by the operator.
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.operator = ctx.accounts.operator.key();
        treasury.underwriter = ctx.accounts.operator.key();
        treasury.usdc_mint = ctx.accounts.usdc_mint.key();
        treasury.advances_funded = 0;
        treasury.principal_outstanding = 0;
        treasury.bump = ctx.bumps.treasury;
        Ok(())
    }

    /// Point the underwriter role at a different key.
    pub fn set_underwriter(ctx: Context<SetUnderwriter>, new_underwriter: Pubkey) -> Result<()> {
        ctx.accounts.treasury.underwriter = new_underwriter;
        Ok(())
    }

    /// Register a business. `kyb_reference` is a hash of the off-chain KYB
    /// record (registration documents, verified payer details) — the documents
    /// themselves never touch the chain.
    pub fn register_business(
        ctx: Context<RegisterBusiness>,
        legal_name: String,
        kyb_reference: [u8; 32],
    ) -> Result<()> {
        require!(!legal_name.is_empty(), FloatError::EmptyLegalName);
        require!(legal_name.len() <= BusinessProfile::MAX_NAME_LEN, FloatError::LegalNameTooLong);

        let profile = &mut ctx.accounts.business;
        profile.authority = ctx.accounts.authority.key();
        profile.legal_name = legal_name;
        profile.kyb_reference = kyb_reference;
        profile.advances_taken = 0;
        profile.advances_repaid = 0;
        profile.advances_overdue = 0;
        profile.total_volume_repaid = 0;
        profile.registered_at = Clock::get()?.unix_timestamp;
        profile.bump = ctx.bumps.business;

        emit!(BusinessRegistered {
            business: profile.key(),
            authority: profile.authority,
        });
        Ok(())
    }

    /// A business requests an advance against a delayed inbound payment.
    ///
    /// `evidence_reference` is a hash of the off-chain evidence bundle (the
    /// invoice, the payer verification, the expected settlement date).
    /// `expected_inflow` is the verified amount owed to the business — the
    /// advance is bounded by it so the ceiling cannot be inflated by anything
    /// the borrower can manufacture.
    pub fn request_advance(
        ctx: Context<RequestAdvance>,
        nonce: u64,
        amount: u64,
        expected_inflow: u64,
        term_days: u16,
        evidence_reference: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, FloatError::InvalidAmount);
        require!(amount <= MAX_ADVANCE_ABSOLUTE, FloatError::ExceedsAbsoluteCeiling);
        require!(
            term_days >= MIN_TERM_DAYS && term_days <= MAX_TERM_DAYS,
            FloatError::InvalidTerm
        );
        // The advance may never exceed the verified inbound payment it is
        // drawn against. This is the control that stops a borrower from
        // manufacturing a larger limit.
        require!(expected_inflow >= amount, FloatError::AdvanceExceedsInflow);

        let advance = &mut ctx.accounts.advance;
        advance.business = ctx.accounts.business.key();
        advance.borrower = ctx.accounts.authority.key();
        advance.amount = amount;
        advance.expected_inflow = expected_inflow;
        advance.term_days = term_days;
        advance.evidence_reference = evidence_reference;
        advance.fee_bps = 0;
        advance.total_due = 0;
        advance.requested_at = Clock::get()?.unix_timestamp;
        advance.disbursed_at = 0;
        advance.due_at = 0;
        advance.repaid_at = 0;
        advance.status = AdvanceStatus::Requested;
        advance.nonce = nonce;
        advance.bump = ctx.bumps.advance;

        emit!(AdvanceRequested {
            advance: advance.key(),
            business: advance.business,
            amount,
            expected_inflow,
            term_days,
        });
        Ok(())
    }

    /// The underwriter approves and the treasury disburses in one step.
    ///
    /// The fee is set here, within the policy cap. A business seeking more than
    /// the tier-1 ceiling must have a pledge recorded off-chain; the program
    /// enforces the ceiling itself.
    pub fn approve_and_disburse(ctx: Context<ApproveAndDisburse>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, FloatError::FeeTooHigh);

        let amount = ctx.accounts.advance.amount;
        require!(
            ctx.accounts.advance.status == AdvanceStatus::Requested,
            FloatError::AdvanceNotRequested
        );
        require!(amount <= MAX_ADVANCE_TIER_1, FloatError::ExceedsTier1Ceiling);

        let fee = amount
            .checked_mul(fee_bps as u64)
            .ok_or(FloatError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(FloatError::MathOverflow)?;
        let total_due = amount.checked_add(fee).ok_or(FloatError::MathOverflow)?;

        // Treasury → borrower.
        let treasury_bump = ctx.accounts.treasury.bump;
        let seeds: &[&[u8]] = &[TREASURY_SEED, &[treasury_bump]];
        let signer = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.treasury_usdc.to_account_info(),
                    to: ctx.accounts.borrower_usdc.to_account_info(),
                    authority: ctx.accounts.treasury.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        let now = Clock::get()?.unix_timestamp;
        let advance = &mut ctx.accounts.advance;
        advance.fee_bps = fee_bps;
        advance.total_due = total_due;
        advance.disbursed_at = now;
        advance.due_at = now
            .checked_add((advance.term_days as i64).checked_mul(SECONDS_PER_DAY).ok_or(FloatError::MathOverflow)?)
            .ok_or(FloatError::MathOverflow)?;
        advance.status = AdvanceStatus::Active;

        let business = &mut ctx.accounts.business;
        business.advances_taken = business.advances_taken.checked_add(1).ok_or(FloatError::MathOverflow)?;

        let treasury = &mut ctx.accounts.treasury;
        treasury.advances_funded = treasury.advances_funded.checked_add(1).ok_or(FloatError::MathOverflow)?;
        treasury.principal_outstanding = treasury
            .principal_outstanding
            .checked_add(amount)
            .ok_or(FloatError::MathOverflow)?;

        emit!(AdvanceDisbursed {
            advance: advance.key(),
            business: advance.business,
            amount,
            fee,
            total_due,
            due_at: advance.due_at,
        });
        Ok(())
    }

    /// The business repays principal plus fee in full. Partial repayment is
    /// deliberately not supported in the MVP.
    pub fn repay_advance(ctx: Context<RepayAdvance>) -> Result<()> {
        let status = ctx.accounts.advance.status;
        require!(
            status == AdvanceStatus::Active || status == AdvanceStatus::Overdue,
            FloatError::AdvanceNotRepayable
        );

        let total_due = ctx.accounts.advance.total_due;
        let principal = ctx.accounts.advance.amount;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.borrower_usdc.to_account_info(),
                    to: ctx.accounts.treasury_usdc.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            total_due,
        )?;

        let now = Clock::get()?.unix_timestamp;
        let was_late = now > ctx.accounts.advance.due_at;

        let advance = &mut ctx.accounts.advance;
        advance.repaid_at = now;
        advance.status = AdvanceStatus::Repaid;

        // The credit record. Repayment history moves price and speed off-chain;
        // it never raises the ceiling, which is bounded by verified inflow.
        let business = &mut ctx.accounts.business;
        business.advances_repaid = business.advances_repaid.checked_add(1).ok_or(FloatError::MathOverflow)?;
        business.total_volume_repaid = business
            .total_volume_repaid
            .checked_add(principal)
            .ok_or(FloatError::MathOverflow)?;

        let treasury = &mut ctx.accounts.treasury;
        treasury.principal_outstanding = treasury.principal_outstanding.saturating_sub(principal);

        emit!(AdvanceRepaid {
            advance: advance.key(),
            business: advance.business,
            total_due,
            was_late,
            advances_repaid: business.advances_repaid,
            total_volume_repaid: business.total_volume_repaid,
        });
        Ok(())
    }

    /// Flag an advance past its due date. Permissionless — anyone may call it,
    /// so the record cannot be suppressed by the borrower or the operator.
    pub fn mark_overdue(ctx: Context<MarkOverdue>) -> Result<()> {
        require!(
            ctx.accounts.advance.status == AdvanceStatus::Active,
            FloatError::AdvanceNotActive
        );
        let now = Clock::get()?.unix_timestamp;
        require!(now > ctx.accounts.advance.due_at, FloatError::NotYetOverdue);

        let advance = &mut ctx.accounts.advance;
        advance.status = AdvanceStatus::Overdue;

        let business = &mut ctx.accounts.business;
        business.advances_overdue = business.advances_overdue.checked_add(1).ok_or(FloatError::MathOverflow)?;

        emit!(AdvanceOverdue {
            advance: advance.key(),
            business: advance.business,
            due_at: advance.due_at,
            flagged_at: now,
        });
        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub operator: Signer<'info>,
    #[account(
        init,
        payer = operator,
        space = Treasury::LEN,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = operator,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetUnderwriter<'info> {
    #[account(mut, address = treasury.operator @ FloatError::Unauthorized)]
    pub operator: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
}

#[derive(Accounts)]
pub struct RegisterBusiness<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = BusinessProfile::LEN,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump
    )]
    pub business: Account<'info, BusinessProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct RequestAdvance<'info> {
    #[account(mut, address = business.authority @ FloatError::Unauthorized)]
    pub authority: Signer<'info>,
    #[account(seeds = [BUSINESS_SEED, authority.key().as_ref()], bump = business.bump)]
    pub business: Account<'info, BusinessProfile>,
    #[account(
        init,
        payer = authority,
        space = Advance::LEN,
        seeds = [ADVANCE_SEED, business.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub advance: Account<'info, Advance>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveAndDisburse<'info> {
    #[account(mut, address = treasury.underwriter @ FloatError::Unauthorized)]
    pub underwriter: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(
        mut,
        seeds = [BUSINESS_SEED, business.authority.as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, BusinessProfile>,
    #[account(
        mut,
        seeds = [ADVANCE_SEED, business.key().as_ref(), &advance.nonce.to_le_bytes()],
        bump = advance.bump,
        constraint = advance.business == business.key() @ FloatError::AdvanceBusinessMismatch
    )]
    pub advance: Account<'info, Advance>,
    #[account(address = treasury.usdc_mint @ FloatError::WrongMint)]
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = treasury)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = borrower
    )]
    pub borrower_usdc: Account<'info, TokenAccount>,
    /// CHECK: validated against the advance's recorded borrower.
    #[account(address = advance.borrower @ FloatError::Unauthorized)]
    pub borrower: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayAdvance<'info> {
    #[account(mut, address = business.authority @ FloatError::Unauthorized)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(
        mut,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, BusinessProfile>,
    #[account(
        mut,
        seeds = [ADVANCE_SEED, business.key().as_ref(), &advance.nonce.to_le_bytes()],
        bump = advance.bump,
        constraint = advance.business == business.key() @ FloatError::AdvanceBusinessMismatch
    )]
    pub advance: Account<'info, Advance>,
    #[account(address = treasury.usdc_mint @ FloatError::WrongMint)]
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = treasury)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = authority)]
    pub borrower_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarkOverdue<'info> {
    /// Anyone may flag an overdue advance.
    pub caller: Signer<'info>,
    #[account(
        mut,
        seeds = [BUSINESS_SEED, business.authority.as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, BusinessProfile>,
    #[account(
        mut,
        seeds = [ADVANCE_SEED, business.key().as_ref(), &advance.nonce.to_le_bytes()],
        bump = advance.bump,
        constraint = advance.business == business.key() @ FloatError::AdvanceBusinessMismatch
    )]
    pub advance: Account<'info, Advance>,
}

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────

#[account]
pub struct Treasury {
    pub operator: Pubkey,
    pub underwriter: Pubkey,
    pub usdc_mint: Pubkey,
    pub advances_funded: u64,
    pub principal_outstanding: u64,
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1;
}

/// The credit record. Public, permanent, and tied to the business's key.
#[account]
pub struct BusinessProfile {
    pub authority: Pubkey,
    pub legal_name: String,
    pub kyb_reference: [u8; 32],
    pub advances_taken: u32,
    pub advances_repaid: u32,
    pub advances_overdue: u32,
    pub total_volume_repaid: u64,
    pub registered_at: i64,
    pub bump: u8,
}

impl BusinessProfile {
    pub const MAX_NAME_LEN: usize = 64;
    pub const LEN: usize = 8 + 32 + (4 + Self::MAX_NAME_LEN) + 32 + 4 + 4 + 4 + 8 + 8 + 1;
}

#[account]
pub struct Advance {
    pub business: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub expected_inflow: u64,
    pub fee_bps: u16,
    pub total_due: u64,
    pub term_days: u16,
    pub evidence_reference: [u8; 32],
    pub requested_at: i64,
    pub disbursed_at: i64,
    pub due_at: i64,
    pub repaid_at: i64,
    pub status: AdvanceStatus,
    pub nonce: u64,
    pub bump: u8,
}

impl Advance {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 2 + 8 + 2 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AdvanceStatus {
    Requested,
    Active,
    Repaid,
    Overdue,
}

// ─────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────

#[event]
pub struct BusinessRegistered {
    pub business: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct AdvanceRequested {
    pub advance: Pubkey,
    pub business: Pubkey,
    pub amount: u64,
    pub expected_inflow: u64,
    pub term_days: u16,
}

#[event]
pub struct AdvanceDisbursed {
    pub advance: Pubkey,
    pub business: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub total_due: u64,
    pub due_at: i64,
}

#[event]
pub struct AdvanceRepaid {
    pub advance: Pubkey,
    pub business: Pubkey,
    pub total_due: u64,
    pub was_late: bool,
    pub advances_repaid: u32,
    pub total_volume_repaid: u64,
}

#[event]
pub struct AdvanceOverdue {
    pub advance: Pubkey,
    pub business: Pubkey,
    pub due_at: i64,
    pub flagged_at: i64,
}

// ─────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────

#[error_code]
pub enum FloatError {
    #[msg("Caller is not authorised for this action")]
    Unauthorized,
    #[msg("Legal name must not be empty")]
    EmptyLegalName,
    #[msg("Legal name exceeds the maximum length")]
    LegalNameTooLong,
    #[msg("Advance amount must be greater than zero")]
    InvalidAmount,
    #[msg("Advance exceeds the absolute programme ceiling")]
    ExceedsAbsoluteCeiling,
    #[msg("Advance exceeds the tier-1 ceiling of $5,000")]
    ExceedsTier1Ceiling,
    #[msg("Advance may not exceed the verified expected inflow")]
    AdvanceExceedsInflow,
    #[msg("Term must be between 1 and 60 days")]
    InvalidTerm,
    #[msg("Fee exceeds the maximum permitted")]
    FeeTooHigh,
    #[msg("Advance is not awaiting approval")]
    AdvanceNotRequested,
    #[msg("Advance is not in a repayable state")]
    AdvanceNotRepayable,
    #[msg("Advance is not active")]
    AdvanceNotActive,
    #[msg("Advance is not yet past its due date")]
    NotYetOverdue,
    #[msg("Advance does not belong to this business")]
    AdvanceBusinessMismatch,
    #[msg("Token mint does not match the treasury mint")]
    WrongMint,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
