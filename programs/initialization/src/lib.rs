use anchor_lang::prelude::*;

declare_id!("HLhxJzFYjtXCET4HxnSzv27SpXg16FWNDi2LvrNmSvzH");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod initialization {
    use super::*;

    pub fn insecure_initialization(ctx: Context<Unchecked>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        let mut user_data = User::try_from_slice(&user.data.borrow())?;
        user_data.authority = ctx.accounts.authority.key();
        user_data.serialize(&mut *user.data.borrow_mut())?;
        Ok(())
    }
    pub fn recommended_initialization(ctx: Context<Checked>) -> Result<()> {
        ctx.accounts.user.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Checked<'info> {
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR_SIZE + User::INIT_SPACE
    )]
    user: Account<'info, User>,
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unchecked<'info> {
    #[account(mut)]
    /// CHECK: This account will be initialized in the instruction
    pub user: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct User {
    pub authority: Pubkey,
}