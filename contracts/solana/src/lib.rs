use anchor_lang::accounts::account_info;
use anchor_lang::{accounts::signer, prelude::*};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::get_associated_token_address;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod buffcat {
    use super::*;

    // User Actions
    pub fn lock_assets(
        ctx: Context<LockAssets>, 
        lock_id: u32, 
        referrer: Pubkey, 
        referrer_lock_id: u32,
        amount: u64, 
        days: u16, 
        lock_type: LockType
    ) -> Result<()> {
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let token_mint = &ctx.accounts.token_mint;

        let user = &ctx.accounts.signer;
        let user_info = &mut ctx.accounts.user_info;
        let user_unique_locked_assets_info = &mut ctx.accounts.user_unique_locked_assets_info;
        let user_lock_info = &mut ctx.accounts.user_lock_info;
        let user_ata = &mut ctx.accounts.user_token_account;
        let referrer_lock_info = &ctx.accounts.referrer_lock_info;
        let referrer_info = &mut ctx.accounts.referrer_info;

        let token_info = &mut ctx.accounts.token_info;
        let global_info = &mut ctx.accounts.global_info;
        let vault_authority = &mut ctx.accounts.vault_authority;
        let vault_ata = &mut ctx.accounts.vault_token_account;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;
        let price_update = &ctx.accounts.price_update;

        require!(
            founder_ata.owner == global_info.founder_wallet,
            BuffcatError::InvalidFounderKey
        );
        require!(
            founder_ata.mint == token_mint.key(),
            BuffcatError::InvalidFounderATA
        );
        require!(
            developer_ata.owner == global_info.developer_wallet,
            BuffcatError::InvalidDeveloperKey
        );
        require!(
            developer_ata.mint == token_mint.key(),
            BuffcatError::InvalidDeveloperATA
        );

        if !user_info.is_initialized {
            user_info.is_initialized = true;
            user_info.owner = user.key();
            // other values are numerice so
            // they are set to 0 by default
        }
        else {
            require!(
                user_info.owner == user.key(),
                BuffcatError::Unauthorized
            );
        }

        if !user_unique_locked_assets_info.is_initialized {
            user_unique_locked_assets_info.is_initialized = true;
            user_unique_locked_assets_info.owner = user.key();
            user_unique_locked_assets_info.token = token_mint.key();
            // other values are numerice so
            // they are set to 0 by default
        }
        else {
            require!(
                user_unique_locked_assets_info.owner == user.key() &&
                user_unique_locked_assets_info.token == token_mint.key(),
                BuffcatError::Unauthorized
            );
        }

        require!(amount > global_info.min_lock_value as u64, 
            BuffcatError::InsufficientLockAmount
        );
        require!(token_info.whitelisted,
            BuffcatError::TokenNotWhitelisted
        );
        require!(
            days >= global_info.min_lock_duration as u16 &&
            days <= global_info.max_lock_duration,
            BuffcatError::InvalidLockDuration
        );

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        if !(referrer.key() == user.key()) &&
        referrer_lock_info.amount > 0 {
            if user_info.referral_boost_end_time == 0 {
                user_info.referral_boost_end_time = current_timestamp + ONE_DAY_IN_SECONDS as i64;
            }
            if referrer_info.referral_boost_end_time == 0 {
                referrer_info.referral_boost_end_time = current_timestamp + ONE_DAY_IN_SECONDS as i64;
            }
            else {
                let current_end = referrer_info.referral_boost_end_time;
                let thirty_days = 30 * ONE_DAY_IN_SECONDS as i64;
                let timestamp_after_thirty_days = current_timestamp + thirty_days;
                if current_end < timestamp_after_thirty_days {
                    let mut new_end = current_end + ONE_DAY_IN_SECONDS as i64;
                    if new_end > timestamp_after_thirty_days {
                        new_end = timestamp_after_thirty_days;
                    }
                    referrer_info.referral_boost_end_time = new_end;
                }
            }
        }

        // Transfer tokens to vault
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: user_ata.to_account_info(),
                    to: vault_ata.to_account_info(),
                    authority: user.to_account_info(),
                }
            ),
            amount,
        )?;

        let fee = calculate_fee(amount);
        let lock_amount = amount - fee;
        
        let token_price;
        let token_price_decimals;

        (
            token_price, 
            token_price_decimals, 
        ) = get_token_price(price_update, &token_info)?;

        distribute_fee(
            global_info, 
            token_info, 
            token_price, 
            token_price_decimals, 
            token_mint.decimals, 
            fee, 
            token_program, 
            &vault_authority, 
            &vault_ata, 
            &founder_ata, 
            &developer_ata
        )?;

        if user_unique_locked_assets_info.amount == 0 {
            user_info.unique_locked_tokens_count += 1;
        }
        user_unique_locked_assets_info.amount += lock_amount;

        global_info.users_count += 1;
        user_info.lock_count += 1;

        user_lock_info.owner = user.key();
        user_lock_info.lock_id = lock_id;
        user_lock_info.bump = user_lock_info.bump;
        user_lock_info.amount = lock_amount;
        user_lock_info.lock_start = current_timestamp;
        user_lock_info.lock_end = current_timestamp + ((days as u32 * ONE_DAY_IN_SECONDS) as i64);
        user_lock_info.lock_type = lock_type;
        user_lock_info.locked_token = token_mint.key();
        user_lock_info.days = days as u32;
        // other values are numerice so
        // they are set to 0 by default

        emit!(LockCreated { 
            user: user.key(),
            locked_token: token_mint.key(),
            lock_id: lock_id,
            amount: amount,
            days: days,
            lock_type: lock_type
        });

        Ok(())
    }

    pub fn unlock_assets(
        ctx: Context<UnlockAssets>, 
        lock_id: u32,
        amount: u64
    ) -> Result<()> {
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let token_mint =  &ctx.accounts.token_mint;

        let user = &ctx.accounts.signer;
        let user_info = &mut ctx.accounts.user_info;
        let user_unique_locked_assets_info = &mut ctx.accounts.user_unique_locked_assets_info;
        let user_lock_info = &mut ctx.accounts.user_lock_info;
        let user_ata = &mut ctx.accounts.user_token_account;

        let token_info = &mut ctx.accounts.token_info;
        let global_info = &mut ctx.accounts.global_info;
        let vault_authority = &mut ctx.accounts.vault_authority;
        let vault_ata = &mut ctx.accounts.vault_token_account;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;
        let price_update = &ctx.accounts.price_update;

        require!(
            founder_ata.owner == global_info.founder_wallet,
            BuffcatError::InvalidFounderKey
        );
        require!(
            founder_ata.mint == token_mint.key(),
            BuffcatError::InvalidFounderATA
        );
        require!(
            developer_ata.owner == global_info.developer_wallet,
            BuffcatError::InvalidDeveloperKey
        );
        require!(
            developer_ata.mint == token_mint.key(),
            BuffcatError::InvalidDeveloperATA
        );

        require!(user_lock_info.amount != 0, BuffcatError::InvalidUserLockId);
        let remaining_amount = user_lock_info.amount - user_lock_info.withdrawn;
        require!(remaining_amount != 0, BuffcatError::LockIsEmpty);
        require!(amount <= remaining_amount, BuffcatError::InvalidUnlockAmount);
        if remaining_amount >= global_info.min_lock_value as u64 {
            if amount < global_info.min_lock_value as u64 {
                return err!(BuffcatError::InvalidUnlockAmount);
            }
        }
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        if user_lock_info.lock_type == LockType::Fixed {
            if current_timestamp < user_lock_info.lock_end {
                return err!(BuffcatError::LockNotExpired);
            }
        }

        user_lock_info.withdrawn += amount;
        let mut unlock_amount = amount;

        if remaining_amount >= global_info.min_lock_value as u64 {
            let fee = calculate_fee(amount);
            unlock_amount = amount - fee;

            let token_price;
            let token_price_decimals;

            (
                token_price, 
                token_price_decimals, 
            ) = get_token_price(price_update, &token_info)?;

            distribute_fee(
                global_info, 
                token_info, 
                token_price, 
                token_price_decimals, 
                token_mint.decimals, 
                fee, 
                token_program, 
                &vault_authority, 
                &vault_ata, 
                &founder_ata, 
                &developer_ata
            )?;
        }

        if amount >= user_unique_locked_assets_info.amount {
            user_unique_locked_assets_info.amount = 0;
        }
        else {
            user_unique_locked_assets_info.amount = user_unique_locked_assets_info.amount - amount;
        }
        if user_unique_locked_assets_info.amount == 0 {
            if 1 >= user_info.unique_locked_tokens_count {
                user_info.unique_locked_tokens_count = 0;
            } 
            else {
                user_info.unique_locked_tokens_count = user_info.unique_locked_tokens_count - 1;
            }
        }

        // Transfer tokens to user
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: vault_ata.to_account_info(),
                    to: user_ata.to_account_info(),
                    authority: vault_authority.to_account_info(),
                }
            ),
            amount,
        )?;

        emit!(AssetsUnlocked { 
            user: user.key(),
            lock_id: lock_id,
            token: user_lock_info.locked_token,
            amount: amount,
        });

        Ok(())
    }

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>, 
        lock_id: u32,
        mut unclaimed_days: u32
    ) -> Result<()> {       
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let lock_token_mint = &ctx.accounts.lock_token_mint;
        let reward_token_mint = &ctx.accounts.reward_token_mint;

        let user = &ctx.accounts.signer;
        let user_info = &mut ctx.accounts.user_info;
        let user_lock_info = &mut ctx.accounts.user_lock_info;
        let user_reward_token_ata = &mut ctx.accounts.user_reward_token_account;

        let lock_token_info = &mut ctx.accounts.lock_token_info;
        let reward_token_info = &mut ctx.accounts.reward_token_info;
        let global_info = &mut ctx.accounts.global_info;
        let vault_reward_token_authority = &ctx.accounts.vault_reward_token_authority;
        let vault_reward_token_ata = &ctx.accounts.vault_reward_token_account;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;
        let price_update = &ctx.accounts.price_update;

        require!(
            founder_ata.owner == global_info.founder_wallet,
            BuffcatError::InvalidFounderKey
        );
        require!(
            founder_ata.mint == reward_token_mint.key(),
            BuffcatError::InvalidFounderATA
        );
        require!(
            developer_ata.owner == global_info.developer_wallet,
            BuffcatError::InvalidDeveloperKey
        );
        require!(
            developer_ata.mint == reward_token_mint.key(),
            BuffcatError::InvalidDeveloperATA
        );

        require!(
            user_lock_info.amount != 0, 
            BuffcatError::InvalidUserLockId
        );
        require!(
            reward_token_info.claimable_amount != 0,
            BuffcatError::RewardsForTokenDepleted
        );

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        let mut last_claim_time = user_lock_info.last_claim;
        if last_claim_time == 0 {
            last_claim_time = user_lock_info.lock_start;
        }
        require!(current_timestamp - last_claim_time >= ONE_DAY_IN_SECONDS as i64, BuffcatError::ClaimTooSoon);

        if current_timestamp >= global_info.last_claim_limit_update_timestamp + ONE_DAY_IN_SECONDS as i64 {
            update_daily_claim_limit(global_info);
        }
        global_info.last_claim_limit_update_timestamp = current_timestamp;

        let lock_token_price;
        let lock_token_price_decimals;

        (
            lock_token_price, 
            lock_token_price_decimals, 
        ) = get_token_price(price_update, &lock_token_info)?;

        if lock_token_info.stable {
            require!(
                global_info.stable_daily_claim_limit > 0,
                BuffcatError::DailyClaimLimitExceeded
            );
        } else {
            require!(
                global_info.non_stable_daily_claim_limit > 0,
                BuffcatError::DailyClaimLimitExceeded
            );
        }

        let mut rewards = calculate_user_rewards(
            &*global_info, 
            &*user_lock_info, 
            &*user_info, 
            lock_token_info.stable,
            lock_token_price, 
            lock_token_price_decimals, 
            lock_token_mint.decimals
        )?;
        require!(
            rewards > 0,
            BuffcatError::NoRewardsToClaim
        );

        // Calculate valid days of unclaimed rewards
        let mut new_days_of_unclaimed_rewards = ((
            current_timestamp - user_lock_info.last_claim
        ) / ONE_DAY_IN_SECONDS as i64) as u32;
        if new_days_of_unclaimed_rewards <= 1 {
            new_days_of_unclaimed_rewards == 0;
        }
        new_days_of_unclaimed_rewards += user_lock_info.unclaimed_days;
        if unclaimed_days == 0u32 {
            user_lock_info.unclaimed_days = new_days_of_unclaimed_rewards as u32;
            unclaimed_days = 1u32;
        } else {
            if unclaimed_days < new_days_of_unclaimed_rewards {
                new_days_of_unclaimed_rewards -= unclaimed_days;
                user_lock_info.unclaimed_days = new_days_of_unclaimed_rewards;
            } else if unclaimed_days == new_days_of_unclaimed_rewards {
                user_lock_info.unclaimed_days = 0;
            } else {
                unclaimed_days = new_days_of_unclaimed_rewards;
                user_lock_info.unclaimed_days = 0;
            }
        }

        // Calculate total rewards
        rewards = rewards * unclaimed_days as u64;

        if lock_token_info.stable {
            if rewards > global_info.stable_daily_claim_limit {
                rewards = global_info.stable_daily_claim_limit;
            }
        } else {
            if rewards > global_info.non_stable_daily_claim_limit {
                rewards = global_info.non_stable_daily_claim_limit;
            }
        }

        let reward_token_price;
        let reward_token_price_decimals;

        (
            reward_token_price, 
            reward_token_price_decimals, 
        ) = get_token_price(price_update, &reward_token_info)?;

        let mut token_rewards = (
            rewards * 10u64.pow(
                reward_token_price_decimals + 
                reward_token_mint.decimals as u32
            )
        ) / (reward_token_price * 10u64.pow(6));

        if reward_token_info.claimable_amount < token_rewards {
            token_rewards = reward_token_info.claimable_amount as u64;
        }

        let fee = calculate_fee(token_rewards);
        distribute_fee(
            global_info, 
            reward_token_info, 
            reward_token_price, 
            reward_token_price_decimals, 
            reward_token_mint.decimals, 
            fee, 
            token_program, 
            &vault_reward_token_authority, 
            &vault_reward_token_ata, 
            &founder_ata, 
            &developer_ata
        )?;
        let deducted_token_rewards = token_rewards - fee;

        if reward_token_info.stable {
            if rewards >= global_info.stable_daily_claim_limit {
                global_info.stable_daily_claim_limit = 0;
            } else {
                global_info.stable_daily_claim_limit -= rewards;
            }
            remove_stable_token_from_pool(
                global_info, 
                reward_token_info, 
                deducted_token_rewards, 
                reward_token_price, 
                reward_token_price_decimals, 
                reward_token_mint.decimals
            );
        } else {
            if rewards >= global_info.non_stable_daily_claim_limit {
                global_info.non_stable_daily_claim_limit = 0;
            } else {
                global_info.non_stable_daily_claim_limit -= rewards;
            }
            remove_non_stable_token_from_pool(
                global_info, 
                reward_token_info, 
                deducted_token_rewards, 
                reward_token_price, 
                reward_token_price_decimals, 
                reward_token_mint.decimals
            );
        }

        // Transfer tokens to user
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: vault_reward_token_ata.to_account_info(),
                    to: user_reward_token_ata.to_account_info(),
                    authority: vault_reward_token_authority.to_account_info(),
                }
            ),
            deducted_token_rewards,
        )?;

        emit!(RewardsClaimed { 
            user: user.key(),
            token: reward_token_mint.key(),
            lock_id: lock_id,
            amount: deducted_token_rewards,
            days_of_unclaimed: unclaimed_days,
        });

        Ok(())
    }

    // Token price fetching 
    pub fn get_token_price<'info>(
        price_update: &Account<'info, PriceUpdateV2>,
        token_info: &Account<'info, TokenInfo>
    ) -> Result<(u64, u32)> {
        let token_price;
        let token_price_decimals;
        (
            token_price, 
            token_price_decimals
        ) = use_pyth_network(
            price_update, 
            token_info
        )?;

        let new_token_price;
        let new_token_price_decimals;

        if token_price_decimals < 0 {
            new_token_price = token_price.unsigned_abs();
            new_token_price_decimals = token_price_decimals.unsigned_abs();
        } else {
            new_token_price = 
            token_price.unsigned_abs() * 
            10u32.pow(token_price_decimals.unsigned_abs()) as u64;
            new_token_price_decimals = 0;
        }

        Ok((new_token_price, new_token_price_decimals))
    }

    pub fn use_pyth_network<'info>(
        price_update: &Account<'info, PriceUpdateV2>,
        token_info: &Account<'info, TokenInfo>
    ) -> Result<(i64, i32)> {
        let maximum_age: u64 = 30;
        let feed_id: [u8; 32] = token_info.feed.to_bytes();
        let price = price_update.get_price_no_older_than(
            &Clock::get()?, 
            maximum_age, 
            &feed_id
        )?;

        Ok((price.price, price.exponent))
    }

    // pool calculations
    pub fn distribute_fee<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        token_info: &mut Account<'info, TokenInfo>,
        token_price: u64, 
        token_price_decimals: u32, 
        token_decimals: u8,
        fee: u64, 
        token_program: &Program<'info, Token>, 
        vault_authority: &SystemAccount<'info>,
        vault_ata: &Account<'info, TokenAccount>,
        founder_ata: &Account<'info, TokenAccount>,
        developer_ata: &Account<'info, TokenAccount>
    ) -> Result<()> {
        let reward_pool_fee_split = (fee * global_info.fee_splits.reward_pool as u64) / 100;
        let marketing_fee_split = (fee * global_info.fee_splits.marketing as u64) / 100;        
        let development_fee_split = (fee * global_info.fee_splits.development as u64) / 100;
        let developer_fee_split = (fee * global_info.fee_splits.reward_pool as u64) / 100;

        if token_info.stable {
            add_stable_token_to_pool(
                global_info, 
                token_info, 
                reward_pool_fee_split, 
                token_price, 
                token_price_decimals, 
                token_decimals
            );
        }
        else {
            add_non_stable_token_to_pool(
                global_info, 
                token_info, 
                reward_pool_fee_split, 
                token_price, 
                token_price_decimals, 
                token_decimals);
        }

        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: vault_ata.to_account_info(),
                    to: founder_ata.to_account_info(),
                    authority: vault_authority.to_account_info(),
                }
            ),
            marketing_fee_split + development_fee_split,
        )?;

        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: vault_ata.to_account_info(),
                    to: developer_ata.to_account_info(),
                    authority: vault_authority.to_account_info(),
                }
            ),
            developer_fee_split,
        )?;

        emit!(DeveloperFeesDistributed {wallet: global_info.developer_wallet, amount: developer_fee_split});
        emit!(FounderFeesDistributed {wallet: global_info.founder_wallet, amount: marketing_fee_split + development_fee_split});
        emit!(TokensAddedToPool {token: token_info.key(), amount: reward_pool_fee_split});

        Ok(())
    }

    pub fn update_daily_claim_limit<'info>(global_info: &mut Account<'info, GlobalInfo>) {
        global_info.non_stable_daily_claim_limit = (global_info.non_stable_reward_pool * global_info.non_stable_daily_reward_cap as u64) / 100;
        global_info.stable_daily_claim_limit = (global_info.stable_reward_pool * global_info.stable_daily_reward_cap as u64) / 100;
    }
    
    pub fn add_non_stable_token_to_pool<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        token: &mut Account<'info, TokenInfo>, 
        mut amount: u64, 
        token_price: u64, 
        token_price_decimals: u32, 
        token_decimals: u8
    ) {
        if amount == 0 {
            return;
        }
        token.claimable_amount += amount;
        amount = token.claimable_amount;

        let added_usd_value: u64 = (amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if global_info.non_stable_reward_pool >= token.last_pool_update {
            global_info.non_stable_reward_pool -= token.last_pool_update;
        }
        else {
            global_info.non_stable_reward_pool = 0;
        }
        global_info.non_stable_reward_pool += added_usd_value;
        token.last_pool_update = added_usd_value;
    }

    pub fn add_stable_token_to_pool<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        token: &mut Account<'info, TokenInfo>, 
        mut amount: u64, 
        token_price: u64, 
        token_price_decimals: u32, 
        token_decimals: u8
    ) {
        if amount == 0 {
            return;
        }
        token.claimable_amount += amount;
        amount = token.claimable_amount;

        let added_usd_value: u64 = (amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if global_info.stable_reward_pool >= token.last_pool_update {
            global_info.stable_reward_pool -= token.last_pool_update;
        }
        else {
            global_info.stable_reward_pool = 0;
        }
        global_info.stable_reward_pool += added_usd_value;
        token.last_pool_update = added_usd_value;
    }

    pub fn remove_non_stable_token_from_pool<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        token: &mut Account<'info, TokenInfo>, 
        amount: u64, 
        token_price: u64, 
        token_price_decimals: u32, 
        token_decimals: u8
    ) {
        if global_info.non_stable_reward_pool >= token.last_pool_update {
            global_info.non_stable_reward_pool -= token.last_pool_update;
        }
        else {
            global_info.non_stable_reward_pool = 0;
        }
        global_info.non_stable_reward_pool += (token.claimable_amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if token.claimable_amount >= amount {
            token.claimable_amount -= amount;
        }
        else {
            token.claimable_amount = 0;
        }
        let removed_usd_value = (amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if global_info.non_stable_reward_pool >= removed_usd_value {
            global_info.non_stable_reward_pool -= removed_usd_value;
        }
        else {
            global_info.non_stable_reward_pool = 0;
        }
        token.last_pool_update = (token.claimable_amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
    } 

    pub fn remove_stable_token_from_pool<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        token: &mut Account<'info, TokenInfo>, 
        amount: u64, 
        token_price: u64, 
        token_price_decimals: u32, 
        token_decimals: u8
    ) {
        if global_info.stable_reward_pool >= token.last_pool_update {
            global_info.stable_reward_pool -= token.last_pool_update;
        }
        else {
            global_info.stable_reward_pool = 0;
        }
        global_info.stable_reward_pool += (token.claimable_amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if token.claimable_amount >= amount {
            token.claimable_amount -= amount;
        }
        else {
            token.claimable_amount = 0;
        }
        let removed_usd_value = (amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
        if global_info.stable_reward_pool >= removed_usd_value {
            global_info.stable_reward_pool -= removed_usd_value;
        }
        else {
            global_info.stable_reward_pool = 0;
        }
        token.last_pool_update = (token.claimable_amount * token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(token_price_decimals + token_decimals as u32);
    }  

    // Fee Calculation
    pub fn calculate_fee(amount: u64) -> u64 {
        return (amount * 5) / 100;
    }
    
    // Reward Calculations
    pub fn calculate_user_rewards<'info>(
        global_info: &Account<'info, GlobalInfo>, 
        lock: &Account<'info, UserLockInfo>, 
        user_info: &Account<'info, UserInfo>, 
        is_lock_token_stable: bool, 
        lock_token_price: u64, 
        lock_token_price_decimals: u32, 
        lock_token_decimals: u8
    ) -> Result<u64> {
        let mut rewards: u64 = 0;
        let remaining_amount: u64 = lock.amount - lock.withdrawn;
        let remaining_amount_usd_value: u64 = (remaining_amount * lock_token_price * global_info.usd_scaler as u64) 
        / 10u64.pow(lock_token_price_decimals + lock_token_decimals as u32);
        if is_lock_token_stable {
            let total_rewards = (remaining_amount_usd_value * global_info.stable_daily_claim_limit) / global_info.stable_reward_pool;
            let daily_rewards = (total_rewards * global_info.stable_daily_reward_cap as u64) / 100000;
            let mut valid_rewards = global_info.min_usd_reward as u64;
            if daily_rewards > global_info.min_usd_reward as u64 {
                valid_rewards = daily_rewards;
            }
            rewards = valid_rewards;
        }
        else {
            let multiplier = calculate_total_multiplier(lock, user_info)?;
            let user_weighted = (remaining_amount_usd_value * multiplier as u64) / 100;
            let total_rewards = (user_weighted * global_info.non_stable_daily_claim_limit) / global_info.non_stable_reward_pool;
            let daily_rewards = (total_rewards * global_info.non_stable_daily_reward_cap as u64) / 100;
            let mut valid_rewards = global_info.min_usd_reward as u64;
            if daily_rewards > global_info.min_usd_reward as u64 {
                valid_rewards = daily_rewards;
            }
            rewards = valid_rewards;
        }
        Ok(rewards)
    }

    pub fn calculate_total_multiplier<'info>(lock: &Account<'info, UserLockInfo>, user_info: &Account<'info, UserInfo>) -> Result<u16> {
        let mut multiplier: u16 = 0;
        let effective_amount: u64 = lock.amount - lock.withdrawn;
        let acceptable_amount: u64 = (lock.amount * 97) / 100;
        let is_eligible = is_eligible_for_boost(lock.lock_start, lock.days)?;
        let mut is_almost_empty = false;
        if effective_amount < lock.amount - acceptable_amount {
            is_almost_empty = true;
        }
        if is_eligible && is_almost_empty {
            multiplier += calculate_duration_multiplier(lock.days);
            if user_info.unique_locked_tokens_count >= 2 {
                multiplier += calculate_diversification_multiplier(user_info.unique_locked_tokens_count);
            }
            multiplier += calculate_referral_multiplier(user_info.referral_boost_end_time)?;
        }
        if multiplier > 350 {
            multiplier = 350;
        }
        Ok(multiplier)
    }

    pub fn is_eligible_for_boost(lock_start: i64, days: u32) -> Result<bool> {
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        let half_duration: i64 = lock_start + ((days as i64 / 2) * 86400);
        let mut eligible: bool = false;
        if half_duration >= current_timestamp {
            eligible = true;
        }
        Ok(eligible)
    }

    pub fn calculate_duration_multiplier(days: u32) -> u16 {
        let mut multiplier: u16 = 0;
        if days >= 30 {
            multiplier = 30;
        }
        if days >= 60 {
            multiplier = 80;
        }
        if days >= 120 {
            multiplier = 150;
        }
        return multiplier;
    }

    pub fn calculate_diversification_multiplier(unique_locked_tokens_count: u8) -> u16 {
        let mut multiplier: u16 = 0;
        if unique_locked_tokens_count >= 2 {
            multiplier = 30;
        }
        if unique_locked_tokens_count >= 3 {
            multiplier = 80;
        }
        if unique_locked_tokens_count >= 6 {
            multiplier = 150;
        }
        return multiplier;
    }

    pub fn calculate_referral_multiplier(referral_boost_end_time: i64) -> Result<u16> {    
        let mut multiplier: u16 = 0;
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        if referral_boost_end_time > current_timestamp {
            multiplier = 50;
        } 
        Ok(multiplier)
    }

    // Authorized Functions
    pub fn update_pool_value<'info>(
        global_info: &mut Account<'info, GlobalInfo>, 
        new_non_stable_reward_pool: u64, 
        new_stable_reward_pool: u64
    ) {
        global_info.non_stable_reward_pool = new_non_stable_reward_pool;
        global_info.stable_reward_pool = new_stable_reward_pool;
    } 
}

// verify user accounts are owned by signer using constraint
#[derive(Accounts)]
#[instruction(lock_id: u32, referrer: Pubkey, referrer_lock_id: u32)]
pub struct LockAssets<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    // Token Mint :-
    #[account(
        constraint = token_mint.is_initialized @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    // User Accounts :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = [
            LOCK_INFO_STATIC_SEED, 
            signer.key().as_ref(), 
            &lock_id.to_le_bytes()
        ],
        bump,
        payer = signer,
        space = 8 + UserLockInfo::LEN,
    )] 
    pub user_lock_info: Account<'info, UserLockInfo>,
    #[account(
        init_if_needed,
        seeds = [
            USER_UNIQUE_LOCKED_ASSETS_INFO_STATIC_SEED, 
            signer.key().as_ref(), 
            token_mint.key().as_ref()
        ],
        bump,
        payer = signer,
        space = 8 + UserUniqueLockedAssetsInfo::LEN,
    )] 
    pub user_unique_locked_assets_info: Account<'info, UserUniqueLockedAssetsInfo>,
    #[account(
        init_if_needed,
        seeds = [USER_INFO_STATIC_SEED, signer.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + UserInfo::LEN,
    )] 
    pub user_info: Account<'info, UserInfo>,
    #[account(
        mut, 
        constraint = user_token_account.owner == signer.key() && 
        user_token_account.mint == token_mint.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [
            LOCK_INFO_STATIC_SEED, 
            referrer.key().as_ref(), 
            &referrer_lock_id.to_le_bytes()
        ],
        bump,
    )] 
    pub referrer_lock_info: Account<'info, UserLockInfo>,
    #[account(
        mut,
        seeds = [USER_INFO_STATIC_SEED, referrer.key().as_ref()],
        bump,
        constraint = referrer_info.owner == referrer.key()
    )] 
    pub referrer_info: Account<'info, UserInfo>,

    // Contract Accounts :-
    #[account(
        seeds = [VAULT_STATIC_SEED, token_mint.key().as_ref()], 
        bump,
    )]
    pub vault_authority: SystemAccount<'info>,
    #[account(
        mut,
        constraint = vault_token_account.mint == token_mint.key() && 
        vault_token_account.owner == vault_authority.key(),
        address = get_associated_token_address(
            &vault_authority.key(), 
            &token_mint.key()
        ))]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut, 
        seeds = [TOKEN_INFO_STATIC_SEED, token_mint.key().as_ref()], 
        bump,
        constraint = token_info.token == token_mint.key()
    )]
    pub token_info: Account<'info, TokenInfo>,
    #[account(
        mut, 
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
    )]
    pub global_info: Account<'info, GlobalInfo>,
    #[account()]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account()]
    pub developer_ata: Account<'info, TokenAccount>,  

    // Pyth Network 
    pub price_update: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
