use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod token_locker {
    use super::*;

    // Lock tokens into vault
    pub fn lock_tokens(
        ctx: Context<LockTokens>,
        lock_id: u32,
        amount: u64,
        duration: i64, // Duration in seconds
    ) -> Result<()> {
        // Initialize lock info
        let lock_info = &mut ctx.accounts.lock_info;
        lock_info.user = ctx.accounts.user.key();
        lock_info.lock_id = lock_id;
        lock_info.amount = amount;
        lock_info.mint = ctx.accounts.mint.key();
        lock_info.vault_bump = ctx.bumps.vault_pda;
        lock_info.lock_time = Clock::get()?.unix_timestamp;
        lock_info.unlock_time = lock_info.lock_time + duration;
        
        // Transfer tokens to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                }
            ),
            amount,
        )?;
        
        msg!("Locked {} tokens until {}", amount, lock_info.unlock_time);
        Ok(())
    }

    // Unlock tokens from vault
    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let lock_info = &ctx.accounts.lock_info;
        
        // Verify unlock conditions
        require!(
            Clock::get()?.unix_timestamp >= lock_info.unlock_time,
            LockError::LockNotExpired
        );
        
        require!(
            lock_info.user == ctx.accounts.user.key(),
            LockError::UnauthorizedUser
        );
        
        // Transfer tokens back to user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault_pda.to_account_info(),
                },
                &[&[
                    b"vault",
                    lock_info.mint.as_ref(),
                    &[lock_info.vault_bump],
                ]]
            ),
            lock_info.amount,
        )?;
        
        // Close lock account and refund rent
        let lock_account = &mut ctx.accounts.lock_info;
        let dest_account = &mut ctx.accounts.user;
        let account = lock_account.to_account_info();
        **dest_account.lamports.borrow_mut() += account.lamports();
        **account.lamports.borrow_mut() = 0;
        
        msg!("Unlocked {} tokens", lock_info.amount);
        Ok(())
    }
}

// Lock metadata storage
#[account]
pub struct LockInfo {
    pub user: Pubkey,          // 32 bytes
    pub lock_id: u32,          // 4 bytes
    pub amount: u64,           // 8 bytes
    pub mint: Pubkey,          // 32 bytes
    pub vault_bump: u8,        // 1 byte
    pub lock_time: i64,        // 8 bytes
    pub unlock_time: i64,      // 8 bytes
} // Total: 93 bytes + 8 discriminator = 101 bytes

// Lock tokens context
#[derive(Accounts)]
#[instruction(lock_id: u32, amount: u64)]
pub struct LockTokens<'info> {
    #[account(init, payer = user, space = 101,
              seeds = [b"lock", user.key().as_ref(), &lock_id.to_le_bytes()], bump)]
    pub lock_info: Account<'info, LockInfo>,
    
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut,
              constraint = vault_token_account.mint == mint.key(),
              address = get_associated_token_address(&vault_pda.key(), &mint.key()))]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(seeds = [b"vault", mint.key().as_ref()], bump)]
    pub vault_pda: SystemAccount<'info>,
    
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

// Unlock tokens context
#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut, has_one = user, close = user)]
    pub lock_info: Account<'info, LockInfo>,
    
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut,
              constraint = vault_token_account.mint == lock_info.mint,
              address = get_associated_token_address(&vault_pda.key(), &lock_info.mint))]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(seeds = [b"vault", lock_info.mint.as_ref()], bump = lock_info.vault_bump)]
    pub vault_pda: SystemAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[error_code]
pub enum LockError {
    #[msg("Lock period has not expired")]
    LockNotExpired,
    #[msg("Unauthorized user")]
    UnauthorizedUser,
    #[msg("Invalid vault token account")]
    InvalidVault,
}