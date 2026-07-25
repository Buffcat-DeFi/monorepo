// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {BuffCatUpgradeable, LockType, LockInfo} from "../../src/BuffCat.sol";
import {TestSetUp} from "./lib/TestSetUp.sol";
import "../../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import "../../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";

contract AdminFunctionsTests is TestSetUp {
    uint256 public constant LOCK_AMOUNT = 10e18;
    uint256 public constant LOCK_FEES = 0.5e18;
    uint256 public constant LOCKED_AMOUNT = 9.5e18;
    uint256 public constant UNLOCK_AMOUNT = 1e18;
    uint256 public constant UNLOCK_FEES = 0.05e18;
    uint256 public constant UNLOCKED_AMOUNT = 0.95e18;

    function testUnauthorizedPauseUnpauseAttempt() public {
        // Try to pause from non-owner account
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        buffCat.pause();

        // Try to unpause from non-owner account
        vm.expectRevert(
            abi.encodeWithSelector(
                OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        buffCat.unpause();
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.stopPrank();

        vm.startPrank(owner);

        bool res = buffCat.pause();
        assertEq(res, true, "Error during pausing");

        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert(
            abi.encodeWithSelector(PausableUpgradeable.EnforcedPause.selector)
        );
        address[] memory tokens = new address[](1);
        tokens[0] = address(token1);
        buffCat.claimRewards(tokens, 0, 0);

        vm.expectRevert(
            abi.encodeWithSelector(PausableUpgradeable.EnforcedPause.selector)
        );
        buffCat.unlockAssets(0, 2001);

        vm.stopPrank();

        vm.startPrank(owner);

        res = buffCat.unpause();
        assertEq(res, true, "Error during pausing");

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 unlockAmount = 1 * 10 ** 18;
        buffCat.unlockAssets(0, unlockAmount);
        uint256 unlockFees = ((unlockAmount * 5) / 100);
        uint256 balanceAfterUnlocking = ((INITIAL_BALANCE - LOCK_AMOUNT) +
            (unlockAmount - unlockFees));
        assertEq(
            token1.balanceOf(user1),
            balanceAfterUnlocking,
            "1: Wrong Balance"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens2 = new address[](1);
        tokens2[0] = address(token1);
        buffCat.claimRewards(tokens2, 0, 0);
        assertGt(
            token1.balanceOf(user1),
            balanceAfterUnlocking,
            "2: Wrong Balance"
        );

        vm.stopPrank();
    }

    function testSuddenBlacklist() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token2);
        buffCat.claimRewards(tokens, 0, 0);

        uint256 expectedRewards = 3008333333333333;
        uint256 token2Balance = token2.balanceOf(user1);
        assertEq(
            token2Balance,
            INITIAL_BALANCE + expectedRewards,
            "Wrong balance after claiming"
        );

        vm.stopPrank();

        vm.startPrank(owner);

        address[] memory blacklist = new address[](1);
        blacklist[0] = address(token1);
        buffCat.blacklistTokens(blacklist);

        vm.stopPrank();

        vm.startPrank(user1);

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(
            abi.encodeWithSelector(BuffCatUpgradeable.InvalidToken.selector)
        );
        buffCat.claimRewards(tokens, 0, 0);

        vm.stopPrank();
    }
}
