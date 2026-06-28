// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {MockERC20} from '../unit/lib/MockERC20.sol';

contract TestingScript is Script {
  MockERC20 public token1;
  MockERC20 public token2;
  MockERC20 public token3;
  MockERC20 public token4;
  MockERC20 public token5;
  MockERC20 public token6;
  MockERC20 public token7;
  MockERC20 public token8;
  MockERC20 public token9;
  MockERC20 public usdc;
  MockERC20 public usdt;

  uint256 public constant INITIAL_BALANCE = 100_000_000 * 10 ** 18;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address owner = vm.addr(ownerPrivateKey);

    uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
    address user = vm.addr(userPrivateKey);

    console.log('--- Starting Deployment Script ---');
    console.log('Owner Address:', owner);
    console.log('User Address :', user);
    console.log('----------------------------------');

    vm.startBroadcast(ownerPrivateKey);

    // Deploying Tokens
    token1 = new MockERC20('Token1', 'T1');
    console.log('Deployed Token1 at:', address(token1));

    token2 = new MockERC20('Token2', 'T2');
    console.log('Deployed Token2 at:', address(token2));

    token3 = new MockERC20('Token3', 'T3');
    console.log('Deployed Token3 at:', address(token3));

    token4 = new MockERC20('Token4', 'T4');
    console.log('Deployed Token4 at:', address(token4));

    token5 = new MockERC20('Token5', 'T5');
    console.log('Deployed Token5 at:', address(token5));

    token6 = new MockERC20('Token6', 'T6');
    console.log('Deployed Token6 at:', address(token6));

    token7 = new MockERC20('Token7', 'T7');
    console.log('Deployed Token7 at:', address(token7));

    token8 = new MockERC20('Token8', 'T8');
    console.log('Deployed Token8 at:', address(token8));

    token9 = new MockERC20('Token9', 'T9');
    console.log('Deployed Token9 at:', address(token9));

    usdc = new MockERC20('USD Centric', 'USDC');
    console.log('Deployed USDC at  :', address(usdc));

    usdt = new MockERC20('USD Tether', 'USDT');
    console.log('Deployed USDT at  :', address(usdt));

    console.log('----------------------------------');
    console.log('Minting initial balances to user...');

    // Minting Tokens
    token1.mint(user, INITIAL_BALANCE);
    token2.mint(user, INITIAL_BALANCE);
    token3.mint(user, INITIAL_BALANCE);
    token4.mint(user, INITIAL_BALANCE);
    token5.mint(user, INITIAL_BALANCE);
    token6.mint(user, INITIAL_BALANCE);
    token7.mint(user, INITIAL_BALANCE);
    token8.mint(user, INITIAL_BALANCE);
    token9.mint(user, INITIAL_BALANCE);
    usdc.mint(user, INITIAL_BALANCE);
    usdt.mint(user, INITIAL_BALANCE);

    console.log(
      'Minted',
      INITIAL_BALANCE,
      'tokens each (Token1 through Token9, USDC & USDT) to user.'
    );
    console.log('--- Script Execution Completed ---');

    vm.stopBroadcast();
  }
}
