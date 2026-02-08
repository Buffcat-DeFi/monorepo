use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use pyth_sdk_solana::{load_price_feed, Price, PriceFeed};
use std::convert::TryInto;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod buffcat {
    use super::*;

    // Initialize global configuration
    pub fn initialize_global_config(
        ctx: Context<InitializeGlobalConfig>,
        developer_wallet: Pubkey,
    ) -> Result<()> {
        let global_config = &mut ctx.accounts.global_config;
        global_config.admin = *ctx.accounts.admin.key;
        global_config.developer_wallet = developer_wallet;
        global_config.founder_wallet = *ctx.accounts.admin.key;
        global_config.fee_percentage = 500; // 5% in basis points (500/10000 = 5%)
        global_config.fee_split = FeeDistribution {
            reward_pool: 8000, // 80%
            marketing: 500,    // 5%
            development: 500,  // 5%
            developer_wallet: 1000, // 10%
        };
        global_config.min_lock_value = 500 * 10u64.pow(6); // $500 USD with 6 decimals
        global_config.max_lock_duration = 3000 * 24 * 60 * 60; // 3000 days in seconds
        global_config.min_lock_duration = 24 * 60 * 60; // 1 day in seconds
        global_config.max_non_stable_reward_cap = 1000; // 10% in basis points
        global_config.max_stable_reward_cap = 300; // 3% in basis points
        global_config.minimum_reward_usd = 1 * 10u64.pow(6); // $1 USD with 6 decimals
        global_config.paused = false;
        global_config.daily_non_stable_claim_limit = 0;
        global_config.daily_stable_claim_limit = 0;
        global_config.last_update_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // Lock assets
    pub fn lock_assets(
        ctx: Context<LockAssets>,
        amount: u64,
        lock_duration: u64,
        lock_type: LockType,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        require!(!ctx.accounts.global_config.paused, BuffcatError::ContractPaused);
        
        // Validate lock duration
        let duration_seconds = lock_duration * 24 * 60 * 60;
        require!(
            duration_seconds >= ctx.accounts.global_config.min_lock_duration &&
            duration_seconds <= ctx.accounts.global_config.max_lock_duration,
            BuffcatError::InvalidLockDuration
        );

        // Calculate USD value
        let price_feed = load_price_feed(&ctx.accounts.price_feed).map_err(|_| BuffcatError::InvalidPriceFeed)?;
        let current_price = price_feed.get_current_price().ok_or(BuffcatError::InvalidPriceFeed)?;
        let token_value_usd = calculate_token_value(
            amount,
            ctx.accounts.token_mint.decimals,
            current_price
        )?;
        
        require!(
            token_value_usd >= ctx.accounts.global_config.min_lock_value,
            BuffcatError::InsufficientLockValue
        );

        // Process token transfer
        let fee = ctx.accounts.global_config.fee_percentage
            .checked_mul(amount)
            .and_then(|v| v.checked_div(10000))
            .ok_or(BuffcatError::MathOverflow)?;
        
        let deposit_amount = amount.checked_sub(fee).ok_or(BuffcatError::MathOverflow)?;
        
        // Transfer main deposit
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            deposit_amount,
        )?;

        // Transfer fee portion
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.fee_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            fee,
        )?;

        // Distribute fees
        distribute_fees(
            &ctx.accounts.token_program,
            &ctx.accounts.fee_vault,
            &ctx.accounts.developer_token_account,
            &ctx.accounts.founder_token_account,
            &ctx.accounts.pool_vault,
            fee,
            ctx.accounts.global_config.fee_split,
            ctx.accounts.token_config.stable,
        )?;

        // Create lock account
        let lock_account = &mut ctx.accounts.lock_account;
        lock_account.user = *ctx.accounts.user.key;
        lock_account.amount = deposit_amount;
        lock_account.lock_start = Clock::get()?.unix_timestamp;
        lock_account.lock_end = lock_account.lock_start + duration_seconds as i64;
        lock_account.lock_type = lock_type;
        lock_account.token_mint = ctx.accounts.token_mint.key();
        lock_account.last_claim = 0;
        lock_account.withdrawn = 0;
        lock_account.duration = duration_seconds;
        lock_account.unclaimed_days = 0;
        lock_account.acceptable_unlock_timestamp = 0;

        // Handle referral
        if let Some(referrer) = referrer {
            if referrer != *ctx.accounts.user.key {
                // Apply referral boost
                let mut user_state = &mut ctx.accounts.user_state;
                if user_state.referral_boost_end_time < Clock::get()?.unix_timestamp {
                    user_state.referral_boost_end_time = Clock::get()?.unix_timestamp + 24 * 60 * 60;
                } else {
                    user_state.referral_boost_end_time = (user_state.referral_boost_end_time + 24 * 60 * 60)
                        .min(Clock::get()?.unix_timestamp + 30 * 24 * 60 * 60);
                }
                
                // Apply to referrer
                let referrer_state = &mut ctx.accounts.referrer_state;
                if referrer_state.referral_boost_end_time < Clock::get()?.unix_timestamp {
                    referrer_state.referral_boost_end_time = Clock::get()?.unix_timestamp + 24 * 60 * 60;
                } else {
                    referrer_state.referral_boost_end_time = (referrer_state.referral_boost_end_time + 24 * 60 * 60)
                        .min(Clock::get()?.unix_timestamp + 30 * 24 * 60 * 60);
                }
                
                emit!(ReferralSet {
                    user: *ctx.accounts.user.key,
                    referrer,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            }
        }

        emit!(LockCreated {
            user: *ctx.accounts.user.key,
            locked_token: ctx.accounts.token_mint.key(),
            lock_id: ctx.accounts.user_state.lock_count,
            amount: deposit_amount,
            lock_duration: duration_seconds,
            lock_type,
            unclaimed_days: 0,
        });

        // Update user state
        ctx.accounts.user_state.lock_count = ctx.accounts.user_state.lock_count.checked_add(1).ok_or(BuffcatError::MathOverflow)?;
        ctx.accounts.user_state.participate = true;

        Ok(())
    }

    // Claim rewards
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        lock_id: u64,
        token_mint: Pubkey,
        days_to_claim: u64,
        store_for_later: bool,
    ) -> Result<()> {
        require!(!ctx.accounts.global_config.paused, BuffcatError::ContractPaused);
        
        let lock_account = &mut ctx.accounts.lock_account;
        let clock = Clock::get()?;
        
        // Validate claim
        require!(
            lock_account.last_claim == 0 || 
            clock.unix_timestamp - lock_account.last_claim >= 24 * 60 * 60,
            BuffcatError::ClaimTooSoon
        );
        
        // Update daily limits if needed
        if clock.unix_timestamp - ctx.accounts.global_config.last_update_timestamp >= 24 * 60 * 60 {
            update_daily_claim_limits(&mut ctx.accounts.global_config)?;
        }

        // Get locked token price
        let lock_token_price = load_price_feed(&ctx.accounts.lock_price_feed)
            .map_err(|_| BuffcatError::InvalidPriceFeed)?
            .get_current_price()
            .ok_or(BuffcatError::InvalidPriceFeed)?;
        
        // Get locked token config
        let token_config = &ctx.accounts.token_config;
        
        // Calculate rewards in USD
        let rewards_usd = calculate_user_rewards(
            lock_account,
            &ctx.accounts.user_state,
            lock_token_price,
            token_config.stable,
            &ctx.accounts.global_config,
            clock.unix_timestamp,
        )?;
        
        // Get reward token price
        let reward_token_price = load_price_feed(&ctx.accounts.reward_price_feed)
            .map_err(|_| BuffcatError::InvalidPriceFeed)?
            .get_current_price()
            .ok_or(BuffcatError::InvalidPriceFeed)?;
        
        // Calculate token amount
        let token_amount = calculate_token_amount(
            rewards_usd,
            ctx.accounts.reward_token_mint.decimals,
            reward_token_price,
        )?;
        
        // Cap at available amount
        let token_amount = token_amount.min(ctx.accounts.reward_vault.amount);
        require!(token_amount > 0, BuffcatError::NoRewardsToClaim);

        if store_for_later {
            // Store rewards for later
            let stored_rewards = &mut ctx.accounts.stored_rewards;
            stored_rewards.amount = stored_rewards.amount.checked_add(token_amount).ok_or(BuffcatError::MathOverflow)?;
            
            emit!(StoredRewardsAdded {
                user: *ctx.accounts.user.key,
                token: token_mint,
                lock_id,
                amount: token_amount,
            });
        } else {
            // Claim immediately
            let fee = ctx.accounts.global_config.fee_percentage
                .checked_mul(token_amount)
                .and_then(|v| v.checked_div(10000))
                .ok_or(BuffcatError::MathOverflow)?;
            
            let claim_amount = token_amount.checked_sub(fee).ok_or(BuffcatError::MathOverflow)?;
            
            // Transfer to user
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.reward_vault.to_account_info(),
                        to: ctx.accounts.user_reward_token_account.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                ).with_signer(&[&ctx.accounts.authority_seeds]),
                claim_amount,
            )?;
            
            // Distribute fee
            distribute_reward_fee(
                &ctx.accounts.token_program,
                &ctx.accounts.reward_vault,
                &ctx.accounts.developer_token_account,
                &ctx.accounts.founder_token_account,
                &ctx.accounts.pool_authority,
                &ctx.accounts.authority_seeds,
                fee,
                ctx.accounts.global_config.fee_split,
            )?;
            
            // Update global state
            if token_config.stable {
                ctx.accounts.global_config.stable_pool_value = ctx.accounts.global_config.stable_pool_value
                    .saturating_sub(rewards_usd);
                ctx.accounts.global_config.daily_stable_claim_limit = ctx.accounts.global_config.daily_stable_claim_limit
                    .saturating_sub(rewards_usd);
            } else {
                ctx.accounts.global_config.non_stable_pool_value = ctx.accounts.global_config.non_stable_pool_value
                    .saturating_sub(rewards_usd);
                ctx.accounts.global_config.daily_non_stable_claim_limit = ctx.accounts.global_config.daily_non_stable_claim_limit
                    .saturating_sub(rewards_usd);
            }
            
            emit!(RewardsClaimed {
                user: *ctx.accounts.user.key,
                token: token_mint,
                lock_id,
                amount: claim_amount,
                days_of_unclaimed: days_to_claim,
            });
        }

        // Update lock state
        lock_account.last_claim = clock.unix_timestamp;
        lock_account.unclaimed_days = 0;

        Ok(())
    }

    // Claim stored rewards
    pub fn claim_stored_rewards(
        ctx: Context<ClaimStoredRewards>,
        lock_id: u64,
        token_mint: Pubkey,
    ) -> Result<()> {
        require!(!ctx.accounts.global_config.paused, BuffcatError::ContractPaused);
        
        let clock = Clock::get()?;
        
        // Update daily limits if needed
        if clock.unix_timestamp - ctx.accounts.global_config.last_update_timestamp >= 24 * 60 * 60 {
            update_daily_claim_limits(&mut ctx.accounts.global_config)?;
        }

        let stored_rewards = &mut ctx.accounts.stored_rewards;
        require!(stored_rewards.amount > 0, BuffcatError::NoStoredRewardsToClaim);
        
        let token_amount = stored_rewards.amount;
        stored_rewards.amount = 0;
        
        // Get reward token price
        let reward_token_price = load_price_feed(&ctx.accounts.reward_price_feed)
            .map_err(|_| BuffcatError::InvalidPriceFeed)?
            .get_current_price()
            .ok_or(BuffcatError::InvalidPriceFeed)?;
        
        // Calculate USD value
        let rewards_usd = calculate_token_value(
            token_amount,
            ctx.accounts.reward_token_mint.decimals,
            reward_token_price,
        )?;
        
        // Check against daily limits
        let is_stable = ctx.accounts.token_config.stable;
        if is_stable {
            require!(
                rewards_usd <= ctx.accounts.global_config.daily_stable_claim_limit,
                BuffcatError::DailyClaimLimitExceeded
            );
            ctx.accounts.global_config.daily_stable_claim_limit -= rewards_usd;
        } else {
            require!(
                rewards_usd <= ctx.accounts.global_config.daily_non_stable_claim_limit,
                BuffcatError::DailyClaimLimitExceeded
            );
            ctx.accounts.global_config.daily_non_stable_claim_limit -= rewards_usd;
        }
        
        // Claim rewards
        let fee = ctx.accounts.global_config.fee_percentage
            .checked_mul(token_amount)
            .and_then(|v| v.checked_div(10000))
            .ok_or(BuffcatError::MathOverflow)?;
        
        let claim_amount = token_amount.checked_sub(fee).ok_or(BuffcatError::MathOverflow)?;
        
        // Transfer to user
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.user_reward_token_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
            ).with_signer(&[&ctx.accounts.authority_seeds]),
            claim_amount,
        )?;
        
        // Distribute fee
        distribute_reward_fee(
            &ctx.accounts.token_program,
            &ctx.accounts.reward_vault,
            &ctx.accounts.developer_token_account,
            &ctx.accounts.founder_token_account,
            &ctx.accounts.pool_authority,
            &ctx.accounts.authority_seeds,
            fee,
            ctx.accounts.global_config.fee_split,
        )?;
        
        // Update global state
        if is_stable {
            ctx.accounts.global_config.stable_pool_value = ctx.accounts.global_config.stable_pool_value
                .saturating_sub(rewards_usd);
        } else {
            ctx.accounts.global_config.non_stable_pool_value = ctx.accounts.global_config.non_stable_pool_value
                .saturating_sub(rewards_usd);
        }
        
        emit!(StoredRewardsClaimed {
            user: *ctx.accounts.user.key,
            token: token_mint,
            lock_id,
            amount: claim_amount,
        });

        Ok(())
    }

    // Unlock assets
    pub fn unlock_assets(
        ctx: Context<UnlockAssets>,
        amount: u64,
    ) -> Result<()> {
        let lock_account = &mut ctx.accounts.lock_account;
        let clock = Clock::get()?;
        
        // Validate unlock
        let remaining = lock_account.amount.checked_sub(lock_account.withdrawn).ok_or(BuffcatError::MathOverflow)?;
        require!(amount <= remaining, BuffcatError::InvalidUnlockAmount);
        require!(amount > 0, BuffcatError::InvalidUnlockAmount);
        
        if lock_account.lock_type == LockType::Fixed {
            require!(
                clock.unix_timestamp >= lock_account.lock_end,
                BuffcatError::LockNotExpired
            );
        }

        // Calculate fee only if above minimum threshold
        let fee = if remaining >= ctx.accounts.global_config.min_lock_value {
            ctx.accounts.global_config.fee_percentage
                .checked_mul(amount)
                .and_then(|v| v.checked_div(10000))
                .ok_or(BuffcatError::MathOverflow)?
        } else {
            0
        };
        
        let unlock_amount = amount.checked_sub(fee).ok_or(BuffcatError::MathOverflow)?;
        
        // Transfer tokens to user
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
            ).with_signer(&[&ctx.accounts.authority_seeds]),
            unlock_amount,
        )?;
        
        // Transfer fee if applicable
        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.fee_vault.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                ).with_signer(&[&ctx.accounts.authority_seeds]),
                fee,
            )?;
            
            // Distribute fee
            distribute_fees(
                &ctx.accounts.token_program,
                &ctx.accounts.fee_vault,
                &ctx.accounts.developer_token_account,
                &ctx.accounts.founder_token_account,
                &ctx.accounts.pool_vault,
                fee,
                ctx.accounts.global_config.fee_split,
                ctx.accounts.token_config.stable,
            )?;
        }

        // Update lock state
        lock_account.withdrawn = lock_account.withdrawn.checked_add(amount).ok_or(BuffcatError::MathOverflow)?;

        // Check if significant amount unlocked
        let acceptable_amount = lock_account.amount
            .checked_mul(97)
            .and_then(|v| v.checked_div(100))
            .ok_or(BuffcatError::MathOverflow)?;
        
        if lock_account.amount.checked_sub(lock_account.withdrawn).ok_or(BuffcatError::MathOverflow)? <= acceptable_amount {
            lock_account.acceptable_unlock_timestamp = clock.unix_timestamp;
            emit!(RewardMultiplierReset {
                user: *ctx.accounts.user.key,
                lock_id: lock_account.id,
            });
        }

        // Update user token tracking
        if lock_account.amount - lock_account.withdrawn == 0 {
            let user_state = &mut ctx.accounts.user_state;
            user_state.unique_tokens_count = user_state.unique_tokens_count.saturating_sub(1);
        }

        emit!(AssetUnlocked {
            user: *ctx.accounts.user.key,
            lock_id: lock_account.id,
            token: lock_account.token_mint,
            amount,
        });

        Ok(())
    }

    // Admin: Whitelist tokens
    pub fn whitelist_tokens(
        ctx: Context<AdminAction>,
        tokens: Vec<Pubkey>,
        whitelist: bool,
    ) -> Result<()> {
        for token in tokens {
            let mut token_config = TokenConfig::try_from(&token)?;
            token_config.whitelisted = whitelist;
            token_config.save(&mut ctx.accounts.token_config)?;
            
            if whitelist {
                emit!(TokenWhitelisted {
                    token,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            } else {
                emit!(TokenBlacklisted {
                    token,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            }
        }
        Ok(())
    }

    // Admin: Update pool value
    pub fn update_pool_value(
        ctx: Context<UpdatePoolValue>,
        new_non_stable_value: u64,
        new_stable_value: u64,
    ) -> Result<()> {
        let global_config = &mut ctx.accounts.global_config;
        global_config.non_stable_pool_value = new_non_stable_value;
        global_config.stable_pool_value = new_stable_value;
        global_config.last_update_timestamp = Clock::get()?.unix_timestamp;

        emit!(NonStablePoolValueUpdated {
            new_total_value: new_non_stable_value,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        emit!(StablePoolValueUpdated {
            new_total_value: new_stable_value,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Admin: Set stablecoin status
    pub fn set_stablecoin(
        ctx: Context<AdminAction>,
        token: Pubkey,
        is_stable: bool,
    ) -> Result<()> {
        let mut token_config = TokenConfig::try_from(&token)?;
        token_config.stable = is_stable;
        token_config.save(&mut ctx.accounts.token_config)?;
        
        if is_stable {
            emit!(StableCoinAdded {
                token,
                timestamp: Clock::get()?.unix_timestamp,
            });
        } else {
            emit!(StableCoinRemoved {
                token,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }
        
        Ok(())
    }

    // Admin: Pause/unpause contract
    pub fn set_paused(
        ctx: Context<AdminAction>,
        paused: bool,
    ) -> Result<()> {
        ctx.accounts.global_config.paused = paused;
        Ok(())
    }
}

// Helper functions
fn calculate_token_value(
    amount: u64,
    decimals: u8,
    price: Price,
) -> Result<u64> {
    let exponent = price.expo;
    let price_value = price.price as u128;
    
    let value = if exponent >= 0 {
        (amount as u128)
            .checked_mul(price_value)
            .ok_or(BuffcatError::MathOverflow)?
            .checked_div(10u128.pow(decimals as u32))
            .ok_or(BuffcatError::MathOverflow)?
            .checked_mul(10u128.pow(exponent.unsigned_abs() as u32))
            .ok_or(BuffcatError::MathOverflow)?
    } else {
        (amount as u128)
            .checked_mul(price_value)
            .ok_or(BuffcatError::MathOverflow)?
            .checked_div(10u128.pow(decimals as u32 + exponent.unsigned_abs() as u32))
            .ok_or(BuffcatError::MathOverflow)?
    };
    
    Ok(value as u64)
}

fn calculate_token_amount(
    usd_value: u64,
    decimals: u8,
    price: Price,
) -> Result<u64> {
    let exponent = price.expo;
    let price_value = price.price as u128;
    
    let amount = if exponent >= 0 {
        (usd_value as u128)
            .checked_mul(10u128.pow(decimals as u32))
            .ok_or(BuffcatError::MathOverflow)?
            .checked_div(price_value)
            .ok_or(BuffcatError::MathOverflow)?
            .checked_div(10u128.pow(exponent.unsigned_abs() as u32))
            .ok_or(BuffcatError::MathOverflow)?
    } else {
        (usd_value as u128)
            .checked_mul(10u128.pow(decimals as u32 + exponent.unsigned_abs() as u32))
            .ok_or(BuffcatError::MathOverflow)?
            .checked_div(price_value)
            .ok_or(BuffcatError::MathOverflow)?
    };
    
    Ok(amount as u64)
}

fn distribute_fees<'info>(
    token_program: &Program<'info, Token>,
    fee_vault: &Account<'info, TokenAccount>,
    developer_account: &Account<'info, TokenAccount>,
    founder_account: &Account<'info, TokenAccount>,
    pool_vault: &Account<'info, TokenAccount>,
    fee: u64,
    fee_split: FeeDistribution,
    is_stable: bool,
) -> Result<()> {
    // Calculate fee distribution
    let reward_fee = fee
        .checked_mul(fee_split.reward_pool)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    let marketing_fee = fee
        .checked_mul(fee_split.marketing)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    let development_fee = fee
        .checked_mul(fee_split.development)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    let developer_wallet_fee = fee
        .checked_mul(fee_split.developer_wallet)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;

    // Transfer to reward pool
    if reward_fee > 0 {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: fee_vault.to_account_info().clone(),
                    to: pool_vault.to_account_info().clone(),
                    authority: fee_vault.to_account_info().clone(),
                },
            ),
            reward_fee,
        )?;
        
        if is_stable {
            // Update stable pool value
        } else {
            // Update non-stable pool value
        }
    }

    // Transfer to founder (marketing + development)
    let founder_fee = marketing_fee.checked_add(development_fee).ok_or(BuffcatError::MathOverflow)?;
    if founder_fee > 0 {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: fee_vault.to_account_info().clone(),
                    to: founder_account.to_account_info().clone(),
                    authority: fee_vault.to_account_info().clone(),
                },
            ),
            founder_fee,
        )?;
    }

    // Transfer to developer
    if developer_wallet_fee > 0 {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: fee_vault.to_account_info().clone(),
                    to: developer_account.to_account_info().clone(),
                    authority: fee_vault.to_account_info().clone(),
                },
            ),
            developer_wallet_fee,
        )?;
    }

    emit!(DeveloperFeesDistributed {
        wallet: developer_account.owner,
        amount: developer_wallet_fee,
    });
    
    emit!(FounderFeesDistributed {
        wallet: founder_account.owner,
        amount: founder_fee,
    });

    Ok(())
}

