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
  const userRecommended = anchor.web3.Keypair.generate();

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

    const airdropSignature = await provider.connection.requestAirdrop(
      walletTwo.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );

    const latestBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      },
      "confirmed"
    );
  });

  it("insecureInitialization should be successful", async () => {
    await program.methods
      .insecureInitialization()
      .accounts({
        user: userInsecure.publicKey,
        authority: wallet.publicKey,
      })
      .signers([wallet.payer])
      .rpc();
  });

  it("insecureInitialization with a different authority should be successful again", async () => {
    await program.methods
      .insecureInitialization()
      .accounts({
        user: userInsecure.publicKey,
        authority: walletTwo.publicKey,
      })
      .signers([walletTwo])
      .rpc();
  });
});
