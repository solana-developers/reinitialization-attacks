use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

declare_id!("BFDgKQuumCANxDqP84d4uBjJNxGHa7GZACBgWimnPLVj");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod initialization {
    use super::*;

    pub fn insecure_initialization(ctx: Context<Unchecked>) -> Result<()> {
        let mut user = User::try_from_slice(&ctx.accounts.user.data.borrow()).unwrap();
        user.authority = ctx.accounts.authority.key();
        user.serialize(&mut *ctx.accounts.user.data.borrow_mut())?;
        Ok(())
    }
    pub fn recommended_initialization(ctx: Context<Checked>) -> Result<()> {
        ctx.accounts.user.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Unchecked<'info> {
    #[account(mut)]
    /// CHECK:
    user: UncheckedAccount<'info>,
    authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Checked<'info> {
    //#[account(init, seeds = [], bump ,payer = authority, space = DISCRIMINATOR_SIZE + UserInsecure::INIT_SPACE)]
    #[account(init,payer = authority, space = DISCRIMINATOR_SIZE + User::INIT_SPACE)]
    user: Account<'info, User>,
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct User {
    authority: Pubkey,
}