fn distribute_reward_fee<'info>(
    token_program: &Program<'info, Token>,
    reward_vault: &Account<'info, TokenAccount>,
    developer_account: &Account<'info, TokenAccount>,
    founder_account: &Account<'info, TokenAccount>,
    pool_authority: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    fee: u64,
    fee_split: FeeDistribution,
) -> Result<()> {
    // Calculate fee distribution
    let marketing_fee = fee
        .checked_mul(fee_split.marketing)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    let development_fee = fee
        .checked_mul(fee_split.development)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    let developer_wallet_fee = fee
        .checked_mul(fee_split.developer_wallet)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;

    // Transfer to founder (marketing + development)
    let founder_fee = marketing_fee.checked_add(development_fee).ok_or(BuffcatError::MathOverflow)?;
    if founder_fee > 0 {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: reward_vault.to_account_info().clone(),
                    to: founder_account.to_account_info().clone(),
                    authority: pool_authority.clone(),
                },
            ).with_signer(&[authority_seeds]),
            founder_fee,
        )?;
    }

    // Transfer to developer
    if developer_wallet_fee > 0 {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: reward_vault.to_account_info().clone(),
                    to: developer_account.to_account_info().clone(),
                    authority: pool_authority.clone(),
                },
            ).with_signer(&[authority_seeds]),
            developer_wallet_fee,
        )?;
    }

    Ok(())
}

