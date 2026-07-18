// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {BuffCatUpgradeable, LockType, LockInfo} from "../src/BuffCat.sol";
import {Token1} from "./tokens/Token1.sol";
import {Token2} from "./tokens/Token2.sol";
import {Token3} from "./tokens/Token3.sol";
import {Token4} from "./tokens/Token4.sol";
import {Token5} from "./tokens/Token5.sol";
import {Token6} from "./tokens/Token6.sol";
import {Token7} from "./tokens/Token7.sol";
import {Token8} from "./tokens/Token8.sol";
import {Token9} from "./tokens/Token9.sol";
import {USDC} from "./tokens/USDC.sol";
import {USDT} from "./tokens/USDT.sol";
import {FeedRegistryInterface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import {Denominations} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol";
import {AggregatorV2V3Interface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import {ERC1967Proxy} from "../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {MockFeedRegistry} from "./MockFeedRegistry.sol";
import {IUniswapV3Factory} from "../lib/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {UniswapV3Factory} from "../lib/v3-core/contracts/UniswapV3Factory.sol";
import {IUniswapV3Pool} from "../lib/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "../lib/v3-core/contracts/libraries/FixedPoint96.sol";
import {UniswapV3PoolDeployer} from "../lib/v3-core/contracts/UniswapV3PoolDeployer.sol";
import {IUniswapV3PoolDeployer} from "../lib/v3-core/contracts/interfaces/IUniswapV3PoolDeployer.sol";
import {TickMath} from "../lib/v3-core/contracts/libraries/TickMath.sol";
import {OracleLibrary} from "../lib/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "../lib/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
import "../lib/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol";
import "../lib/openzeppelin-contracts/contracts/utils/math/Math.sol";

contract BuffCatTest is Test, IUniswapV3MintCallback {
    BuffCatUpgradeable public buffCat;
    MockFeedRegistry public registry;
    IUniswapV3PoolDeployer public poolDeployer;
    IUniswapV3Factory public factory;
    address public pool;
    address[2] public pairs;
    uint32 public TWAP_PERIOD = 300; // 5 minutes

    Token1 public token1;
    Token2 public token2;
    Token3 public token3;
    Token4 public token4;
    Token5 public token5;
    Token6 public token6;
    Token7 public token7;
    Token8 public token8;
    Token9 public token9;
    USDC public usdc;
    USDT public usdt;

    address public owner = address(31);
    address public user1 = address(32);
    address public user2 = address(33);
    address public developerWallet = address(34);
    address public founderWallet = address(45);

    uint256 public constant INITIAL_BALANCE = 100000 * 10 ** 18; // 100 tokens
    uint256 public constant INITIAL_BALANCE_DENORMALIZED = 1000;
    uint256 public constant LOCK_AMOUNT = 10 * 10 ** 18; // 10 tokens
    uint256 public constant LOCK_AMOUNT_DENORMALIZED = 10;
    uint256 public REDISTRIBUTION_INTERVAL = 30 days;
    uint256 distributionStartTimestamp;
    uint256 public TOKEN_DECIMALS = 18;
    uint256 public USD_FEED_DECIMALS = 8;
    uint256 public USD_SCALER = 1e6;

    function setUp() public {
        // Fork mainnet for testing
        // vm.createSelectFork("https://eth-mainnet.g.alchemy.com/v2/reRHZn-g99QDHwJ1yuBt41gN4yyQ_S_S");
        vm.deal(address(this), 10 ether); // Give 10 ether to this contract
        // Deploy mock registry
        registry = new MockFeedRegistry();
        // deploy Uniswap V3 factory
        poolDeployer = new UniswapV3PoolDeployer();
        factory = new UniswapV3Factory();

        // Deploy tokens
        token1 = new Token1();
        token2 = new Token2();
        token3 = new Token3();
        token4 = new Token4();
        token5 = new Token5();
        token6 = new Token6();
        token7 = new Token7();
        token8 = new Token8();
        token9 = new Token9();
        usdc = new USDC();
        usdt = new USDT();

        token8.mint(address(this), 10000 * INITIAL_BALANCE);
        token9.mint(address(this), 10000 * INITIAL_BALANCE);
        usdt.mint(address(this), 10000 * INITIAL_BALANCE);
        usdc.mint(address(this), 10000 * INITIAL_BALANCE);

        pool = factory.createPool(
            address(token8),
            address(usdc),
            uint24(10000)
        );
        console.log("");
        console.log("1. Token8/USDC: %d", IUniswapV3Pool(pool).liquidity());
        console.log("");
        // initialize pool at price = 1:1 => tick = 0
        uint160 initialSqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        IUniswapV3Pool(pool).initialize(initialSqrtPriceX96);
        IUniswapV3Pool(pool).increaseObservationCardinalityNext(10); // Store 10 observations
        // add liquidity around tick 0
        token8.approve(pool, type(uint256).max);
        usdc.approve(pool, type(uint256).max);
        console.log("");
        console.log("2. Token8/USDC: %d", IUniswapV3Pool(pool).liquidity());
        console.log("");
        IUniswapV3Pool(pool).mint(
            address(this),
            -200,
            200,
            1e18,
            abi.encode("")
        );
        console.log("");
        console.log("3. Token8/USDC: %d", IUniswapV3Pool(pool).liquidity());
        console.log("");
        vm.warp(block.timestamp + 300);
        IUniswapV3Pool(pool).mint(
            address(this),
            -200,
            200,
            1e18,
            abi.encode("")
        );
        console.log("");
        console.log("4. Token8/USDC: %d", IUniswapV3Pool(pool).liquidity());
        console.log("");

        // pairs[0] = address(usdt);
        // pairs[1] = address(usdc);

        // // create and initialize pools for token1 <> base at 0.3% fee
        // for (uint i = 0; i < pairs.length; i++) {
        //     address pool2Addr = factory.createPool(
        //         address(token8),
        //         pairs[i],
        //         10000
        //     );
        //     IUniswapV3Pool pool2 = IUniswapV3Pool(pool2Addr);
        //     sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        //     pool2.initialize(sqrtPriceX96);
        //     pool2.increaseObservationCardinalityNext(100);
        //     mintToPool(token9, IERC20(pairs[i]), 1e18, 1e18, pool2);
        //     swapToken0For1(1e18, pool2);
        // }

        // Deploy BuffCat
        vm.startPrank(owner);
        // 1. Deploy the logic contract.
        buffCat = new BuffCatUpgradeable();

        // 2. Encode the initializer call.
        bytes memory data = abi.encodeWithSelector(
            BuffCatUpgradeable.initialize.selector,
            developerWallet,
            founderWallet,
            registry,
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

        distributionStartTimestamp = block.timestamp;

        // Set up mock prices
        registry.setPrice(
            address(token1),
            Denominations.USD,
            int256(2000 * 10 ** 8)
        ); // $2000
        registry.setPrice(
            address(token2),
            Denominations.USD,
            int256(60000 * 10 ** 8)
        ); // $60000
        registry.setPrice(
            address(token3),
            Denominations.USD,
            int256(1 * 10 ** 8)
        ); // $1
        registry.setPrice(
            address(token4),
            Denominations.USD,
            int256(1 * 10 ** 8)
        ); // $1
        registry.setPrice(
            address(token5),
            Denominations.USD,
            int256(1 * 10 ** 8)
        ); // $1
        registry.setPrice(
            address(token6),
            Denominations.USD,
            int256(1 * 10 ** 8)
        ); // $1
        registry.setPrice(
            address(token7),
            Denominations.USD,
            int256(2000 * 10 ** 8)
        );
        registry.setPrice(
            address(usdc),
            Denominations.USD,
            int256(17 * 10 ** 8)
        ); // $1
        registry.setPrice(
            address(usdt),
            Denominations.USD,
            int256(1 * 10 ** 8)
        ); // $1

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

        // Log what the pool is asking for vs. what we have
        console.log("Pool: ", pool);
        console.log(
            "Owed0:",
            amount0Owed,
            "  Bal0:",
            IERC20(_token0).balanceOf(address(this))
        );
        console.log(
            "Owed1:",
            amount1Owed,
            "  Bal1:",
            IERC20(_token1).balanceOf(address(this))
        );

        // transfer exactly the amounts the pool is expecting
        if (amount0Owed > 0) IERC20(_token0).transfer(pool, amount0Owed);
        if (amount1Owed > 0) IERC20(_token1).transfer(pool, amount1Owed);
    }

    // Helper function to advance time
    function skip(uint256 time) internal override {
        vm.warp(block.timestamp + time);
    }

    function testUniswapTwap() public {
        IERC20 tokenA = token8;
        IERC20 tokenB = token1;
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(tokenA),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        uint256 tokenAPrice = 17 * 10 ** 8;
        uint8 tokenADecimals = 18;
        uint8 tokenAFeedDecimals = 8;

        uint256 tokenBPrice = 2000 * 10 ** 8;
        uint8 tokenBDecimals = 18;
        uint8 tokenBFeedDecimals = 8;

        // uint256 addedValueUSD = buffCat.testingAddedValueUSD();
        // console.log("Testing Added Value USD: %d", addedValueUSD);
        // uint256 ogTokenAmount = (addedValueUSD * (10 ** (18 + 8))) /
        //     (tokenAPrice * (10 ** 6));
        // assertEq(
        //     ogTokenAmount,
        //     poolValue,
        //     "Checking if added usd value can be converted to proper token amount"
        // );

        uint256 nonStableRewardPoolUsdValue = (poolValue *
            tokenAPrice *
            USD_SCALER) / (10 ** (tokenADecimals + tokenAFeedDecimals));
        console.log(
            "Non Stable Reward Pool (After Locking Token 2 by user2): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log(
            "Test Side: Non Stable Reward Pool (After Locking Token 2 by user2): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log("");

        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 currentBalance = tokenA.balanceOf(address(user1));
        assertEq(currentBalance, 100000 * 10 ** 18, "1: Wrong balance");

        buffCat.lockAssets(
            address(tokenB),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        nonStableRewardPoolUsdValue +=
            (poolValue * tokenBPrice * USD_SCALER) /
            (10 ** (tokenBDecimals + tokenBFeedDecimals));
        console.log(
            "Non Stable Reward Pool (After Locking TokenB by user1): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log(
            "Test Side: Non Stable Reward Pool (After Locking TokenB by user1): %d",
            nonStableRewardPoolUsdValue
        );
        console.log("");

        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);
        buffCat.claimRewards(tokens, 0, 0);

        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * tokenBPrice) /
            (10 ** (tokenBDecimals + tokenBFeedDecimals));

        uint256 rewardMultiplier = 100;
        uint256 userWeighted = (effectiveAmountInUsd * rewardMultiplier) / 100;
        uint256 safenonStableRewardPoolUSDValue = nonStableRewardPoolUsdValue >
            0
            ? nonStableRewardPoolUsdValue
            : 1;
        uint256 userTotalRewards = (userWeighted * nonStableDailyClaimLimit) /
            safenonStableRewardPoolUSDValue;
        uint256 userDailyRewards = (userTotalRewards * 10) / 100;
        uint256 cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        uint256 rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        uint256 rewardsTokenCount = (rewards *
            10 ** (tokenAFeedDecimals + tokenADecimals)) / tokenAPrice;
        rewardsTokenCount = rewardsTokenCount > poolValue
            ? poolValue
            : rewardsTokenCount;
        rewardsTokenCount = rewardsTokenCount - ((rewardsTokenCount * 5) / 100);

        currentBalance = tokenA.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "2: Wrong balance"
        );

        vm.stopPrank();
    }

    // make another test but stable reward claiming by claiming token7
    // make a test checking 0.00...x value is calculated and returned as price per smallest unit of a token
    function testNonStableRewardsClaiming() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        uint256 token1Price = 2000e8;
        uint8 token1Decimals = 18;
        uint8 token1FeedDecimals = 8;

        uint256 token2Price = 60000e8;
        uint8 token2Decimals = 18;
        uint8 token2FeedDecimals = 8;

        uint256 nonStableRewardPoolUsdValue = (poolValue * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        uint256 currentBalance = token1.balanceOf(address(user2));
        assertEq(
            currentBalance,
            INITIAL_BALANCE - LOCK_AMOUNT,
            "1: Wrong balance"
        );

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        nonStableRewardPoolUsdValue +=
            (poolValue * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token1);
        buffCat.claimRewards(tokens, 0, 0);

        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));

        uint256 rewardMultiplier = 100;
        uint256 userWeighted = (effectiveAmountInUsd * rewardMultiplier) / 100;
        uint256 safenonStableRewardPoolUSDValue = nonStableRewardPoolUsdValue >
            0
            ? nonStableRewardPoolUsdValue
            : 1;
        uint256 userTotalRewards = (userWeighted * nonStableDailyClaimLimit) /
            safenonStableRewardPoolUSDValue;
        uint256 userDailyRewards = (userTotalRewards * 10) / 100;
        uint256 cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        uint256 rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        uint256 rewardsTokenCount = (rewards *
            10 ** (token1FeedDecimals + token1Decimals)) / token1Price;
        rewardsTokenCount = rewardsTokenCount > poolValue
            ? poolValue
            : rewardsTokenCount;
        rewardsTokenCount = rewardsTokenCount - ((rewardsTokenCount * 5) / 100);

        currentBalance = token1.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "2: Wrong balance"
        );

        vm.stopPrank();
    }

    function testStableRewardsClaiming() public {
        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        uint256 token7Price = 2000e8;
        uint8 token7FeedDecimals = 8;
        uint8 token7Decimals = 18;

        uint256 token2Price = 60000e8;
        uint8 token2FeedDecimals = 8;
        uint8 token2Decimals = 18;

        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        buffCat.lockAssets(
            address(token7),
            LOCK_AMOUNT * 100,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 currentBalance = token2.balanceOf(address(user1));
        assertEq(currentBalance, INITIAL_BALANCE, "1: Wrong balance");

        buffCat.lockAssets(
            address(token7),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 nonStableRewardPoolUsdValue = (poolValue * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        console.log(
            "Non Stable Reward Pool %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log(
            "Test Side: Non Stable Reward Pool %d",
            nonStableRewardPoolUsdValue
        );
        console.log("");

        uint256 stableRewardPoolUsdValue = ((poolValue * token7Price) /
            (10 ** (token7FeedDecimals + token7Decimals))) * 101;
        assertEq(
            buffCat.stableRewardPoolUSDValue(),
            stableRewardPoolUsdValue,
            "Wrong Pool Value"
        );
        console.log(
            "Stable Reward Pool (USD Value) = %d",
            stableRewardPoolUsdValue
        );

        vm.warp(block.timestamp + 1 days);

        // pool usd value = 1000
        // daily claim limit = 1000 * 3 / 10000 = 0.3, so truncated to 0
        address[] memory tokens1 = new address[](1);
        tokens1[0] = address(token2);
        buffCat.claimRewards(tokens1, 0, 0);

        uint256 stableDailyClaimLimit = (stableRewardPoolUsdValue * 3) / 100000;

        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token7Price) /
            (10 ** (token7FeedDecimals + token7Decimals));

        uint256 safeStableRewardPoolUSDValue = stableRewardPoolUsdValue > 0
            ? stableRewardPoolUsdValue
            : 1;
        uint256 userTotalRewards = (effectiveAmountInUsd *
            stableDailyClaimLimit) / safeStableRewardPoolUSDValue;
        uint256 userDailyRewards = (userTotalRewards * 3) / 100000;
        uint256 cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        uint256 rewards = availableRewards > stableDailyClaimLimit
            ? stableDailyClaimLimit
            : availableRewards;
        uint256 rewardsTokenCount = (rewards *
            10 ** (token2FeedDecimals + token2Decimals)) / token2Price;
        rewardsTokenCount = rewardsTokenCount > poolValue
            ? poolValue
            : rewardsTokenCount;
        rewardsTokenCount = rewardsTokenCount - ((rewardsTokenCount * 5) / 100);

        currentBalance = token2.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "2: Wrong balance"
        );
        console.log(
            "Balance after claiming rewards (token2) = %d",
            currentBalance
        );

        vm.stopPrank();
    }

    // Multiplier System Tests
    function testMultipleTokenDiversityBonuses() public {
        vm.startPrank(user1);

        // Lock first token
        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        assertEq(1, buffCat.userUniqueTokensCount(user1));

        // Lock second token
        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        // Lock third token
        buffCat.lockAssets(
            address(token3),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        assertEq(3, buffCat.userUniqueTokensCount(user1));

        // Lock fourth token
        buffCat.lockAssets(
            address(token4),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        assertEq(4, buffCat.userUniqueTokensCount(user1));

        // Lock fifth token
        buffCat.lockAssets(
            address(token5),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        assertEq(5, buffCat.userUniqueTokensCount(user1));

        // Lock sixth token
        buffCat.lockAssets(
            address(token6),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        assertEq(6, buffCat.userUniqueTokensCount(user1));

        vm.stopPrank();
    }

    function testReferrals() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.stopPrank();

        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(user1)
        );

        assertEq(
            buffCat.referralBoostEndTime(address(user1)),
            block.timestamp + 1 days,
            "1: Wrong Referral Boost Duration"
        );
        assertEq(
            buffCat.referralBoostEndTime(address(user2)),
            block.timestamp + 1 days,
            "2: Wrong Referral Boost Duration"
        );

        for (uint256 index = 0; index < 30; index++) {
            buffCat.lockAssets(
                address(token1),
                LOCK_AMOUNT,
                30,
                LockType.FLEXIBLE,
                address(user1)
            );
        }

        assertEq(
            buffCat.referralBoostEndTime(address(user1)),
            block.timestamp + 30 days,
            "3: Wrong Referral Boost Duration"
        );
        assertEq(
            buffCat.referralBoostEndTime(address(user2)),
            block.timestamp + 1 days,
            "4: Wrong Referral Boost Duration"
        );

        vm.stopPrank();
    }

    function test50PercentLockCompletionForRewardBoosts() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            60,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.stopPrank();

        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            60,
            LockType.FLEXIBLE,
            address(0)
        );

        vm.warp(block.timestamp + 30 days);

        address[] memory tokens4 = new address[](1);
        tokens4[0] = address(token2);
        buffCat.claimRewards(tokens4, 0, 0);

        vm.stopPrank();
    }

    function testUnclaimedRewardsClaiming() public {
        vm.startPrank(user2);

        uint256 lockAmount = LOCK_AMOUNT * 100;
        buffCat.lockAssets(
            address(token2),
            lockAmount,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (lockAmount * 5) / 100;
        uint256 lockedAmount = lockAmount - fees;
        uint256 token2PoolValue = (fees * 80) / 100;

        uint256 token1Price = 2000e8;
        uint8 token1FeedDecimals = 8;
        uint8 token1Decimals = 18;

        uint256 token2Price = 60000e8;
        uint8 token2FeedDecimals = 8;
        uint8 token2Decimals = 18;

        uint256 nonStableRewardPoolUsdValue = (token2PoolValue * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));

        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 currentBalance = token2.balanceOf(address(user1));
        assertEq(currentBalance, 100000 * 10 ** 18, "1: Wrong balance");

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 token1Fees = (LOCK_AMOUNT * 5) / 100;
        uint256 token1LockedAmount = LOCK_AMOUNT - token1Fees;
        uint256 token1PoolValue = (token1Fees * 80) / 100;

        nonStableRewardPoolUsdValue +=
            (token1PoolValue * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens5 = new address[](1);
        tokens5[0] = address(token2);
        buffCat.claimRewards(tokens5, 0, 0);

        uint256 lastClaimTime = block.timestamp;

        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = token1LockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));

        uint256 rewardMultiplier = 100;
        uint256 userWeighted = (effectiveAmountInUsd * rewardMultiplier) / 100;
        uint256 safenonStableRewardPoolUSDValue = nonStableRewardPoolUsdValue >
            0
            ? nonStableRewardPoolUsdValue
            : 1;
        uint256 userTotalRewards = (userWeighted * nonStableDailyClaimLimit) /
            safenonStableRewardPoolUSDValue;
        uint256 userDailyRewards = (userTotalRewards * 10) / 100;
        uint256 cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        uint256 rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        uint256 rewardsTokenCount = (rewards *
            10 ** (token2FeedDecimals + token2Decimals)) / token2Price;
        rewardsTokenCount = rewardsTokenCount > token2PoolValue
            ? token2PoolValue
            : rewardsTokenCount;
        uint256 fee = (rewardsTokenCount * 5) / 100;
        rewardsTokenCount = rewardsTokenCount - fee;
        uint256 valueAddedBackToPool = (fee * 80) / 100;

        currentBalance = token2.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "2: Wrong balance"
        );

        nonStableDailyClaimLimit -= rewards;
        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            nonStableDailyClaimLimit,
            "1: Wrong Daily Non Stable Daily Claim Limit Value"
        );
        nonStableRewardPoolUsdValue -=
            (rewardsTokenCount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        nonStableRewardPoolUsdValue +=
            (valueAddedBackToPool * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Non Stable Reward Pool Value"
        );
        token2PoolValue -= rewardsTokenCount;
        token2PoolValue += valueAddedBackToPool;
        uint256 previousRewards = rewardsTokenCount;

        vm.warp(block.timestamp + 20 days);
        address[] memory tokens6 = new address[](1);
        tokens6[0] = address(token2);
        buffCat.claimRewards(tokens6, 0, 20);

        nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) / 100);

        availableRewards = 0;
        effectiveAmount = token1LockedAmount;
        effectiveAmountInUsd =
            (effectiveAmount * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));

        rewardMultiplier = 100;
        userWeighted = (effectiveAmountInUsd * rewardMultiplier) / 100;
        safenonStableRewardPoolUSDValue = nonStableRewardPoolUsdValue > 0
            ? nonStableRewardPoolUsdValue
            : 1;
        userTotalRewards =
            (userWeighted * nonStableDailyClaimLimit) /
            safenonStableRewardPoolUSDValue;
        userDailyRewards = (userTotalRewards * 10) / 100;
        cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        rewardsTokenCount =
            (rewards * 10 ** (token2FeedDecimals + token2Decimals)) /
            token2Price;

        rewardsTokenCount = rewardsTokenCount * 20;
        rewardsTokenCount = rewardsTokenCount > token2PoolValue
            ? token2PoolValue
            : rewardsTokenCount;
        fee = (rewardsTokenCount * 5) / 100;
        rewardsTokenCount = rewardsTokenCount - fee;
        valueAddedBackToPool = (fee * 80) / 100;

        currentBalance = token2.balanceOf(address(user1));
        assertEq(
            currentBalance,
            (INITIAL_BALANCE + previousRewards) + rewardsTokenCount,
            "3: Wrong balance"
        );

        nonStableDailyClaimLimit -= rewards;
        nonStableRewardPoolUsdValue -=
            (rewardsTokenCount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        nonStableRewardPoolUsdValue +=
            (valueAddedBackToPool * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));

        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            nonStableDailyClaimLimit,
            "2: Wrong Daily Non Stable Daily Claim Limit Value"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Non Stable Reward Pool Value"
        );

        vm.stopPrank();
    }

    function testBatchNonStableRewardsClaiming() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        uint256 token1Price = 2000e8;
        uint8 token1FeedDecimals = 8;
        uint8 token1Decimals = 18;

        uint256 token2Price = 60000e8;
        uint8 token2FeedDecimals = 8;
        uint8 token2Decimals = 18;

        uint256 nonStableRewardPoolUsdValue = (poolValue * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        console.log(
            "Non Stable Reward Pool (After Locking Token 2 by user2): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log(
            "Test Side: Non Stable Reward Pool (After Locking Token 2 by user2): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log("");

        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 currentBalance = token2.balanceOf(address(user1));
        assertEq(currentBalance, 100000 * 10 ** 18, "1: Wrong balance");

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        nonStableRewardPoolUsdValue +=
            (poolValue * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));
        console.log(
            "Non Stable Reward Pool (After Locking Token1 by user1): %d",
            buffCat.nonStableRewardPoolUSDValue()
        );
        console.log(
            "Test Side: Non Stable Reward Pool (After Locking Token1 by user1): %d",
            nonStableRewardPoolUsdValue
        );
        console.log("");

        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](2);
        tokens[0] = address(token2);
        tokens[1] = address(token1);
        buffCat.claimRewards(tokens, 0, 0);

        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));

        uint256 rewardMultiplier = 100;
        uint256 userWeighted = (effectiveAmountInUsd * rewardMultiplier) / 100;
        uint256 safenonStableRewardPoolUSDValue = nonStableRewardPoolUsdValue >
            0
            ? nonStableRewardPoolUsdValue
            : 1;
        uint256 userTotalRewards = (userWeighted * nonStableDailyClaimLimit) /
            safenonStableRewardPoolUSDValue;
        uint256 userDailyRewards = (userTotalRewards * 10) / 100;
        uint256 cap = userDailyRewards > 1 ? userDailyRewards : 1;
        availableRewards = cap;

        uint256 rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        uint256 distributedRewards = rewards / 2;

        uint256 rewardsTokenCount1 = (distributedRewards *
            10 ** (token2FeedDecimals + token2Decimals)) / token2Price;
        rewardsTokenCount1 = rewardsTokenCount1 > poolValue
            ? poolValue
            : rewardsTokenCount1;
        rewardsTokenCount1 =
            rewardsTokenCount1 -
            ((rewardsTokenCount1 * 5) / 100);

        uint256 rewardsTokenCount2 = (distributedRewards *
            10 ** (token1FeedDecimals + token1Decimals)) / token1Price;
        rewardsTokenCount2 = rewardsTokenCount2 > poolValue
            ? poolValue
            : rewardsTokenCount2;
        rewardsTokenCount2 =
            rewardsTokenCount2 -
            ((rewardsTokenCount2 * 5) / 100);

        currentBalance = token2.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount1,
            "2: Wrong balance"
        );

        currentBalance = token1.balanceOf(address(user1));
        assertEq(
            currentBalance,
            (INITIAL_BALANCE - LOCK_AMOUNT) + rewardsTokenCount2,
            "3: Wrong balance"
        );

        vm.stopPrank();
    }
}
