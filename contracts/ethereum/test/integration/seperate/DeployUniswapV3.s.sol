// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import 'forge-std/Script.sol';
import 'forge-std/console.sol';
import {UniswapV3Factory} from 'v3-core/UniswapV3Factory.sol';
import {SwapRouter} from 'v3-periphery/SwapRouter.sol';
import {WETH9} from 'canonical-weth/WETH9.sol';
import {NonfungibleTokenPositionDescriptor} from 'v3-periphery/NonfungibleTokenPositionDescriptor.sol';
import {NonfungiblePositionManager} from 'v3-periphery/NonfungiblePositionManager.sol';

contract DeployUniswapV3 is Script {
  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address ownerPublicKey = vm.addr(ownerPrivateKey);
    console.log('Owner Public Key Address:', ownerPublicKey);

    vm.startBroadcast(ownerPrivateKey);

    UniswapV3Factory factory = new UniswapV3Factory();

    WETH9 weth = new WETH9();

    NonfungibleTokenPositionDescriptor descriptor = new NonfungibleTokenPositionDescriptor(
      address(weth),
      bytes32('ETH')
    );

    NonfungiblePositionManager positionManager = new NonfungiblePositionManager(
      address(factory),
      address(weth),
      address(descriptor)
    );

    SwapRouter router = new SwapRouter(address(factory), address(weth));

    vm.stopBroadcast();

    console.log('Factory:', address(factory));
    console.log('WETH9:', address(weth));
    console.log('Descriptor:', address(descriptor));
    console.log('PositionManager:', address(positionManager));
    console.log('SwapRouter:', address(router));
  }
}
