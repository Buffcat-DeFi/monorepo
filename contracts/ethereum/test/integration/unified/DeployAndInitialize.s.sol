// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
pragma abicoder v2;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {stdJson} from 'forge-std/StdJson.sol';
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

contract DeployAndInitializeScript is Script {
    using stdJson for string;

    uint256 public constant INITIAL_BALANCE = 1000 * 10 ** 18;
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

        console.log('--- Starting DeployAndInitialize Script ---');
        console.log('Owner Address:', owner);
        console.log('User Address :', user);

        vm.startBroadcast(ownerPrivateKey);

        // 1. Deploy Tokens
        MockERC20 token1 = new MockERC20('Token1', 'T1');
        console.log('Deployed Token1 at:', address(token1));
        MockERC20 token2 = new MockERC20('Token2', 'T2');
        console.log('Deployed Token2 at:', address(token2));
        MockERC20 token3 = new MockERC20('Token3', 'T3');
        console.log('Deployed Token3 at:', address(token3));
        MockERC20 token4 = new MockERC20('Token4', 'T4');
        console.log('Deployed Token4 at:', address(token4));
        MockERC20 token5 = new MockERC20('Token5', 'T5');
        console.log('Deployed Token5 at:', address(token5));
        MockERC20 token6 = new MockERC20('Token6', 'T6');
        console.log('Deployed Token6 at:', address(token6));
        MockERC20 token7 = new MockERC20('Token7', 'T7');
        console.log('Deployed Token7 at:', address(token7));
        MockERC20 token8 = new MockERC20('Token8', 'T8');
        console.log('Deployed Token8 at:', address(token8));
        MockERC20 token9 = new MockERC20('Token9', 'T9');
        console.log('Deployed Token9 at:', address(token9));
        MockERC20 usdc = new MockERC20('USD Centric', 'USDC');
        console.log('Deployed USDC at:', address(usdc));
        MockERC20 usdt = new MockERC20('USD Tether', 'USDT');
        console.log('Deployed USDT at:', address(usdt));

        token1.mint(user, INITIAL_BALANCE);
        console.log('Minted Token1 to user');
        token2.mint(user, INITIAL_BALANCE);
        console.log('Minted Token2 to user');
        token3.mint(user, INITIAL_BALANCE);
        console.log('Minted Token3 to user');
        token4.mint(user, INITIAL_BALANCE);
        console.log('Minted Token4 to user');
        token5.mint(user, INITIAL_BALANCE);
        console.log('Minted Token5 to user');
        token6.mint(user, INITIAL_BALANCE);
        console.log('Minted Token6 to user');
        token7.mint(user, INITIAL_BALANCE);
        console.log('Minted Token7 to user');
        token8.mint(user, INITIAL_BALANCE);
        console.log('Minted Token8 to user');
        token9.mint(user, INITIAL_BALANCE);
        console.log('Minted Token9 to user');
        usdc.mint(user, INITIAL_BALANCE);
        console.log('Minted USDC to user');
        usdt.mint(user, INITIAL_BALANCE);
        console.log('Minted USDT to user');

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
        console.log('Set price for Token1');
        registry.setPrice(address(token2), Denominations.USD, int256(60000 * 10 ** 8));
        console.log('Set price for Token2');
        registry.setPrice(address(token3), Denominations.USD, int256(1 * 10 ** 8));
        console.log('Set price for Token3');
        registry.setPrice(address(usdc), Denominations.USD, int256(1 * 10 ** 8));
        console.log('Set price for USDC');
        registry.setPrice(address(usdt), Denominations.USD, int256(1 * 10 ** 8));
        console.log('Set price for USDT');
        console.log('Prices Set.');

        // 4. Deploy BuffCat Upgradeable
        BuffCatUpgradeable buffcatImpl = new BuffCatUpgradeable();
        console.log('BuffCat Implementation deployed at:', address(buffcatImpl));
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
        console.log('Whitelisted all assets');

        address[] memory stableCoins = new address[](2);
        stableCoins[0] = address(usdc);
        stableCoins[1] = address(usdt);
        buffCat.addStableCoin(stableCoins);
        console.log('Added USDC as stablecoin');
        console.log('Added USDT as stablecoin');
        console.log('Tokens whitelisted and stablecoins added.');

        vm.stopBroadcast();


        // 6. Create Pools and Add Liquidity (As User)
        vm.startBroadcast(userPrivateKey);

        IERC20(address(usdc)).approve(address(positionManager), type(uint256).max);
        console.log('Approved PositionManager for USDC');
        IERC20(address(usdt)).approve(address(positionManager), type(uint256).max);
        console.log('Approved PositionManager for USDT');
        for (uint256 i = 0; i < tokensWhitelist.length; i++) {
            IERC20(tokensWhitelist[i]).approve(address(positionManager), type(uint256).max);
            console.log('Approved PositionManager for token in whitelist, index:', i);
        }

        uint160 calculatedInitialPrice = TickMath.getSqrtRatioAtTick(0);
        uint24 poolFee = 10000;

        address[] memory tokenArr = new address[](6);
        address[] memory poolArr = new address[](6);
        address[] memory pairedTokenArr = new address[](6);

        // USDC Pools
        for (uint256 i = 3; i < tokensWhitelist.length; i++) {
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
            console.log('USDC Pool created/initialized at:', pool);

            IUniswapV3Pool(pool).increaseObservationCardinalityNext(32);
            console.log('Increased observation cardinality for pool');

            int24 spacing = IUniswapV3Pool(pool).tickSpacing();
            int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
            int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

            INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: poolFee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: 1e18,
                amount1Desired: 1e18,
                amount0Min: 0,
                amount1Min: 0,
                recipient: user,
                deadline: block.timestamp + 1 hours
            });
            positionManager.mint(params);
            console.log('Minted liquidity in USDC pool');

            tokenArr[i-3] = tokensWhitelist[i];
            poolArr[i-3] = pool;
            pairedTokenArr[i-3] = address(usdc);
        }
        console.log('Pools Created and Liquidity Added.');

        // 7. Execute Swaps for TWAP
        for (uint256 i = 3; i < tokensWhitelist.length; i++) {
            IERC20(tokensWhitelist[i]).approve(address(swapRouter), type(uint256).max);
            console.log('Approved SwapRouter for token:', tokensWhitelist[i]);
            _swapExactInputSingle(swapRouter, tokensWhitelist[i], address(usdc), user);
            console.log('Executed Initial Swap for TWAP for token:', tokensWhitelist[i]);
        }

        vm.stopBroadcast();

        vm.startBroadcast(ownerPrivateKey);

        buffCat.addTokenPools(tokenArr, poolArr, pairedTokenArr, uint256(6));

        vm.stopBroadcast();

        console.log('--- DeployAndInitialize Script Completed Successfully ---');

        // Print every deployed address at the end
        console.log('--- Deployed Addresses ---');
        console.log('Token1:', address(token1));
        console.log('Token2:', address(token2));
        console.log('Token3:', address(token3));
        console.log('Token4:', address(token4));
        console.log('Token5:', address(token5));
        console.log('Token6:', address(token6));
        console.log('Token7:', address(token7));
        console.log('Token8:', address(token8));
        console.log('Token9:', address(token9));
        console.log('USDC:', address(usdc));
        console.log('USDT:', address(usdt));
        console.log('MockFeedRegistry:', address(registry));
        console.log('BuffCat Impl:', address(buffcatImpl));
        console.log('BuffCat Proxy:', address(proxy));
        for(uint256 i = 0; i < 6; i++) {
            console.log('Pool', i, ':', poolArr[i]);
        }

        // Save deployed addresses to JSON
        string memory obj1 = "json";
        vm.serializeAddress(obj1, "token1", address(token1));
        vm.serializeAddress(obj1, "token2", address(token2));
        vm.serializeAddress(obj1, "token3", address(token3));
        vm.serializeAddress(obj1, "token4", address(token4));
        vm.serializeAddress(obj1, "token5", address(token5));
        vm.serializeAddress(obj1, "token6", address(token6));
        vm.serializeAddress(obj1, "token7", address(token7));
        vm.serializeAddress(obj1, "token8", address(token8));
        vm.serializeAddress(obj1, "token9", address(token9));
        vm.serializeAddress(obj1, "usdc", address(usdc));
        vm.serializeAddress(obj1, "usdt", address(usdt));
        vm.serializeAddress(obj1, "registry", address(registry));
        vm.serializeAddress(obj1, "buffcatImpl", address(buffcatImpl));
        vm.serializeAddress(obj1, "buffCatProxy", address(proxy));
        vm.serializeAddress(obj1, "pool0", poolArr[0]);
        vm.serializeAddress(obj1, "pool1", poolArr[1]);
        vm.serializeAddress(obj1, "pool2", poolArr[2]);
        vm.serializeAddress(obj1, "pool3", poolArr[3]);
        vm.serializeAddress(obj1, "pool4", poolArr[4]);
        string memory finalJson = vm.serializeAddress(obj1, "pool5", poolArr[5]);

        string memory path = string.concat(vm.projectRoot(), "/broadcast/deploy-addresses.json");
        vm.writeJson(finalJson, path);
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
            deadline: block.timestamp + 1 hours,
            amountIn: 100 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        swapRouter.exactInputSingle(params);
    }
}
