import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Initialization } from "../target/types/initialization";

describe("initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Initialization as Program<Initialization>;

  const wallet = anchor.workspace.Initialization.provider.wallet;
  const walletTwo = anchor.web3.Keypair.generate();

  const userInsecure = anchor.web3.Keypair.generate();

  before(async () => {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: userInsecure.publicKey,
        space: 32,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          32
        ),
        programId: program.programId,
      })
    );

    await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [
      wallet.payer,
      userInsecure,
    ]);

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        walletTwo.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
  });

  it("insecureInitialization should be successful", async () => {
    await program.methods
      .insecureInitialization()
      .accounts({
        user: userInsecure.publicKey,
      })
      .rpc();
  });

  it("insecureInitialization with a different authority should be successful again", async () => {
    const tx = await program.methods
      .insecureInitialization()
      .accounts({
        user: userInsecure.publicKey,
        authority: walletTwo.publicKey,
      })
      .transaction();
    await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [
      walletTwo,
    ]);
  });
});
