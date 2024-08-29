use anchor_lang::prelude::*;

declare_id!("GWnpZShH6t6k5bQ26r676jcvB6HpunpWh1wMaKTLMKmY");

#[program]
pub mod initialization {
    use super::*;

    pub fn insecure_initialization(ctx: Context<Unchecked>) -> Result<()> {
        let mut user = User::try_from_slice(&ctx.accounts.user.data.borrow()).unwrap();
        user.authority = ctx.accounts.authority.key();
        user.serialize(&mut *ctx.accounts.user.data.borrow_mut())?;
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

#[account]
#[derive(InitSpace)]
pub struct User {
    authority: Pubkey,
}
