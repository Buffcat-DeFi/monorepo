// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
pragma abicoder v2;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {MockERC20} from '../../unit/lib/MockERC20.sol';
import {MockFeedRegistry} from '../../unit/lib/MockFeedRegistry.sol';
import {Denominations} from '../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol';
import {FeedRegistryInterface} from '../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol';
import {IBuffCat} from '../../../src/IBuffCat.sol';
import {BuffCatUpgradeable, LockType} from '../../../src/BuffCat.sol';
import {ERC1967Proxy} from '@openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin-contracts/token/ERC20/IERC20.sol';
import {IUniswapV3Factory} from 'v3-core/interfaces/IUniswapV3Factory.sol';
import {IUniswapV3Pool} from 'v3-core/interfaces/IUniswapV3Pool.sol';
import {ISwapRouter} from 'v3-periphery/interfaces/ISwapRouter.sol';
import 'v3-core/libraries/TickMath.sol';

// ==========================================
// UNIVERSAL INTERFACES (from gemini-code-1783147559780.txt)
// ==========================================
interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function createAndInitializePoolIfNecessary(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
}

contract UnifiedSetupScript is Script {
    uint256 public constant INITIAL_BALANCE = 100_000_000 * 10 ** 18;
    uint256 public constant LOCK_AMOUNT = 100 * 10 ** 18;

    function run() external {
        uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
        address owner = vm.addr(ownerPrivateKey);

        uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
        address user = vm.addr(userPrivateKey);

        address developerPublicKey = vm.envAddress('DEVELOPER_PUBLIC_KEY');
        address founderPublicKey = vm.envAddress('FOUNDER_PUBLIC_KEY');

        // Mainnet Uniswap V3 Addresses (we are forking mainnet)
        address uniswapFactory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address swapRouterAddr = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
        address positionManagerAddr = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;

        INonfungiblePositionManager positionManager = INonfungiblePositionManager(positionManagerAddr);
        ISwapRouter swapRouter = ISwapRouter(swapRouterAddr);

        console.log('--- Starting Unified Setup Script ---');
        console.log('Owner Address:', owner);
        console.log('User Address :', user);

        vm.startBroadcast(ownerPrivateKey);

        // 1. Deploy Tokens
        MockERC20 token1 = new MockERC20('Token1', 'T1');
        MockERC20 token2 = new MockERC20('Token2', 'T2');
        MockERC20 token3 = new MockERC20('Token3', 'T3');
        MockERC20 token4 = new MockERC20('Token4', 'T4');
        MockERC20 token5 = new MockERC20('Token5', 'T5');
        MockERC20 token6 = new MockERC20('Token6', 'T6');
        MockERC20 token7 = new MockERC20('Token7', 'T7');
        MockERC20 token8 = new MockERC20('Token8', 'T8');
        MockERC20 token9 = new MockERC20('Token9', 'T9');
        MockERC20 usdc = new MockERC20('USD Centric', 'USDC');
        MockERC20 usdt = new MockERC20('USD Tether', 'USDT');

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

        console.log('Tokens Deployed and Minted.');

        address[] memory tokensWhitelist = new address[](9);
        tokensWhitelist[0] = address(token1);
        tokensWhitelist[1] = address(token2);
        tokensWhitelist[2] = address(token3);
        tokensWhitelist[3] = address(token4);
        tokensWhitelist[4] = address(token5);
        tokensWhitelist[5] = address(token6);
        tokensWhitelist[6] = address(token7);
        tokensWhitelist[7] = address(token8);
        tokensWhitelist[8] = address(token9);

        // 2. Deploy Feed Registry
        MockFeedRegistry registry = new MockFeedRegistry();
        console.log('MockFeedRegistry deployed at:', address(registry));

        // 3. Set Prices
        registry.setPrice(address(token1), Denominations.USD, int256(2000 * 10 ** 8));
        registry.setPrice(address(token2), Denominations.USD, int256(60000 * 10 ** 8));
        registry.setPrice(address(token3), Denominations.USD, int256(1 * 10 ** 8));
        registry.setPrice(address(token4), Denominations.USD, int256(1 * 10 ** 8));
        registry.setPrice(address(token5), Denominations.USD, int256(1 * 10 ** 8));
        registry.setPrice(address(token6), Denominations.USD, int256(1 * 10 ** 8));
        registry.setPrice(address(token7), Denominations.USD, int256(2000 * 10 ** 8));
        registry.setPrice(address(token8), Denominations.USD, int256(2000 * 10 ** 8));
        registry.setPrice(address(token9), Denominations.USD, int256(2000 * 10 ** 8));
        registry.setPrice(address(usdc), Denominations.USD, int256(1 * 10 ** 8));
        registry.setPrice(address(usdt), Denominations.USD, int256(1 * 10 ** 8));
        console.log('Prices Set.');

        // 4. Deploy BuffCat Upgradeable
        BuffCatUpgradeable buffcatImpl = new BuffCatUpgradeable();
        bytes memory data = abi.encodeWithSelector(
            BuffCatUpgradeable.initialize.selector,
            developerPublicKey,
            founderPublicKey,
            address(registry),
            uniswapFactory
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(buffcatImpl), data);
        IBuffCat buffCat = IBuffCat(address(proxy));
        console.log('BuffCat Proxy deployed at:', address(proxy));

        // 5. Whitelist Tokens
        address[] memory allAssets = new address[](11);
        for(uint i=0; i<9; i++) { allAssets[i] = tokensWhitelist[i]; }
        allAssets[9] = address(usdc);
        allAssets[10] = address(usdt);

        buffCat.whitelistTokens(allAssets);
        buffCat.addStableCoin(address(token7));
        buffCat.addStableCoin(address(token8));
        buffCat.addStableCoin(address(token9));
        buffCat.addStableCoin(address(usdc));
        buffCat.addStableCoin(address(usdt));
        console.log('Tokens whitelisted and stablecoins added.');

        vm.stopBroadcast();


        // 6. Create Pools and Add Liquidity (As User)
        vm.startBroadcast(userPrivateKey);

        IERC20(address(usdc)).approve(address(positionManager), type(uint256).max);
        IERC20(address(usdt)).approve(address(positionManager), type(uint256).max);
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            IERC20(tokensWhitelist[i]).approve(address(positionManager), type(uint256).max);
        }

        uint160 calculatedInitialPrice = TickMath.getSqrtRatioAtTick(0);
        uint24 poolFee = 10000;

        // USDC Pools
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            address token0;
            address token1;
            if (tokensWhitelist[i] < address(usdc)) {
                token0 = tokensWhitelist[i];
                token1 = address(usdc);
            } else {
                token0 = address(usdc);
                token1 = tokensWhitelist[i];
            }

            address pool = positionManager.createAndInitializePoolIfNecessary(
                token0,
                token1,
                poolFee,
                calculatedInitialPrice
            );

            IUniswapV3Pool(pool).increaseObservationCardinalityNext(32);

            int24 spacing = IUniswapV3Pool(pool).tickSpacing();
            int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
            int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

            INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: poolFee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: 10_000e6,
                amount1Desired: 10_000e6,
                amount0Min: 0,
                amount1Min: 0,
                recipient: user,
                deadline: block.timestamp
            });
            positionManager.mint(params);
        }

        // USDT Pools
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            address token0;
            address token1;
            if (tokensWhitelist[i] < address(usdt)) {
                token0 = tokensWhitelist[i];
                token1 = address(usdt);
            } else {
                token0 = address(usdt);
                token1 = tokensWhitelist[i];
            }

            address pool = positionManager.createAndInitializePoolIfNecessary(
                token0,
                token1,
                poolFee,
                calculatedInitialPrice
            );

            IUniswapV3Pool(pool).increaseObservationCardinalityNext(32);

            int24 spacing = IUniswapV3Pool(pool).tickSpacing();
            int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
            int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

            INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: poolFee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: 10_000e6,
                amount1Desired: 10_000e6,
                amount0Min: 0,
                amount1Min: 0,
                recipient: user,
                deadline: block.timestamp
            });
            positionManager.mint(params);
        }
        console.log('Pools Created and Liquidity Added.');

        // 7. Execute Swaps for TWAP
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            IERC20(tokensWhitelist[i]).approve(address(swapRouter), type(uint256).max);
            _swapExactInputSingle(swapRouter, tokensWhitelist[i], address(usdc), user);
        }

        vm.stopBroadcast();

        vm.warp(block.timestamp + 10 minutes);
        console.log('Time warped by 10 minutes.');

        vm.startBroadcast(userPrivateKey);
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            _swapExactInputSingle(swapRouter, tokensWhitelist[i], address(usdc), user);
        }
        console.log('Swaps executed for TWAP.');

        // 8. Lock Assets
        for (uint256 i = 0; i < allAssets.length; i++) {
            IERC20(allAssets[i]).approve(address(buffCat), INITIAL_BALANCE);
        }

        uint256 totalLockAmount = LOCK_AMOUNT * 100;
        for (uint256 i = 0; i < allAssets.length; i++) {
            buffCat.lockAssets(allAssets[i], totalLockAmount, 30, LockType.FLEXIBLE, address(0));
        }
        console.log('Assets Locked.');

        vm.stopBroadcast();

        console.log('--- Setup Script Completed Successfully ---');
    }

    function _swapExactInputSingle(
        ISwapRouter swapRouter,
        address tokenIn,
        address tokenOut,
        address recipient
    ) internal {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 10000,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: 100 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        swapRouter.exactInputSingle(params);
    }
}
