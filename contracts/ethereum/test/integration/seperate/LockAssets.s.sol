// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {LockType} from '../../../src/BuffCat.sol';
import {IBuffCat} from '../../../src/IBuffCat.sol';
import '../../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol';

contract TestingScript is Script {
  IBuffCat public buffCat;
  IERC20 public token1;
  IERC20 public token2;
  IERC20 public token3;
  IERC20 public token4;
  IERC20 public token5;
  IERC20 public token6;
  IERC20 public token7;
  IERC20 public token8;
  IERC20 public token9;
  IERC20 public usdc;
  IERC20 public usdt;

  uint256 public constant INITIAL_BALANCE = 100000 * 10 ** 18;
  uint256 public constant LOCK_AMOUNT = 100 * 10 ** 18;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address owner = vm.addr(ownerPrivateKey);

    uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
    address user = vm.addr(userPrivateKey);

    address buffcatAddress = vm.envAddress('BUFFCAT_ADDRESS');
    buffCat = IBuffCat(buffcatAddress);

    address token1Address = vm.envAddress('TOKEN1_ADDRESS');
    address token2Address = vm.envAddress('TOKEN2_ADDRESS');
    address token3Address = vm.envAddress('TOKEN3_ADDRESS');
    address token4Address = vm.envAddress('TOKEN4_ADDRESS');
    address token5Address = vm.envAddress('TOKEN5_ADDRESS');
    address token6Address = vm.envAddress('TOKEN6_ADDRESS');
    address token7Address = vm.envAddress('TOKEN7_ADDRESS');
    address token8Address = vm.envAddress('TOKEN8_ADDRESS');
    address token9Address = vm.envAddress('TOKEN9_ADDRESS');
    address usdcAddress = vm.envAddress('USDC_ADDRESS');
    address usdtAddress = vm.envAddress('USDT_ADDRESS');

    token1 = IERC20(token1Address);
    token2 = IERC20(token2Address);
    token3 = IERC20(token3Address);
    token4 = IERC20(token4Address);
    token5 = IERC20(token5Address);
    token6 = IERC20(token6Address);
    token7 = IERC20(token7Address);
    token8 = IERC20(token8Address);
    token9 = IERC20(token9Address);
    usdc = IERC20(usdcAddress);
    usdt = IERC20(usdtAddress);

    console.log('--- Initializing Asset Approvals & Locks ---');
    console.log('Broadcasting User Address:', user);
    console.log('BuffCat Target Address   :', address(buffCat));
    console.log('--------------------------------------------');

    vm.startBroadcast(userPrivateKey);

    console.log('Approving BuffCat contract to spend tokens...');
    token1.approve(address(buffCat), INITIAL_BALANCE);
    token2.approve(address(buffCat), INITIAL_BALANCE);
    token3.approve(address(buffCat), INITIAL_BALANCE);
    token4.approve(address(buffCat), INITIAL_BALANCE);
    token5.approve(address(buffCat), INITIAL_BALANCE);
    token6.approve(address(buffCat), INITIAL_BALANCE);
    token7.approve(address(buffCat), INITIAL_BALANCE);
    token8.approve(address(buffCat), INITIAL_BALANCE);
    token9.approve(address(buffCat), INITIAL_BALANCE);
    usdc.approve(address(buffCat), INITIAL_BALANCE);
    usdt.approve(address(buffCat), INITIAL_BALANCE);
    console.log('All 11 token allowances successfully set.');
    console.log('--------------------------------------------');

    console.log('Locking assets into BuffCat (Flexible, 30 days)...');
    uint256 totalLockAmount = LOCK_AMOUNT * 100;

    buffCat.lockAssets(address(token1), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token1 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token2), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token2 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token3), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token3 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token4), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token4 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token5), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token5 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token6), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token6 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token7), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token7 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token8), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token8 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(token9), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked Token9 | Amount:', totalLockAmount);

    buffCat.lockAssets(address(usdc), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked USDC   | Amount:', totalLockAmount);

    buffCat.lockAssets(address(usdt), totalLockAmount, 30, LockType.FLEXIBLE, address(0));
    console.log('Locked USDT   | Amount:', totalLockAmount);

    console.log('--------------------------------------------');
    console.log('--- Asset Locking Routine Completed ---');

    vm.stopBroadcast();
  }
}