fn calculate_user_rewards(
    lock_account: &Account<LockAccount>,
    user_state: &Account<UserState>,
    lock_token_price: Price,
    is_stable: bool,
    global_config: &Account<GlobalConfig>,
    current_timestamp: i64,
) -> Result<u64> {
    // Calculate effective amount
    let effective_amount = lock_account.amount - lock_account.withdrawn;
    
    // Calculate USD value of locked tokens
    let locked_value_usd = calculate_token_value(
        effective_amount,
        // Decimals would be available from token config in real implementation
        6, // Assuming 6 decimals for simplicity
        lock_token_price,
    )?;
    
    // Calculate total multiplier
    let mut multiplier = 10000; // 100% in basis points
    
    // Apply duration boost
    if current_timestamp > lock_account.lock_start + (lock_account.duration as i64 / 2) &&
       lock_account.acceptable_unlock_timestamp == 0 {
        if lock_account.duration >= 30 * 24 * 60 * 60 { // 30 days
            multiplier += 3000; // 30% boost
        }
        if lock_account.duration >= 60 * 24 * 60 * 60 { // 60 days
            multiplier += 5000; // 50% boost
        }
        if lock_account.duration >= 120 * 24 * 60 * 60 { // 120 days
            multiplier += 7000; // 70% boost
        }
        
        // Apply referral boost
        if current_timestamp < user_state.referral_boost_end_time {
            multiplier += 5000; // 50% boost
        }
    }
    
    // Cap multiplier
    multiplier = multiplier.min(35000); // Max 350% boost
    
    // Calculate base rewards
    let rewards = if is_stable {
        locked_value_usd
            .checked_mul(global_config.max_stable_reward_cap)
            .and_then(|v| v.checked_div(10000))
            .ok_or(BuffcatError::MathOverflow)?
    } else {
        locked_value_usd
            .checked_mul(global_config.max_non_stable_reward_cap)
            .and_then(|v| v.checked_div(10000))
            .ok_or(BuffcatError::MathOverflow)?
    };
    
    // Apply multiplier
    let boosted_rewards = rewards
        .checked_mul(multiplier)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    // Apply minimum reward
    let final_rewards = boosted_rewards.max(global_config.minimum_reward_usd);
    
    // Cap at daily limit
    let daily_limit = if is_stable {
        global_config.daily_stable_claim_limit
    } else {
        global_config.daily_non_stable_claim_limit
    };
    
    Ok(final_rewards.min(daily_limit))
}

