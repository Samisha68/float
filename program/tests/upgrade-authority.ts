import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
export const programDataAddress = (program: PublicKey) =>
  PublicKey.findProgramAddressSync([program.toBuffer()], UPGRADEABLE_LOADER)[0];

// Bankrun loads executable code separately. Supply the loader metadata that
// an upgradeable deployment creates on a validator.
export function upgradeMetadata(program: PublicKey, authority: PublicKey | null) {
  const data = Buffer.alloc(45);
  data.writeUInt32LE(3, 0); // UpgradeableLoaderState::ProgramData
  data[12] = authority ? 1 : 0;
  authority?.toBuffer().copy(data, 13);
  return { address: programDataAddress(program), info: {
    lamports: LAMPORTS_PER_SOL, data, owner: UPGRADEABLE_LOADER, executable: false,
  } };
}