#[instruction(lock_id: u32)]
pub struct UnlockAssets<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    // Token Mint :-
    #[account(
        constraint = user_lock_info.locked_token == token_mint.key() &&
        token_mint.is_initialized @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    // User Accounts :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            LOCK_INFO_STATIC_SEED, 
            signer.key().as_ref(), 
            &lock_id.to_le_bytes()
        ],
        bump,
        constraint = user_lock_info.owner == signer.key() &&
        user_lock_info.locked_token == token_mint.key()

    )] 
    pub user_lock_info: Account<'info, UserLockInfo>,
    #[account(
        mut,
        seeds = [
            USER_UNIQUE_LOCKED_ASSETS_INFO_STATIC_SEED, 
            signer.key().as_ref(), 
            user_lock_info.locked_token.as_ref()
        ],
        bump,
        constraint = user_unique_locked_assets_info.owner == signer.key() &&
        user_unique_locked_assets_info.token == user_lock_info.locked_token
    )] 
    pub user_unique_locked_assets_info: Account<'info, UserUniqueLockedAssetsInfo>,
    #[account(
        mut,
        seeds = [USER_INFO_STATIC_SEED, signer.key().as_ref()],
        bump,
        constraint = user_info.owner == signer.key()
    )] 
    pub user_info: Account<'info, UserInfo>,
    #[account(
        mut, 
        constraint = user_token_account.owner == signer.key() && 
        user_token_account.mint == user_lock_info.locked_token
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // Contract Accounts :-
    #[account(seeds = [VAULT_STATIC_SEED, user_lock_info.locked_token.as_ref()], bump)]
    pub vault_authority: SystemAccount<'info>,
    #[account(
        mut,
        constraint = vault_token_account.mint == user_lock_info.locked_token && 
        vault_token_account.owner == vault_authority.key(),
        address = get_associated_token_address(
            &vault_authority.key(), 
            &user_lock_info.locked_token
        ))]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            user_lock_info.locked_token.as_ref()
            ], 
        bump,
        constraint = token_info.token == user_lock_info.locked_token
    )]
    pub token_info: Account<'info, TokenInfo>,
    #[account(mut, seeds = [GLOBAL_INFO_STATIC_SEED], bump)]
    pub global_info: Account<'info, GlobalInfo>,
    #[account()]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account()]
    pub developer_ata: Account<'info, TokenAccount>,

    // Pyth Network 
    pub price_update: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
