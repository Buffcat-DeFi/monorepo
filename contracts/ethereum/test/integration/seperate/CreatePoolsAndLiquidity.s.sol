// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
pragma abicoder v2;

import 'forge-std/Script.sol';
import 'forge-std/console.sol';
import '@openzeppelin-contracts/token/ERC20/IERC20.sol';
import {IUniswapV3Factory} from 'v3-core/interfaces/IUniswapV3Factory.sol';
import {IUniswapV3Pool} from 'v3-core/interfaces/IUniswapV3Pool.sol';
import {INonfungiblePositionManager} from 'v3-periphery/interfaces/INonfungiblePositionManager.sol';
import {FixedPoint96} from 'v3-core/libraries/FixedPoint96.sol';
import 'v3-core/libraries/FullMath.sol';
import 'v3-core/libraries/TickMath.sol';
import 'v3-periphery/libraries/LiquidityAmounts.sol';
import '@openzeppelin-contracts/utils/math/Math.sol';

contract CreatePoolsAndLiquidity is Script {
  address token0;
  address token1;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address owner = vm.addr(ownerPrivateKey);

    uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
    address user = vm.addr(userPrivateKey);

    INonfungiblePositionManager positionManager = INonfungiblePositionManager(
      vm.envAddress('POSITION_MANAGER_ADDRESS')
    );
    IUniswapV3Factory factory = IUniswapV3Factory(vm.envAddress('UNISWAP_ADDRESS'));

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

    address usdc = vm.envAddress('USDC_ADDRESS');
    address usdt = vm.envAddress('USDT_ADDRESS');

    console.log('--- Starting Uniswap V3 Pool Deployments & LP Provision ---');
    console.log('User/LP Account         :', user);
    console.log('Position Manager Address:', address(positionManager));
    console.log('UniswapV3 Factory Address:', address(factory));
    console.log('-----------------------------------------------------------');

    vm.startBroadcast(userPrivateKey);

    console.log('Setting maximum Position Manager allowances...');
    IERC20(usdc).approve(address(positionManager), type(uint256).max);
    IERC20(usdt).approve(address(positionManager), type(uint256).max);
    for (uint256 i = 0; i < tokensWhitelist.length; i++) {
      IERC20(tokensWhitelist[i]).approve(address(positionManager), type(uint256).max);
    }
    console.log('Allowances granted for stablecoins and all 9 whitelist tokens.');
    console.log('-----------------------------------------------------------');

    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);

    // ================== USDC LOOPS ==================
    console.log('>>> Processing USDC Liquidity Pools...');
    for (uint256 i = 0; i < tokensWhitelist.length; i++) {
      if (tokensWhitelist[i] < usdc) {
        token0 = tokensWhitelist[i];
        token1 = usdc;
      } else {
        token0 = usdc;
        token1 = tokensWhitelist[i];
      }

      address usdcPool = positionManager.createAndInitializePoolIfNecessary(
        token0,
        token1,
        10000,
        sqrtPriceX96
      );

      IUniswapV3Pool(usdcPool).increaseObservationCardinalityNext(32);

      int24 spacing = IUniswapV3Pool(usdcPool).tickSpacing();
      int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
      int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

      uint256 amount0Desired = 10_000e6;
      uint256 amount1Desired = 10_000e6;

      INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager
        .MintParams({
          token0: token0,
          token1: token1,
          fee: 10000,
          tickLower: tickLower,
          tickUpper: tickUpper,
          amount0Desired: amount0Desired,
          amount1Desired: amount1Desired,
          amount0Min: 0,
          amount1Min: 0,
          recipient: user,
          deadline: block.timestamp
        });

      (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = positionManager.mint(
        params
      );

      console.log('Pool (USDC Pair) Ready:', usdcPool);
      console.log('  -> Token0:', token0);
      console.log('  -> Token1:', token1);
      console.log('  -> LP Position Minted! Token ID:', tokenId, '| Liquidity Amount:', liquidity);
    }

    console.log('-----------------------------------------------------------');

    // ================== USDT LOOPS ==================
    console.log('>>> Processing USDT Liquidity Pools...');
    for (uint256 i = 0; i < tokensWhitelist.length; i++) {
      if (tokensWhitelist[i] < usdt) {
        token0 = tokensWhitelist[i];
        token1 = usdt;
      } else {
        token0 = usdt;
        token1 = tokensWhitelist[i];
      }

      address usdtPool = positionManager.createAndInitializePoolIfNecessary(
        token0,
        token1,
        10000,
        sqrtPriceX96
      );

      IUniswapV3Pool(usdtPool).increaseObservationCardinalityNext(32);

      int24 spacing = IUniswapV3Pool(usdtPool).tickSpacing();
      int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
      int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

      uint256 amount0Desired = 10_000e6;
      uint256 amount1Desired = 10_000e6;

      INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager
        .MintParams({
          token0: token0,
          token1: token1,
          fee: 10000,
          tickLower: tickLower,
          tickUpper: tickUpper,
          amount0Desired: amount0Desired,
          amount1Desired: amount1Desired,
          amount0Min: 0,
          amount1Min: 0,
          recipient: user,
          deadline: block.timestamp
        });

      (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = positionManager.mint(
        params
      );

      console.log('Pool (USDT Pair) Ready:', usdtPool);
      console.log('  -> Token0:', token0);
      console.log('  -> Token1:', token1);
      console.log('  -> LP Position Minted! Token ID:', tokenId, '| Liquidity Amount:', liquidity);
    }

    console.log('-----------------------------------------------------------');
    console.log('--- All Pools Created and Liquidity Provided Successfully ---');

    vm.stopBroadcast();
  }
}
