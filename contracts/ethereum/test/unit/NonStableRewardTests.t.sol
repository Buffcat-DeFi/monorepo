// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {LockType, LockInfo} from "../../src/BuffCat.sol";
import {TestSetUp} from "./lib/TestSetUp.sol";

contract NonStableRewardTests is TestSetUp {
    uint256 public constant LOCK_AMOUNT = 10e18;
    uint256 public constant LOCK_FEES = 0.5e18;
    uint256 public constant LOCKED_AMOUNT = 9.5e18;
    uint256 public constant UNLOCK_AMOUNT = 1e18;
    uint256 public constant UNLOCK_FEES = 0.05e18;
    uint256 public constant UNLOCKED_AMOUNT = 0.95e18;

    function testNonStableRewardsClaimingWithBigValues() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10
        // Token Price = $60,000
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $60,000 = $24,000
        // Since token2 is not set as stable
        // Non Stable Reward Pool = $24,000
        // Stable Reward Pool = $0
        // Non Stable Claim Limit = $0
        // Stable Claim Limit = $0

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10
        // Token Price = $2,000
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $2,000 = $800
        // Since token1 is not set as stable
        // Non Stable Reward Pool = $24,000 + $800 = $24,800
        // Stable Reward Pool = $0

        // Will become 10% of non stable reward pool when claim rewards is called
        // Non Stable Claim Limit (Potentially) = 10% of $24,800 = $2,480
        // Stable Claim Limit = $0

        // Reward Calculation -
        // Lock Amount (USD) = 9.5 * $2,000 = $19,000
        // Multiplier = 1.0x (since call will be done before half time has passed)
        // User Weighted = $19,000 * 1 = $19,000
        // Total User Rewards = ($19,000 * $2,480) / $24,800 = $1,900
        // Daily User Rewards = 10% of $1,900 = $190
        // Total Rewards = $190 * 1 (since there are no unclaimed days of rewards) = $190
        // $190 < $2,480 (Non Stable Daily Claim Limit) so, rewards stay the same
        // Since we are claiming rewards in token2
        // Token Rewards = $190 / $60,000 = 0.00316666666666666666666666666667
        // Available Token Rewards = 0.4
        // 0.4 > 003166.., there are enough tokens for claiming
        // so contract will give users all the tokens it deserves
        // plus it will take 5% fees
        // Final Token Rewards = 0.00316666666666666666666666666667 - (0.00316666666666666666666666666667 * 0.05)
        // = 0.00316666666666666666666666666667 - 1.583333333333333333333333333335e-4 = 0.00300833333333333333333333333334

        // User has to keep the lock for atleast a day before claiming
        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token2);
        buffCat.claimRewards(tokens, 0, 0);

        // Since user2 has addresses hasn't locked any of it's token2s
        // Balance after claiming rewards in token2 should be INITIAL_BALANCE (100,000) + 0.00300833333333333333333333333334
        uint256 expectedRewards = 3008333333333333; // 0.00300833333333333333333333333334 * 1e18
        uint256 token2Balance = token2.balanceOf(user1);
        assertEq(
            token2Balance,
            INITIAL_BALANCE + expectedRewards,
            "Wrong balance after claiming"
        );

        vm.stopPrank();
    }

    function testNonStableRewardsClaimingWithSmallValues() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token3),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10
        // Token Price = $1
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $1 = $0.4
        // Since token3 is not set as stable
        // Non Stable Reward Pool = $0.4
        // Stable Reward Pool = $0
        // Non Stable Claim Limit = $0
        // Stable Claim Limit = $0

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token4),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10 * 1e18
        // Token Price = $1
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $1 = $0.4
        // Since token4 is not set as stable
        // Non Stable Reward Pool = $0.4 + $0.4 = $0.8
        // Stable Reward Pool = $0

        // Will become 10% of non stable reward pool when claim rewards is called
        // Non Stable Claim Limit (Potentially) = 10% of $0.8 = $0.08
        // Stable Claim Limit = $0

        // Reward Calculation -
        // Lock Amount (USD) = 9.5 * $1 = $9.5
        // Multiplier = 1.0x (since call will be done before half time has passed)
        // User Weighted = $9.5 * 1 = $9.5
        // Total User Rewards = ($9.5 * $0.08) / $0.8 = $0.95
        // Daily User Rewards = 10% of $0.95 = $0.095
        // Total Rewards = $0.095 * 1 (since there are no unclaimed days of rewards) = $0.095
        // $0.095 > $0.08 (Non Stable Daily Claim Limit) so, contract will give all rewards it can
        // Now, rewards become $0.08
        // Since we are claiming rewards in token3
        // Token Rewards = $0.08 / $1 = 0.08
        // Available Token Rewards = 0.4
        // 0.4 > 0.08, there are enough tokens for claiming
        // so contract will give users the tokens it deserves
        // plus it will take 5% fees
        // Final Token Rewards = 0.08 - (0.08 * 0.05)
        // = 0.08 - 0.004 = 0.076

        // User has to keep the lock for atleast a day before claiming
        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token3);
        buffCat.claimRewards(tokens, 0, 0);

        // Since user2 has addresses hasn't locked any of it's token2s
        // Balance after claiming rewards in token3 should be INITIAL_BALANCE (100,000) + 0.076
        uint256 expectedRewards = 0.076 * 1e18;
        uint256 token2Balance = token3.balanceOf(user1);
        assertEq(
            token2Balance,
            INITIAL_BALANCE + expectedRewards,
            "Wrong balance after claiming"
        );

        vm.stopPrank();
    }

    function testNonStableRewardsClaimingWithUnclaimedRewards() public {}

    function testBatchNonStableRewardsClaiming() public {}

    function testNonStableRewardsClaimingAfterHalfCompletion() public {}

    function testBatchNonStableRewardsClaimingWithMultipliers() public {}

    function testBatchNonStableRewardsClaimingWithReferrals() public {}

    function testBatchNonStableRewardsClaimingAfterUnlocking97() public {}

    function testNonStableRewardsClaimingWithUniswapReliantTokens() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10
        // Token Price = $60,000
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $60,000 = $24,000
        // Since token2 is not set as stable
        // Non Stable Reward Pool = $24,000
        // Stable Reward Pool = $0
        // Non Stable Claim Limit = $0
        // Stable Claim Limit = $0

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token8),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Token Count = 10
        // Paired with USDC in Uniswap Pool at rate 1:1
        // USDC Price = $17
        // Hence, Token Price = $17
        // Lock Amount = 9.5 (-5%)
        // Fee Cut (For Reward Pool) =  80% of (5% of 10) = 0.4
        // Fee Cut (For Reward Pool in USD) = 0.4 * $17 = $6.8
        // Since token8 is not set as stable
        // Non Stable Reward Pool = $24,000 + $6.8 = $24,006.8
        // Stable Reward Pool = $0

        // Will become 10% of non stable reward pool when claim rewards is called
        // Non Stable Claim Limit (Potentially) = 10% of $24,006.8 = $2,400.68
        // Stable Claim Limit = $0

        // Reward Calculation -
        // Lock Amount (USD) = 9.5 * $17 = $161.5
        // Multiplier = 1.0x (since call will be done before half time has passed)
        // User Weighted = $161.5 * 1 = $161.5
        // Total User Rewards = ($161.5 * $2,400.68) / $24,006.8 = $16.15
        // Daily User Rewards = 10% of $16.15 = $1.615
        // Total Rewards = $1.615 * 1 (since there are no unclaimed days of rewards) = $1.615
        // $1.615 < $2,400.68 (Non Stable Daily Claim Limit) so, rewards stay the same
        // Since we are claiming rewards in token2
        // Token Rewards = $1.615 / $60,000 = 2.691666666666667e-5
        // Available Token Rewards = 0.4
        // 0.4 > 2.691666666666667e-5, there are enough tokens for claiming
        // so contract will give users all the tokens it deserves
        // plus it will take 5% fees
        // Final Token Rewards = 2.691666666666667e-5 - (2.691666666666667e-5 * 0.05)
        // = 2.691666666666667e-5 - 1.345833333333334e-6 = 2.557083333333334e-5

        // User has to keep the lock for atleast a day before claiming
        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token2);
        buffCat.claimRewards(tokens, 0, 0);

        // Since user2 has addresses hasn't locked any of it's token2s
        // Balance after claiming rewards in token2 should be INITIAL_BALANCE (100,000) + 2.557083333333334e-5
        uint256 expectedRewards = 25570833333333; // 2.557083333333334e-5 * 1e18
        uint256 token2Balance = token2.balanceOf(user1);
        assertEq(
            token2Balance,
            INITIAL_BALANCE + expectedRewards,
            "Wrong balance after claiming"
        );

        vm.stopPrank();
    }
}