#[instruction(lock_id: u32)]
pub struct ClaimRewards<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    // Lock Token Mint
    #[account(
        constraint = user_lock_info.locked_token == lock_token_mint.key() &&
        lock_token_mint.is_initialized @ ProgramError::UninitializedAccount
    )]
    pub lock_token_mint: Account<'info, Mint>,

    // Reward Token Mint
    #[account(
        constraint = reward_token_mint.is_initialized @ ProgramError::UninitializedAccount
    )]
    pub reward_token_mint: Account<'info, Mint>,

    // User Accounts :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            LOCK_INFO_STATIC_SEED, 
            signer.key().as_ref(), 
            &lock_id.to_le_bytes()
        ],
        bump,
        constraint = user_lock_info.owner == signer.key() &&
        user_lock_info.locked_token == lock_token_mint.key()
    )] 
    pub user_lock_info: Account<'info, UserLockInfo>,
    #[account(
        mut,
        seeds = [USER_INFO_STATIC_SEED, signer.key().as_ref()],
        bump,
        constraint = user_info.owner == signer.key()
    )] 
    pub user_info: Account<'info, UserInfo>,

    // Token ATA :-
    // Reward Token
    #[account(
        mut, 
        constraint = user_reward_token_account.owner == signer.key() && 
        user_reward_token_account.mint == reward_token_mint.key())
        ]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    // Contract Accounts :-
    #[account(seeds = [
        VAULT_STATIC_SEED, 
        reward_token_mint.key().as_ref()], 
        bump
    )]
    pub vault_reward_token_authority: SystemAccount<'info>,
    #[account(
        mut,
        constraint = vault_reward_token_account.mint == reward_token_mint.key() &&
        vault_reward_token_account.owner == vault_reward_token_authority.key(),
        address = get_associated_token_address(
            &vault_reward_token_authority.key(), 
            &reward_token_mint.key()
        ))]
    pub vault_reward_token_account: Account<'info, TokenAccount>,

    // Token Info Accounts :-

    // 1. Lock Token
    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            lock_token_info.key().as_ref()
        ], 
        bump,
        constraint = lock_token_info.key() == user_lock_info.locked_token
    )]
    pub lock_token_info: Account<'info, TokenInfo>,

    // 2. Reward Token
    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            reward_token_mint.key().as_ref()
        ], 
        bump,
        constraint = reward_token_info.key() == reward_token_mint.key()
    )]
    pub reward_token_info: Account<'info, TokenInfo>,

    #[account(mut, seeds = [GLOBAL_INFO_STATIC_SEED], bump)]
    pub global_info: Account<'info, GlobalInfo>,
    #[account()]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account()]
    pub developer_ata: Account<'info, TokenAccount>,

    // Pyth Network 
    pub price_update: Account<'info, PriceUpdateV2>,
}

