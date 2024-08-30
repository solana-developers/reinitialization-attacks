import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Initialization } from "../target/types/initialization";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  SendTransactionError
} from "@solana/web3.js";
import { expect } from "chai"
import { airdropIfRequired } from "@solana-developers/helpers";

describe("Initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Initialization as Program<Initialization>;

  const wallet = provider.wallet as anchor.Wallet;
  const walletTwo = Keypair.generate();

  const userInsecure = Keypair.generate();
  const userRecommended = Keypair.generate();

  before(async () => {
    try {
      const tx = new Transaction().add(
        SystemProgram.createAccount({
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

      await airdropIfRequired(
        provider.connection,
        walletTwo.publicKey,
        1 * LAMPORTS_PER_SOL,
        1 * LAMPORTS_PER_SOL
      );
    } catch (error) {
      throw new Error(`Setup failed: ${error.message}`);
    }
  });

  it("Performs insecure initialization", async () => {
    try {
      await program.methods
        .insecureInitialization()
        .accounts({
          user: userInsecure.publicKey,
          authority: wallet.publicKey,
        })
        .signers([wallet.payer])
        .rpc();
    } catch (error) {
      throw new Error(`Insecure initialization failed: ${error.message}`);
    }
  });

  it("Re-invokes insecure initialization with different authority", async () => {
    try {
      const tx = await program.methods
        .insecureInitialization()
        .accounts({
          user: userInsecure.publicKey,
          authority: walletTwo.publicKey,
        })
        .signers([walletTwo])
        .transaction();

      await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [
        walletTwo,
      ]);
    } catch (error) {
      throw new Error(
        `Re-invocation of insecure initialization failed: ${error.message}`
      );
    }
  });

  it("Performs recommended initialization", async () => {
    try {
      await program.methods
        .recommendedInitialization()
        .accounts({
          user: userRecommended.publicKey,
        })
        .signers([userRecommended])
        .rpc();
    } catch (error) {
      throw new Error(`Recommended initialization failed: ${error.message}`);
    }
  });

  it("Fails to re-invoke recommended initialization with different authority", async () => {
    try {
      const tx = await program.methods
        .recommendedInitialization()
        .accounts({
          user: userRecommended.publicKey,
          authority: walletTwo.publicKey,
        })
        .transaction();
      
      await anchor.web3.sendAndConfirmTransaction(
        provider.connection, 
        tx, 
        [walletTwo, userRecommended],
        {commitment: 'confirmed'}
      );
      
      throw new Error("Re-invocation succeeded unexpectedly");
    } catch (error) {
      if (error.message === "Re-invocation succeeded unexpectedly") {
        throw error;SendTransactionError
      }
      
      if (error instanceof SendTransactionError) {
        console.log("Transaction failed as expected");
      }
      console.log(error)
      expect(error).to.exist;
    }
  });

});