fn update_daily_claim_limits(global_config: &mut Account<GlobalConfig>) -> Result<()> {
    global_config.daily_non_stable_claim_limit = global_config.non_stable_pool_value
        .checked_mul(global_config.max_non_stable_reward_cap)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    global_config.daily_stable_claim_limit = global_config.stable_pool_value
        .checked_mul(global_config.max_stable_reward_cap)
        .and_then(|v| v.checked_div(10000))
        .ok_or(BuffcatError::MathOverflow)?;
    
    global_config.last_update_timestamp = Clock::get()?.unix_timestamp;
    
    emit!(DailyClaimLimitReset {
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

// Accounts
#[derive(Accounts)]
pub struct InitializeGlobalConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::LEN,
        seeds = [b"global_config"],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockAssets<'info> {
    #[account(mut, seeds = [b"global_config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + LockAccount::LEN,
        seeds = [b"lock", user.key().as_ref(), &user_state.lock_count.to_le_bytes()],
        bump
    )]
    pub lock_account: Account<'info, LockAccount>,
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserState::LEN,
        seeds = [b"user_state", referrer.key().as_ref()],
        bump,
        constraint = referrer.key() != user.key()
    )]
    pub referrer_state: Account<'info, UserState>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = global_config.developer_wallet)]
    pub developer_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = global_config.founder_wallet)]
    pub founder_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"pool_vault", token_mint.key().as_ref()],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"fee_vault", token_mint.key().as_ref()],
        bump
    )]
    pub fee_vault: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"token_config", token_mint.key().as_ref()],
        bump,
    )]
    pub token_config: Account<'info, TokenConfig>,
    pub price_feed: AccountInfo<'info>, // Pyth price account
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(lock_id: u64, token_mint: Pubkey)]
pub struct ClaimRewards<'info> {
    #[account(mut, seeds = [b"global_config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut,
        seeds = [b"lock", user.key().as_ref(), &[lock_id].as_ref()],
        bump,
        has_one = user
    )]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut, seeds = [b"user_state", user.key().as_ref()], bump)]
    pub user_state: Account<'info, UserState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub reward_token_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated = token_mint,
        seeds = [b"reward_vault", reward_token_mint.key().as_ref()],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated = user.key(),
        associated = reward_token_mint.key(),
        token::mint = reward_token_mint,
        token::authority = user
    )]
    pub user_reward_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"token_config", reward_token_mint.key().as_ref()],
        bump,
    )]
    pub token_config: Account<'info, TokenConfig>,
    #[account(
        mut,
        seeds = [b"stored_rewards", lock_account.key().as_ref(), reward_token_mint.key().as_ref()],
        bump
    )]
    pub stored_rewards: Account<'info, StoredRewards>,
    #[account(
        seeds = [b"pool_authority"],
        bump
    )]
    pub pool_authority: AccountInfo<'info>,
    pub lock_price_feed: AccountInfo<'info>, // for locked token
    pub reward_price_feed: AccountInfo<'info>, // for reward token
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(lock_id: u64)]
pub struct UnlockAssets<'info> {
    #[account(mut, seeds = [b"global_config"], bump)]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut,
        seeds = [b"lock", user.key().as_ref(), &[lock_id].as_ref()],
        bump,
        has_one = user
    )]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut, seeds = [b"user_state", user.key().as_ref()], bump)]
    pub user_state: Account<'info, UserState>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"pool_vault", lock_account.token_mint.as_ref()], bump)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"fee_vault", lock_account.token_mint.as_ref()], bump)]
    pub fee_vault: Account<'info, TokenAccount>,
    #[account(mut, address = global_config.developer_wallet)]
    pub developer_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = global_config.founder_wallet)]
    pub founder_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"pool_authority"],
        bump
    )]
    pub pool_authority: AccountInfo<'info>,
    #[account(
        seeds = [b"token_config", lock_account.token_mint.as_ref()],
        bump,
    )]
    pub token_config: Account<'info, TokenConfig>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ClaimStoredRewards<'info> {
    // Similar to ClaimRewards but without lock state changes
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut, seeds = [b"global_config"], bump, has_one = admin)]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut,
        seeds = [b"token_config", token_mint.key().as_ref()],
        bump,
    )]
    pub token_config: Account<'info, TokenConfig>,
    #[account(mut, address = global_config.admin)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePoolValue<'info> {
    #[account(mut, seeds = [b"global_config"], bump, has_one = admin)]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(mut, address = global_config.admin)]
    pub admin: Signer<'info>,
}

