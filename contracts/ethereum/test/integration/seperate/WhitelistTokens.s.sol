// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from '../../lib/forge-std/src/Script.sol';
import {console} from '../../lib/forge-std/src/console.sol';
import {IBuffcat} from '../../src/IBuffcat.sol';

contract TestingScript is Script {
  IBuffcat public buffCat;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address owner = vm.addr(ownerPrivateKey);

    address buffcatAddress = vm.envAddress('BUFFCAT_ADDRESS');
    buffCat = IBuffcat(buffcatAddress);

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

    console.log('--- Initializing Buffcat Asset Configuration ---');
    console.log('Broadcasting Owner Address:', owner);
    console.log('Target Buffcat Address    :', buffcatAddress);
    console.log('-------------------------------------------------');

    vm.startBroadcast(ownerPrivateKey);

    address[] memory tokensWhitelist = new address[](11);
    tokensWhitelist[0] = address(token1);
    tokensWhitelist[1] = address(token2);
    tokensWhitelist[2] = address(token3);
    tokensWhitelist[3] = address(token4);
    tokensWhitelist[4] = address(token5);
    tokensWhitelist[5] = address(token6);
    tokensWhitelist[6] = address(token7);
    tokensWhitelist[7] = address(token8);
    tokensWhitelist[8] = address(token9);
    tokensWhitelist[9] = address(usdc);
    tokensWhitelist[10] = address(usdt);

    console.log('Executing whitelistTokens for 11 assets...');
    buffCat.whitelistTokens(tokensWhitelist);
    console.log('Tokens successfully whitelisted.');
    console.log('-------------------------------------------------');

    console.log('Registering stablecoins...');

    buffCat.addStableCoin(address(token7));
    console.log('Added Token7 as Stablecoin :', token7);

    buffCat.addStableCoin(address(token8));
    console.log('Added Token8 as Stablecoin :', token8);

    buffCat.addStableCoin(address(token9));
    console.log('Added Token9 as Stablecoin :', token9);

    buffCat.addStableCoin(address(usdc));
    console.log('Added USDC as Stablecoin   :', usdc);

    buffCat.addStableCoin(address(usdt));
    console.log('Added USDT as Stablecoin   :', usdt);

    console.log('-------------------------------------------------');
    console.log('--- Buffcat Asset Configuration Completed ---');

    vm.stopBroadcast();
  }
}
