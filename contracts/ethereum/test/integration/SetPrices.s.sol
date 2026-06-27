// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from '../../lib/forge-std/src/Script.sol';
import {console} from '../../lib/forge-std/src/console.sol';
import {Denominations} from '../../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol';
import {FeedRegistryInterface} from '../../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol';

contract TestingScript is Script {
  FeedRegistryInterface internal registry;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address owner = vm.addr(ownerPrivateKey);

    address registryAddress = vm.envAddress('FEED_REGISTRY_ADDRESS');
    registry = FeedRegistryInterface(registryAddress);

    address token1 = vm.envAddress('TOKEN1_ADDRESS');
    address token2 = vm.envAddress('TOKEN2_ADDRESS');
    address token3 = vm.envAddress('TOKEN3_ADDRESS');
    address token4 = vm.envAddress('TOKEN4_ADDRESS');
    address token5 = vm.envAddress('TOKEN5_ADDRESS');
    address token6 = vm.envAddress('TOKEN6_ADDRESS');
    address token7 = vm.envAddress('TOKEN7_ADDRESS');
    address token8 = vm.envAddress('TOKEN8_ADDRESS');
    address token9 = vm.envAddress('TOKEN9_ADDRESS');
    address usdc = vm.envAddress('USDC_ADDRESS');
    address usdt = vm.envAddress('USDT_ADDRESS');

    console.log('--- Initializing Price Feed Configuration ---');
    console.log('Broadcasting Owner Address :', owner);
    console.log('Target FeedRegistry Address:', registryAddress);
    console.log('----------------------------------------------');

    vm.startBroadcast(ownerPrivateKey);

    // Setting and logging prices (Chainlink standard USD feeds usually use 8 decimals)
    registry.setPrice(token1, Denominations.USD, int256(2000 * 10 ** 8));
    console.log('Updated Token1 price -> $2000.00000000');

    registry.setPrice(token2, Denominations.USD, int256(60000 * 10 ** 8));
    console.log('Updated Token2 price -> $60000.00000000');

    registry.setPrice(token3, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated Token3 price -> $1.00000000');

    registry.setPrice(token4, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated Token4 price -> $1.00000000');

    registry.setPrice(token5, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated Token5 price -> $1.00000000');

    registry.setPrice(token6, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated Token6 price -> $1.00000000');

    registry.setPrice(token7, Denominations.USD, int256(2000 * 10 ** 8));
    console.log('Updated Token7 price -> $2000.00000000');

    registry.setPrice(token8, Denominations.USD, int256(2000 * 10 ** 8));
    console.log('Updated Token8 price -> $2000.00000000');

    registry.setPrice(token9, Denominations.USD, int256(2000 * 10 ** 8));
    console.log('Updated Token9 price -> $2000.00000000');

    registry.setPrice(usdc, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated USDC price   -> $1.00000000');

    registry.setPrice(usdt, Denominations.USD, int256(1 * 10 ** 8));
    console.log('Updated USDT price   -> $1.00000000');

    console.log('----------------------------------------------');
    console.log('--- All prices successfully updated ---');

    vm.stopBroadcast();
  }
}
