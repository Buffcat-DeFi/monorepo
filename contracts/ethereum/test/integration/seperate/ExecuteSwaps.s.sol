// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
pragma abicoder v2;

import 'forge-std/Script.sol';
import 'forge-std/console.sol';
import '@openzeppelin-contracts/token/ERC20/IERC20.sol';
import {ISwapRouter} from 'v3-periphery/interfaces/ISwapRouter.sol';

contract ExecuteSwaps is Script {
  function run() external {
    uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
    address user = vm.addr(userPrivateKey);

    ISwapRouter swapRouter = ISwapRouter(vm.envAddress('SWAP_ROUTER_ADDRESS'));

    address usdc = vm.envAddress('USDC_ADDRESS');
    address usdt = vm.envAddress('USDT_ADDRESS');

    address[] memory tokensWhitelist = new address[](9);
    tokensWhitelist[0] = vm.envAddress('TOKEN1_ADDRESS');
    tokensWhitelist[1] = vm.envAddress('TOKEN2_ADDRESS');
    tokensWhitelist[2] = vm.envAddress('TOKEN3_ADDRESS');
    tokensWhitelist[3] = vm.envAddress('TOKEN4_ADDRESS');
    tokensWhitelist[4] = vm.envAddress('TOKEN5_ADDRESS');
    tokensWhitelist[5] = vm.envAddress('TOKEN6_ADDRESS');
    tokensWhitelist[6] = vm.envAddress('TOKEN7_ADDRESS');
    tokensWhitelist[7] = vm.envAddress('TOKEN8_ADDRESS');
    tokensWhitelist[8] = vm.envAddress('TOKEN9_ADDRESS');

    console.log('--- Starting TWAP Generation Script ---');
    console.log('User Address       :', user);
    console.log('Swap Router Target :', address(swapRouter));
    console.log('Target Out Asset   :', usdc);
    console.log('---------------------------------------');

    vm.startBroadcast(userPrivateKey);

    console.log('>>> Initiating Round 1: Approvals and Swaps...');
    for (uint256 i = 0; i < tokensWhitelist.length; i++) {
      address targetToken = tokensWhitelist[i];

      IERC20(targetToken).approve(address(swapRouter), type(uint256).max);
      console.log('Max allowance granted for token index [', i, ']:', targetToken);

      _swapExactInputSingle(swapRouter, targetToken, usdc, user);
    }

    vm.stopBroadcast();
    console.log('Initial swaps completed.');
    console.log('---------------------------------------');

    vm.warp(block.timestamp + 10 minutes);
    console.log('Time warped by 10 minutes. Current timestamp:', block.timestamp);
    console.log('---------------------------------------');

    vm.startBroadcast(userPrivateKey);

    console.log('>>> Initiating Round 2: Post-Warp Swaps...');
    for (uint256 i = 0; i < tokensWhitelist.length; i++) {
      _swapExactInputSingle(swapRouter, tokensWhitelist[i], usdc, user);
    }

    vm.stopBroadcast();
    console.log('Second swaps completed. TWAP is now fully readable.');
    console.log('--- TWAP Routine Finished Execution ---');
  }

  function _swapExactInputSingle(
    ISwapRouter swapRouter,
    address tokenIn,
    address tokenOut,
    address recipient
  ) internal {
    uint256 amountIn = 100 ether;

    console.log('Swapping 100 tokens of In-Asset:', tokenIn);

    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fee: 10000,
      recipient: recipient,
      deadline: block.timestamp,
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    });

    swapRouter.exactInputSingle(params);
  }
}
