use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod initialization {
    use super::*;

    pub fn insecure_initialization(ctx: Context<Unchecked>) -> Result<()> {
        let mut user = UserInsecure::try_from_slice(&ctx.accounts.user.data.borrow()).unwrap();
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
    #[account(init, payer = authority, space = 8+32)]
    user: Account<'info, UserRecommended>,
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct UserInsecure {
    authority: Pubkey,
}

#[account]
pub struct UserRecommended {
    authority: Pubkey,
}
