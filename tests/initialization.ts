import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Initialization } from "../target/types/initialization";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  SendTransactionError,
} from "@solana/web3.js";
import { expect } from "chai";
import { airdropIfRequired } from "@solana-developers/helpers";

describe("Initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Initialization as Program<Initialization>;

  const walletAuthority = provider.wallet as anchor.Wallet;
  const secondWallet = Keypair.generate();

  const insecureUserAccount = Keypair.generate();
  const recommendedUserAccount = Keypair.generate();

  const ACCOUNT_SPACE = 32;
  const AIRDROP_AMOUNT = 1 * LAMPORTS_PER_SOL;
  const MINIMUM_BALANCE_FOR_RENT_EXEMPTION = 1 * LAMPORTS_PER_SOL;

  before(async () => {
    try {
      const rentExemptionAmount =
        await provider.connection.getMinimumBalanceForRentExemption(
          ACCOUNT_SPACE
        );

      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: walletAuthority.publicKey,
        newAccountPubkey: insecureUserAccount.publicKey,
        space: ACCOUNT_SPACE,
        lamports: rentExemptionAmount,
        programId: program.programId,
      });

      const transaction = new Transaction().add(createAccountInstruction);

      await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        transaction,
        [walletAuthority.payer, insecureUserAccount]
      );

      await airdropIfRequired(
        provider.connection,
        secondWallet.publicKey,
        AIRDROP_AMOUNT,
        MINIMUM_BALANCE_FOR_RENT_EXEMPTION
      );
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  });

  it("performs insecure initialization", async () => {
    try {
      await program.methods
        .insecureInitialization()
        .accounts({
          user: insecureUserAccount.publicKey,
          authority: walletAuthority.publicKey,
        })
        .signers([walletAuthority.payer])
        .rpc();
    } catch (error) {
      console.error("Insecure initialization failed:", error);
      throw error;
    }
  });

  it("re-invokes insecure initialization with different authority", async () => {
    try {
      const transaction = await program.methods
        .insecureInitialization()
        .accounts({
          user: insecureUserAccount.publicKey,
          authority: secondWallet.publicKey,
        })
        .signers([secondWallet])
        .transaction();

      await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        transaction,
        [secondWallet]
      );
    } catch (error) {
      console.error("Re-invocation of insecure initialization failed:", error);
      throw error;
    }
  });

  it("performs recommended initialization", async () => {
    try {
      await program.methods
        .recommendedInitialization()
        .accounts({
          user: recommendedUserAccount.publicKey,
        })
        .signers([recommendedUserAccount])
        .rpc();
    } catch (error) {
      console.error("Recommended initialization failed:", error);
      throw error;
    }
  });

  it("fails to re-invoke recommended initialization with different authority", async () => {
    try {
      const transaction = await program.methods
        .recommendedInitialization()
        .accounts({
          user: recommendedUserAccount.publicKey,
          authority: secondWallet.publicKey,
        })
        .transaction();

      await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        transaction,
        [secondWallet, recommendedUserAccount],
        { commitment: "confirmed" }
      );

      throw new Error("Re-invocation succeeded unexpectedly");
    } catch (error) {
      if (error.message === "Re-invocation succeeded unexpectedly") {
        throw error;
      }

      if (error instanceof SendTransactionError) {
        console.log("Transaction failed as expected");
      } else {
        console.error("Unexpected error:", error);
      }
      console.log(error);
      expect(error).to.exist;
    }
  });
});