// User PDAs
pub const LOCK_INFO_STATIC_SEED: &[u8] = b"lock_info";
pub const USER_INFO_STATIC_SEED: &[u8] = b"user_info";
pub const USER_UNIQUE_LOCKED_ASSETS_INFO_STATIC_SEED: &[u8] = b"user_unique_locked_assets";

// Contract PDAs
pub const GLOBAL_INFO_STATIC_SEED: &[u8] = b"global_info";
pub const TOKEN_INFO_STATIC_SEED: &[u8] = b"token_info";
pub const VAULT_STATIC_SEED: &[u8] = b"vault";
pub const AUTHORIZED_UPDATER_STATIC_SEED: &[u8] = b"authorized_updater";

// Other Constants 
pub const ONE_DAY_IN_SECONDS: u32 = 86400;

#[account]
pub struct GlobalInfo {
    pub founder_wallet: Pubkey, // 32
    pub developer_wallet: Pubkey, // 32
    pub users_count: u64, // 64 / 8 = 8
    pub non_stable_reward_pool: u64, // 64 / 8 = 8
    pub stable_reward_pool: u64, // 64 / 8 = 8
    pub non_stable_daily_claim_limit: u64, // 64 / 8 = 8
    pub stable_daily_claim_limit: u64, // 64 / 8 = 8
    pub min_lock_value: u8, // 8 / 8 = 1
    pub min_lock_duration: u8, // 8 / 8 = 1 
    pub max_lock_duration: u16, // 16 / 8 = 2
    pub non_stable_daily_reward_cap: u8, // 8 / 8 = 1
    pub stable_daily_reward_cap: u8, // 8 / 8 = 1
    pub min_usd_reward: u8, // 8 / 8 = 1
    pub fee_percentage: u8, // 8 / 8 = 1
    pub fee_splits: FeeDistribution,
    pub last_claim_limit_update_timestamp: i64, // 64 / 8 = 8
    pub usd_scaler: u32 // 32 / 8 = 4
}

