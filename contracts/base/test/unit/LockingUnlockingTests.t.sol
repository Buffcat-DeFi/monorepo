// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {LockType, LockInfo} from "../../src/BuffCat.sol";
import {TestSetUp} from "./lib/TestSetUp.sol";

contract LockingUnlockingTests is TestSetUp {
    uint256 public constant LOCK_AMOUNT = 10 * 1e18;
    uint256 public constant LOCK_FEES = 0.5 * 1e18;
    uint256 public constant LOCKED_AMOUNT = 9.5 * 1e18;
    uint256 public constant UNLOCK_AMOUNT = 1 * 1e18;
    uint256 public constant UNLOCK_FEES = 0.05 * 1e18;
    uint256 public constant UNLOCKED_AMOUNT = 0.95 * 1e18;

    function testLocking() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 userBalance = token1.balanceOf(user1);
        assertEq(
            userBalance,
            INITIAL_BALANCE - LOCK_AMOUNT,
            "Wrong User Balance"
        );

        uint256 expectedContractBalance = LOCKED_AMOUNT +
            ((LOCK_FEES * 80) / 100);
        uint256 contractBalance = token1.balanceOf(address(buffCat));
        assertEq(
            contractBalance,
            expectedContractBalance,
            "Wrong Contract Balance"
        );

        vm.stopPrank();
    }

    function testLockingWithInvalidInputs() public {}

    function testUnlocking() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        buffCat.unlockAssets(0, UNLOCK_AMOUNT);

        uint256 userBalance = token1.balanceOf(user1);
        assertEq(
            userBalance,
            (INITIAL_BALANCE - LOCK_AMOUNT) + UNLOCKED_AMOUNT,
            "Wrong User Balance"
        );

        uint256 expectedContractBalance = (LOCKED_AMOUNT - UNLOCK_AMOUNT) +
            ((LOCK_FEES * 80) / 100) +
            ((UNLOCK_FEES * 80) / 100);
        uint256 contractBalance = token1.balanceOf(address(buffCat));
        assertEq(
            contractBalance,
            expectedContractBalance,
            "Wrong Contract Balance"
        );

        vm.stopPrank();
    }

    function testUnlockingWithInvalidInputs() public {}

    function testUnlockingWithFixedLocksBeforeEnd() public {}

    function testUnlockingWithFixedLocksAfterEnd() public {}
}
