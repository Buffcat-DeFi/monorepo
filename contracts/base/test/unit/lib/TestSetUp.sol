// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../../lib/forge-std/src/Test.sol";
import {BuffCatUpgradeable, LockType, LockInfo} from "../../../src/BuffCat.sol";
import {MockERC20} from "./MockERC20.sol";
import {ERC1967Proxy} from "../../../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {MockAggregator} from "./MockAggregator.sol";
import {IUniswapV3Factory} from "../../../lib/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {UniswapV3Factory} from "../../../lib/v3-core/contracts/UniswapV3Factory.sol";
import {IUniswapV3Pool} from "../../../lib/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "../../../lib/v3-core/contracts/libraries/FixedPoint96.sol";
import {UniswapV3PoolDeployer} from "../../../lib/v3-core/contracts/UniswapV3PoolDeployer.sol";
import {IUniswapV3PoolDeployer} from "../../../lib/v3-core/contracts/interfaces/IUniswapV3PoolDeployer.sol";
import {TickMath} from "../../../lib/v3-core/contracts/libraries/TickMath.sol";
import "../../../lib/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
import "../../../lib/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol";
import "../../../lib/openzeppelin-contracts/contracts/utils/math/Math.sol";

contract TestSetUp is Test, IUniswapV3MintCallback {
    BuffCatUpgradeable public buffCat;
    IUniswapV3PoolDeployer public poolDeployer;
    IUniswapV3Factory public factory;
    address public pool;
    address[2] public pairs;
    uint32 public TWAP_PERIOD = 300; // 5 minutes

    uint256 public constant INITIAL_BALANCE = 100_000_000e18; // 100M tokens

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

    // individual data feeds
    MockAggregator public feed1;
    MockAggregator public feed2;
    MockAggregator public feed3;
    MockAggregator public feed4;
    MockAggregator public feed5;
    MockAggregator public feed6;
    MockAggregator public feed7;
    MockAggregator public feed8;
    MockAggregator public feed9;
    MockAggregator public feedUSDC;
    MockAggregator public feedUSDT;

    address public owner = address(31);
    address public user1 = address(32);
    address public user2 = address(33);
    address public developerWallet = address(34);
    address public founderWallet = address(45);

    uint256 public USD_SCALER = 1e6;

    function setUp() public {
        // Fork mainnet for testing
        // vm.createSelectFork("https://eth-mainnet.g.alchemy.com/v2/reRHZn-g99QDHwJ1yuBt41gN4yyQ_S_S");
        vm.deal(address(this), 10 ether); // Give 10 ether to this contract
        // deploy Uniswap V3 factory
        poolDeployer = new UniswapV3PoolDeployer();
        factory = new UniswapV3Factory();

        // Deploy tokens
        token1 = new MockERC20("Token1", "T1");
        token2 = new MockERC20("Token2", "T2");
        token3 = new MockERC20("Token3", "T3");
        token4 = new MockERC20("Token4", "T4");
        token5 = new MockERC20("Token5", "T5");
        token6 = new MockERC20("Token6", "T6");
        token7 = new MockERC20("Token7", "T7");
        token8 = new MockERC20("Token8", "T8");
        token9 = new MockERC20("Token9", "T9");
        usdc = new MockERC20("USD Centric", "USDC");
        usdt = new MockERC20("USD Tether", "USDT");

        token8.mint(address(this), INITIAL_BALANCE);
        token9.mint(address(this), INITIAL_BALANCE);
        usdt.mint(address(this), INITIAL_BALANCE);
        usdc.mint(address(this), INITIAL_BALANCE);

        pool = factory.createPool(
            address(token8),
            address(usdc),
            uint24(10000)
        );
        // initialize pool at price = 1:1 => tick = 0
        uint160 initialSqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        IUniswapV3Pool(pool).initialize(initialSqrtPriceX96);
        IUniswapV3Pool(pool).increaseObservationCardinalityNext(10); // Store 10 observations
        // add liquidity around tick 0
        token8.approve(pool, type(uint256).max);
        usdc.approve(pool, type(uint256).max);
        IUniswapV3Pool(pool).mint(
            address(this),
            -200,
            200,
            1e18,
            abi.encode("")
        );
        vm.warp(block.timestamp + 300);
        IUniswapV3Pool(pool).mint(
            address(this),
            -200,
            200,
            1e18,
            abi.encode("")
        );

        // Deploy BuffCat
        vm.startPrank(owner);
        // 1. Deploy the logic contract.
        buffCat = new BuffCatUpgradeable();

        // 2. Encode the initializer call.
        bytes memory data = abi.encodeWithSelector(
            BuffCatUpgradeable.initialize.selector,
            developerWallet,
            founderWallet,
            factory
        );

        // 3. Deploy the proxy with the logic address and initializer data.
        ERC1967Proxy proxy = new ERC1967Proxy(address(buffCat), data);

        // 4. Cast the proxy address to your contract type.
        buffCat = BuffCatUpgradeable(address(proxy));

        address[] memory tokens = new address[](1);
        tokens[0] = address(token8);
        address[] memory pools = new address[](1);
        pools[0] = address(pool);
        address[] memory pairedTokens = new address[](1);
        pairedTokens[0] = address(usdc);
        uint256 length = 1;
        buffCat.addTokenPools(tokens, pools, pairedTokens, length);

        // Deploy and set up individual data feeds (same price scaled to 8 decimals)
        uint256 priceUsd8 = 1 * 10 ** 8;
        feed1 = new MockAggregator(8, int256(2000 * priceUsd8));
        feed2 = new MockAggregator(8, int256(60000 * priceUsd8));
        feed3 = new MockAggregator(8, int256(1 * priceUsd8));
        feed4 = new MockAggregator(8, int256(1 * priceUsd8));
        feed5 = new MockAggregator(8, int256(1 * priceUsd8));
        feed6 = new MockAggregator(8, int256(1 * priceUsd8));
        feed7 = new MockAggregator(8, int256(2000 * priceUsd8));
        feed8 = new MockAggregator(8, int256(1 * priceUsd8));
        feed9 = new MockAggregator(8, int256(1 * priceUsd8));
        feedUSDC = new MockAggregator(6, int256(1 * 10 ** 6));
        feedUSDT = new MockAggregator(8, int256(1 * priceUsd8));

        // Whitelist stablecoins
        // buffCat.addStableCoin(address(token3));
        // buffCat.addStableCoin(address(token4));
        address[] memory stableCoins = new address[](1);
        stableCoins[0] = address(address(token7));
        buffCat.addStableCoin(stableCoins);

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
        buffCat.whitelistTokens(tokensWhitelist);

        // Add all data feeds to BuffCat
        address[] memory dataFeeds = new address[](11);
        dataFeeds[0] = address(feed1);
        dataFeeds[1] = address(feed2);
        dataFeeds[2] = address(feed3);
        dataFeeds[3] = address(feed4);
        dataFeeds[4] = address(feed5);
        dataFeeds[5] = address(feed6);
        dataFeeds[6] = address(feed7);
        dataFeeds[7] = address(feed8);
        dataFeeds[8] = address(feed9);
        dataFeeds[9] = address(feedUSDC);
        dataFeeds[10] = address(feedUSDT);
        buffCat.addDataFeeds(tokensWhitelist, dataFeeds);
        vm.stopPrank();

        // Mint tokens to users
        token1.mint(user1, INITIAL_BALANCE);
        token2.mint(user1, INITIAL_BALANCE);
        token3.mint(user1, INITIAL_BALANCE);
        token4.mint(user1, INITIAL_BALANCE);
        token5.mint(user1, INITIAL_BALANCE);
        token6.mint(user1, INITIAL_BALANCE);
        token7.mint(user1, INITIAL_BALANCE);
        token8.mint(user1, INITIAL_BALANCE);
        token9.mint(user1, INITIAL_BALANCE);
        usdc.mint(user1, INITIAL_BALANCE);
        usdt.mint(user1, INITIAL_BALANCE);

        token1.mint(user2, INITIAL_BALANCE);
        token2.mint(user2, INITIAL_BALANCE);
        token3.mint(user2, INITIAL_BALANCE);
        token4.mint(user2, INITIAL_BALANCE);
        token5.mint(user2, INITIAL_BALANCE);
        token6.mint(user2, INITIAL_BALANCE);
        token7.mint(user2, INITIAL_BALANCE);
        token8.mint(user2, INITIAL_BALANCE);
        token9.mint(user2, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);
        usdt.mint(user2, INITIAL_BALANCE);

        // Approve tokens
        vm.startPrank(user1);
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
        vm.stopPrank();

        vm.startPrank(user2);
        token1.approve(address(buffCat), INITIAL_BALANCE);
        token2.approve(address(buffCat), INITIAL_BALANCE);
        token3.approve(address(buffCat), INITIAL_BALANCE);
        token4.approve(address(buffCat), INITIAL_BALANCE);
        token5.approve(address(buffCat), INITIAL_BALANCE);
        token7.approve(address(buffCat), INITIAL_BALANCE);
        token8.approve(address(buffCat), INITIAL_BALANCE);
        token9.approve(address(buffCat), INITIAL_BALANCE);
        usdc.approve(address(buffCat), INITIAL_BALANCE);
        usdt.approve(address(buffCat), INITIAL_BALANCE);
        vm.stopPrank();
    }

    // callback called by Uniswap pool during mint to pull required token amounts
    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata
    ) external override {
        // must be the pool calling us
        require(msg.sender == pool, "Only pool can call");

        // figure out which token is token0/token1 in this pool
        address _token0 = IUniswapV3Pool(pool).token0();
        address _token1 = IUniswapV3Pool(pool).token1();

        // transfer exactly the amounts the pool is expecting
        if (amount0Owed > 0) IERC20(_token0).transfer(pool, amount0Owed);
        if (amount1Owed > 0) IERC20(_token1).transfer(pool, amount1Owed);
    }
}
