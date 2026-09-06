import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { startAnchor, BankrunProvider } from 'anchor-bankrun';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, MintLayout, AccountLayout, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { assert } from 'chai';
import IDL from '../target/idl/float.json';
import { Float } from '../target/types/float';
import { upgradeMetadata } from "./upgrade-authority";
const UNIT = 1_000_000;
const id = new PublicKey(IDL.address);
const treasury = PublicKey.findProgramAddressSync([Buffer.from('treasury')], id)[0];
const businessFor = (key: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from('business'), key.toBuffer()], id)[0];
const advanceFor = (business: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from('advance'), business.toBuffer(), new BN(1).toArrayLike(Buffer, 'le', 8)], id)[0];

async function fixture() {
  const operator = Keypair.generate(), outsider = Keypair.generate(), mint = Keypair.generate();
  const mintData = Buffer.alloc(MintLayout.span);
  MintLayout.encode({ mintAuthorityOption:1, mintAuthority:operator.publicKey, supply:BigInt(100000 * UNIT), decimals:6, isInitialized:true, freezeAuthorityOption:0, freezeAuthority:PublicKey.default }, mintData);
  const ctx = await startAnchor('./', [], [
    upgradeMetadata(id, operator.publicKey),
    ...[operator, outsider].map(k => ({ address:k.publicKey, info:{lamports:10 * LAMPORTS_PER_SOL, data:Buffer.alloc(0), owner:anchor.web3.SystemProgram.programId, executable:false} })),
    {address:mint.publicKey, info:{lamports:LAMPORTS_PER_SOL, data:mintData, owner:TOKEN_PROGRAM_ID, executable:false}},
  ]);
  const provider = new BankrunProvider(ctx); provider.wallet = new anchor.Wallet(operator);
  const program = new Program<Float>(IDL as Float, provider);
  const token = (owner:PublicKey, amount:number) => {
    const data = Buffer.alloc(AccountLayout.span);
    AccountLayout.encode({mint:mint.publicKey, owner, amount:BigInt(amount), delegateOption:0, delegate:PublicKey.default, delegatedAmount:BigInt(0), state:1, isNativeOption:0, isNative:BigInt(0), closeAuthorityOption:0, closeAuthority:PublicKey.default}, data);
    ctx.setAccount(getAssociatedTokenAddressSync(mint.publicKey, owner, true), {lamports:LAMPORTS_PER_SOL, data, owner:TOKEN_PROGRAM_ID, executable:false});
  };
  return {ctx, operator, outsider, mint, program, token};
}
describe('Float security regressions', () => {
  it('F01: rejects an arbitrary initializer, then allows the upgrade authority', async () => {
    const {program, operator, outsider, mint, ctx} = await fixture();
    try {
      await program.methods.initializeTreasury().accounts({operator:outsider.publicKey, usdcMint:mint.publicKey}).signers([outsider]).rpc();
      assert.fail('unauthorized initialization succeeded');
    } catch (e) { assert.include(JSON.stringify(e), 'Unauthorized'); }
    assert.isNull(await ctx.banksClient.getAccount(treasury));
    await program.methods.initializeTreasury().accounts({operator:operator.publicKey, usdcMint:mint.publicKey}).rpc();
    const t = await program.account.treasury.fetch(treasury);
    assert.equal(t.operator.toBase58(), operator.publicKey.toBase58());
    assert.equal(t.underwriter.toBase58(), operator.publicKey.toBase58());
  });
  it('F01: rejects metadata from a different program', async () => {
    const {program, outsider, mint, ctx} = await fixture();
    const fake = upgradeMetadata(Keypair.generate().publicKey, outsider.publicKey);
    ctx.setAccount(fake.address, fake.info);
    try {
      await program.methods.initializeTreasury().accountsPartial({operator:outsider.publicKey, usdcMint:mint.publicKey, programData:fake.address}).signers([outsider]).rpc();
      assert.fail('foreign metadata accepted');
    } catch (e) { assert.include(JSON.stringify(e), 'ConstraintSeeds'); }
    assert.isNull(await ctx.banksClient.getAccount(treasury));
  });
  it('F01: rejects initialization when upgrade authority is revoked', async () => {
    const {program, operator, mint, ctx} = await fixture();
    const revoked = upgradeMetadata(id, null);
    ctx.setAccount(revoked.address, revoked.info);
    try {
      await program.methods.initializeTreasury().accounts({operator:operator.publicKey, usdcMint:mint.publicKey}).rpc();
      assert.fail('revoked authority accepted');
    } catch (e) { assert.include(JSON.stringify(e), 'Unauthorized'); }
  });
  for (const [label, seconds, expected] of [['before due', 86399, 0], ['at due', 86400, 0], ['after due', 86401, 1]] as const) {
  it(`F02: repayment ${label} records overdue count ${expected}`, async () => {
    const {program, operator, outsider, mint, token, ctx} = await fixture();
    await program.methods.initializeTreasury().accounts({operator:operator.publicKey, usdcMint:mint.publicKey}).rpc();
    token(treasury, 5000 * UNIT);
    const business = businessFor(outsider.publicKey), advance = advanceFor(business);
    await program.methods.registerBusiness('Audit late borrower', Array(32).fill(0)).accounts({authority:outsider.publicKey}).signers([outsider]).rpc();
    await program.methods.requestAdvance(new BN(1), new BN(1000 * UNIT), new BN(2000 * UNIT), 1, Array(32).fill(0)).accounts({authority:outsider.publicKey, business}).signers([outsider]).rpc();
    const borrowerUsdc = getAssociatedTokenAddressSync(mint.publicKey, outsider.publicKey);
    const accounts = {treasury, business, advance, usdcMint:mint.publicKey, treasuryUsdc:getAssociatedTokenAddressSync(mint.publicKey, treasury, true), borrowerUsdc};
    await program.methods.approveAndDisburse(0).accounts({...accounts, underwriter:operator.publicKey, borrower:outsider.publicKey}).rpc();
    const clock = await ctx.banksClient.getClock();
    ctx.setClock(new (Object.getPrototypeOf(clock).constructor)(clock.slot, clock.epochStartTimestamp, clock.epoch, clock.leaderScheduleEpoch, clock.unixTimestamp + BigInt(seconds)));
    await program.methods.repayAdvance().accounts({...accounts, authority:outsider.publicKey}).signers([outsider]).rpc();
    const a = await program.account.advance.fetch(advance), b = await program.account.businessProfile.fetch(business);
    assert.equal(a.repaidAt.gt(a.dueAt), expected === 1);
    assert.equal(b.advancesOverdue, expected, 'late repayment recorded exactly once');
    assert.deepEqual(a.status, {repaid:{}});
  });
  }
});
