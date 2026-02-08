// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {LockType, LockInfo} from "../../src/BuffCat.sol";
import {TestSetUp} from "./lib/TestSetUp.sol";

contract FeeDistributionTests is TestSetUp {
    uint256 public constant LOCK_AMOUNT = 10e18;
    uint256 public constant LOCK_FEES = 0.5e18;
    uint256 public constant LOCKED_AMOUNT = 9.5e18;
    uint256 public constant UNLOCK_AMOUNT = 1e18;
    uint256 public constant UNLOCK_FEES = 0.05e18;
    uint256 public constant UNLOCKED_AMOUNT = 0.95e18;

    function testFeeDistributionWithLocking() public {}

    function testFeeDistributionWithUnlocking() public {}

    function testFeeDistributionWithRewardClaiming() public {}
}