impl GlobalInfo {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 2 + 1 + 1 + 1 + 1 + FeeDistribution::LEN + 8 + 4;
}

#[account]
pub struct AuthorizedUpdater {
    pub signer: Pubkey // 32 bytes
}

impl AuthorizedUpdater {
    pub const LEN: usize = 32;
}

#[account]
pub struct TokenInfo {
    pub token: Pubkey, // 32
    pub claimable_amount: u64, // 64 / 8 = 8 
    pub stable: bool, // 1
    pub last_pool_update: u64, // 64 / 8 = 8
    pub whitelisted: bool, // 1
    pub feed: Pubkey, // 32
    pub bump: u8 // 8 / 8 = 1
}

impl TokenInfo {
    pub const LEN: usize = 32 + 8 + 1 + 8 + 1 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FeeDistribution {
    pub reward_pool: u8, // 8 / 8 = 1
    pub marketing: u8, // 8 / 8 = 1
    pub development: u8, // 8 / 8 = 1
    pub developer_wallet: u8, // 8 / 8 = 1
}

impl FeeDistribution {
    pub const LEN: usize = 1 + 1 + 1 + 1;
}

#[account]
pub struct UserUniqueLockedAssetsInfo {
    pub is_initialized: bool, // 1
    pub owner: Pubkey, // Address of the lock owner // 32 
    pub token: Pubkey, // 32
    pub amount: u64, // 64 / 8 = 8
}

impl UserUniqueLockedAssetsInfo {
    pub const LEN: usize = 1 + 32 + 32 + 8;
}

#[account]
pub struct UserInfo {
    pub is_initialized: bool, // 1
    pub owner: Pubkey, // Address of the lock owner // 32  
    pub lock_count: u8, // 8 / 8 = 1
    pub referral_boost_end_time: i64, // 64 / 8 = 8
    pub unique_locked_tokens_count: u8, // 8 / 8 = 1
}

impl UserInfo {
    pub const LEN: usize = 1 + 32 + 1 + 8 + 1;
}
 
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum LockType {
    Flexible = 0, // User can unlock anytime
    Fixed = 1, // User can only unlock when half the defined lock time has passed
} // 1

#[account]
pub struct UserLockInfo {
    pub owner: Pubkey, // Address of the lock owner // 32 
    pub lock_id: u32, // nth number of lock user has made // 32 / 8 = 4
    pub bump: u8, // 8 / 8 = 1
    pub amount: u64, // Amount of token locked initially // 64 / 8 = 8
    pub lock_start: i64, // Timestamp when lock was made // 64 / 8 = 8
    pub lock_end: i64, // Timestamp when user is supposed to pull out // 64 / 8 = 8
    pub last_claim: i64, // Timestamp wher user last claimed rewards // 64 / 8 = 8
    pub withdrawn: u64, // Amounts of tokens user unlocked // 64 / 8 = 8
    pub days: u32, // Number of days user is supposed to lock for // 32 / 8 = 4
    pub unclaimed_days: u32, // Amount of days user didn't claim rewards // 32 / 8 = 4
    pub locked_token: Pubkey, // Token user locked // 32
    pub lock_type: LockType, // Type of lock user has made // 1
}

impl UserLockInfo {
    pub const LEN: usize = 32 + 4 + 1 + 8 + 8 + 8 + 8 + 8 + 4 + 4 + 32 + 1;
}

// Error codes
#[error_code]
pub enum BuffcatError {
    #[msg("Unauthorized account submitted")]
    Unauthorized,
    #[msg("Contract is paused")]
    ContractPaused,
    #[msg("No authorized to call")]
    NotAuthorized,
    #[msg("Invalid User LockId")]
    InvalidUserLockId,
    #[msg("Amount should be 500+ units")]
    InsufficientLockAmount,
    #[msg("Invalid SPL Token")]
    InvalidSPLToken,
    #[msg("Price is stale/invalid")]
    InvalidTokenPrice,
    #[msg("1 < Duration (Days) < 3000")]
    InvalidLockDuration,
    #[msg("Unlock amount > remaining")]
    InvalidUnlockAmount,
    #[msg("Lock is yet to expire")]
    LockNotExpired,
    #[msg("Token not whitelisted")]
    TokenNotWhitelisted,
    #[msg("No remaining amount to unlock")]
    LockIsEmpty,
    #[msg("Daily claim limit exceeded")]
    DailyClaimLimitExceeded,
    #[msg("Rewards for this token depleted")]
    RewardsForTokenDepleted,
    #[msg("Tried claiming too soon")]
    ClaimTooSoon,
    #[msg("Your rewards are calculated 0")]
    NoRewardsToClaim,
    #[msg("Address submitted is invalid")]
    InvalidAddress,
    #[msg("Input submitted is invalid")]
    InvalidInput,
    #[msg("Founder key submitted is invalid")]
    InvalidFounderKey,
    #[msg("Developer key submitted is invalid")]
    InvalidDeveloperKey,
    #[msg("Founder ATA submitted is invalid")]
    InvalidFounderATA,
    #[msg("Developer ATA submitted is invalid")]
    InvalidDeveloperATA
}

// Events
#[event]
pub struct LockCreated {
    pub user: Pubkey,
    pub locked_token: Pubkey,
    pub lock_id: u32,
    pub amount: u64,
    pub days: u16,
    pub lock_type: LockType,
}

#[event]
pub struct AssetsUnlocked {
    pub user: Pubkey,
    pub lock_id: u32,
    pub token: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub token: Pubkey,
    pub lock_id: u32,
    pub amount: u64,
    pub days_of_unclaimed: u32,
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
    pub non_stable_daily_claim_limit: u64,
    pub stable_daily_claim_limit: u64,
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

#[event]
pub struct TokensAddedToPool {
    pub token: Pubkey,
    pub amount: u64
}