// State structures
#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub developer_wallet: Pubkey,
    pub founder_wallet: Pubkey,
    pub fee_percentage: u64, // basis points (100 = 1%)
    pub fee_split: FeeDistribution,
    pub min_lock_value: u64, // USD value (6 decimals)
    pub max_lock_duration: u64, // seconds
    pub min_lock_duration: u64, // seconds
    pub max_non_stable_reward_cap: u64, // basis points
    pub max_stable_reward_cap: u64, // basis points
    pub minimum_reward_usd: u64, // USD value (6 decimals)
    pub non_stable_pool_value: u64, // USD value (6 decimals)
    pub stable_pool_value: u64, // USD value (6 decimals)
    pub daily_non_stable_claim_limit: u64, // USD value (6 decimals)
    pub daily_stable_claim_limit: u64, // USD value (6 decimals)
    pub last_update_timestamp: i64,
    pub paused: bool,
}

impl GlobalConfig {
    pub const LEN: usize = 8 * 14 + FeeDistribution::LEN;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FeeDistribution {
    pub reward_pool: u64, // basis points
    pub marketing: u64,   // basis points
    pub development: u64, // basis points
    pub developer_wallet: u64, // basis points
}

impl FeeDistribution {
    pub const LEN: usize = 8 * 4;
}

#[account]
pub struct UserState {
    pub user: Pubkey,
    pub lock_count: u64,
    pub participate: bool,
    pub referral_boost_end_time: i64,
    pub unique_tokens_count: u64,
}

impl UserState {
    pub const LEN: usize = 32 + 8 + 1 + 8 + 8;
}

#[account]
pub struct LockAccount {
    pub id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub lock_start: i64,
    pub lock_end: i64,
    pub last_claim: i64,
    pub withdrawn: u64,
    pub duration: u64, // seconds
    pub unclaimed_days: u64,
    pub token_mint: Pubkey,
    pub lock_type: LockType,
    pub acceptable_unlock_timestamp: i64,
}

impl LockAccount {
    pub const LEN: usize = 8 + 32 + 8*5 + 32 + 1 + 8;
}

#[account]
pub struct TokenConfig {
    pub mint: Pubkey,
    pub whitelisted: bool,
    pub stable: bool,
}

impl TokenConfig {
    pub const LEN: usize = 32 + 1 + 1;
}

#[account]
pub struct StoredRewards {
    pub lock: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
}

impl StoredRewards {
    pub const LEN: usize = 32 + 32 + 8;
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LockType {
    Flexible,
    Fixed,
}

// Events
#[event]
pub struct LockCreated {
    pub user: Pubkey,
    pub locked_token: Pubkey,
    pub lock_id: u64,
    pub amount: u64,
    pub lock_duration: u64,
    pub lock_type: LockType,
    pub unclaimed_days: u64,
}

#[event]
pub struct AssetUnlocked {
    pub user: Pubkey,
    pub lock_id: u64,
    pub token: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub token: Pubkey,
    pub lock_id: u64,
    pub amount: u64,
    pub days_of_unclaimed: u64,
}

#[event]
pub struct StoredRewardsAdded {
    pub user: Pubkey,
    pub token: Pubkey,
    pub lock_id: u64,
    pub amount: u64,
}

#[event]
pub struct StoredRewardsClaimed {
    pub user: Pubkey,
    pub token: Pubkey,
    pub lock_id: u64,
    pub amount: u64,
}

#[event]
pub struct ReferralSet {
    pub user: Pubkey,
    pub referrer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TokenWhitelisted {
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TokenBlacklisted {
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StableCoinAdded {
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StableCoinRemoved {
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct NonStablePoolValueUpdated {
    pub new_total_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct StablePoolValueUpdated {
    pub new_total_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardMultiplierReset {
    pub user: Pubkey,
    pub lock_id: u64,
}

#[event]
pub struct DailyClaimLimitReset {
    pub timestamp: i64,
}

#[event]
pub struct DeveloperFeesDistributed {
    pub wallet: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FounderFeesDistributed {
    pub wallet: Pubkey,
    pub amount: u64,
}

// Error codes
#[error_code]
pub enum BuffcatError {
    #[msg("Contract is paused")]
    ContractPaused,
    #[msg("Invalid lock duration")]
    InvalidLockDuration,
    #[msg("Insufficient lock value")]
    InsufficientLockValue,
    #[msg("Invalid unlock amount")]
    InvalidUnlockAmount,
    #[msg("Lock not expired")]
    LockNotExpired,
    #[msg("Claim too soon")]
    ClaimTooSoon,
    #[msg("Invalid token")]
    InvalidToken,
    #[msg("Invalid price feed")]
    InvalidPriceFeed,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Daily claim limit exceeded")]
    DailyClaimLimitExceeded,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("No stored rewards to claim")]
    NoStoredRewardsToClaim,
    #[msg("Invalid address")]
    InvalidAddress,
    #[msg("Invalid token list")]
    InvalidTokenList,
    #[msg("Rewards for token depleted")]
    RewardsForTokenDepleted,
    #[msg("Lock already empty")]
    LockAlreadyEmpty,
}
