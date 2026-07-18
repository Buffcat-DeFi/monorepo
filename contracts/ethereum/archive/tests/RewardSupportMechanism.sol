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

    // Helper function to get user's lock info
    function getLockInfo(
        address user,
        uint256 lockId
    )
        internal
        view
        returns (
            uint256 amount,
            uint256 lockStart,
            uint256 lockEnd,
            uint256 lastClaim,
            uint256 withdrawn,
            uint256 _days,
            uint256 rewardMultiplier,
            address lockedToken,
            LockType lockType
        )
    {
        return buffCat.userLocks(user, lockId);
    }

    function getPrice(
        address base
    ) internal view returns (uint256, uint8, uint8) {
        // (,int price,,,) = registry.latestRoundData(base, Denominations.USD);

        // uint8 decimals = IERC20Metadata(base).decimals();
        // // price is becoming zero since dividing for example 1000$ by 10^18 results in a fraction value
        // // return uint256(price) / (10 ** decimals);
        // return uint256(price);

        (, int256 price, , , ) = registry.latestRoundData(
            base,
            Denominations.USD
        );
        uint8 feedDecimals = registry.decimals(base, Denominations.USD);
        uint8 tokenDecimals = IERC20Metadata(base).decimals();

        // Calculate price per wei with 18 decimals of precision
        return (uint256(price), feedDecimals, tokenDecimals);
    }

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * 5) / 100;
    }

    // Correct the normalizeAmount function
    function normalizeAmount(
        uint256 _amount,
        uint8 _decimals
    ) internal pure returns (uint256) {
        require(_decimals <= 18, "Invalid ERC20 Token");
        return _amount * (10 ** (18 - _decimals));
    }

    // Correct the denormalizeAmount function
    function denormalizeAmount(
        uint256 _amount,
        uint8 _decimals
    ) internal pure returns (uint256) {
        if (_decimals < 18) {
            return _amount / (10 ** (18 - _decimals));
        }
        return _amount;
    }

    function getCurrentRedistributionMonth() internal view returns (uint256) {
        return
            ((block.timestamp - distributionStartTimestamp) /
                REDISTRIBUTION_INTERVAL) % 6;
    }

    // Reward Distribution Tests
    function testNonStableDailyRewardPoolCalculation() public {
        vm.startPrank(user1);

        console.log("1");
        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        console.log("2");
        (
            uint256 token1Price,
            uint8 token1FeedDecimals,
            uint8 token1Decimals
        ) = getPrice(address(token1));
        (
            uint256 token2Price,
            uint8 token2FeedDecimals,
            uint8 token2Decimals
        ) = getPrice(address(token2));
        (
            uint256 token7Price,
            uint8 token7FeedDecimals,
            uint8 token7Decimals
        ) = getPrice(address(token7));

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        console.log("3");
        uint256 nonStableRewardPool = poolValue;

        console.log("4");
        uint256 nonStableRewardPoolUsdValue = (poolValue * token1Price) /
            (10 ** (token1FeedDecimals + token1Decimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        vm.stopPrank();

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

        console.log("5");
        nonStableRewardPool += poolValue;

        console.log("6");
        nonStableRewardPoolUsdValue +=
            (poolValue * token2Price) /
            (10 ** (token1FeedDecimals + token1Decimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        buffCat.lockAssets(
            address(token7),
            LOCK_AMOUNT,
            120,
            LockType.FLEXIBLE,
            address(0)
        );

        console.log("7");
        uint256 stableRewardPool = poolValue;

        console.log("8");
        uint256 stableRewardPoolUsdValue = (poolValue * token7Price) /
            (10 ** (token7FeedDecimals + token7Decimals));
        assertEq(
            buffCat.stableRewardPoolUSDValue(),
            stableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token2);
        buffCat.claimRewards(tokens, 0, 0);

        console.log("9");
        uint256 nonStableDailyClaimLimit = (nonStableRewardPoolUsdValue * 10) /
            100;
        uint256 stableDailyClaimLimit = (stableRewardPoolUsdValue * 3) / 100000;

        console.log("10");
        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token1Price) /
            (10 ** (token1FeedDecimals + token1Decimals));

        console.log("11");
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

        console.log("12");
        uint256 rewards = availableRewards > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : availableRewards;
        uint256 rewardsTokenCount = (rewards *
            10 ** (token2FeedDecimals + token2Decimals)) / token2Price;
        rewardsTokenCount = rewardsTokenCount > poolValue
            ? poolValue
            : rewardsTokenCount;
        uint256 fee = calculateFee(rewardsTokenCount);
        rewardsTokenCount = rewardsTokenCount - fee;
        uint256 valueAddedBackToPool = (fee * 80) / 100;

        console.log("13");
        nonStableRewardPool = rewardsTokenCount > nonStableRewardPool
            ? 0
            : nonStableRewardPool - rewardsTokenCount;
        nonStableRewardPool += valueAddedBackToPool;

        console.log("14");
        uint256 removedToken2Value = ((rewardsTokenCount * token2Price) /
            10 ** (token2FeedDecimals + token2Decimals));
        nonStableRewardPoolUsdValue = nonStableRewardPoolUsdValue <
            removedToken2Value
            ? 0
            : nonStableRewardPoolUsdValue - removedToken2Value;
        nonStableRewardPoolUsdValue +=
            (valueAddedBackToPool * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        assertEq(
            buffCat.stableRewardPoolUSDValue(),
            stableRewardPoolUsdValue,
            "3: Wrong Pool Value"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "4: Wrong Pool Value"
        );

        console.log("15");
        uint256 currentBalance = token2.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "Wrong balance"
        );

        vm.stopPrank();

        console.log("16");
        uint256 newNonStableDailyClaimLimit = rewards > nonStableDailyClaimLimit
            ? 0
            : nonStableDailyClaimLimit - rewards;

        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            newNonStableDailyClaimLimit,
            "Incorrect daily non-stable pool claim limit"
        );

        assertEq(
            buffCat.dailyStablePoolClaimLimit(),
            stableDailyClaimLimit,
            "Incorrect daily stable pool claim limit"
        );
    }

    function testStableDailyRewardPoolCalculation() public {
        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token7),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;
        uint256 poolValue = (fees * 80) / 100;

        uint256 stableRewardPool = poolValue;

        vm.stopPrank();

        vm.startPrank(user1);

        uint256 currentBalance = token2.balanceOf(address(user1));
        assertEq(currentBalance, 100000 * 10 ** 18, "1: Wrong balance");

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 nonStableRewardPool = poolValue;
        assertEq(
            buffCat.claimableTokens(address(token7)),
            poolValue,
            "Wrong Claimable Token Count"
        );

        (
            uint256 token7Price,
            uint8 token7FeedDecimals,
            uint8 token7Decimals
        ) = getPrice(address(token7));
        (
            uint256 token2Price,
            uint8 token2FeedDecimals,
            uint8 token2Decimals
        ) = getPrice(address(token2));

        uint256 nonStableRewardPoolUsdValue = (poolValue * token2Price) /
            (10 ** (token2FeedDecimals + token2Decimals));
        uint256 stableRewardPoolUsdValue = (poolValue * token7Price) /
            (10 ** (token7FeedDecimals + token7Decimals));
        assertEq(
            buffCat.stableRewardPoolUSDValue(),
            stableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        address[] memory tokens2 = new address[](1);
        tokens2[0] = address(token7);
        buffCat.claimRewards(tokens2, 0, 0);
        uint256 stableDailyClaimLimit = (stableRewardPoolUsdValue * 3) / 100000;
        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = lockedAmount;
        uint256 effectiveAmountInUsd = (effectiveAmount * token2Price) /
            (10 ** (token2FeedDecimals + token2Decimals));

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
            10 ** (token7FeedDecimals + token7Decimals)) / token7Price;
        rewardsTokenCount = rewardsTokenCount > poolValue
            ? poolValue
            : rewardsTokenCount;
        uint256 fee = calculateFee(rewardsTokenCount);
        rewardsTokenCount = rewardsTokenCount - fee;
        uint256 valueAddedBackToPool = (fee * 80) / 100;

        stableRewardPool -= rewardsTokenCount;
        stableRewardPool += valueAddedBackToPool;

        currentBalance = token7.balanceOf(address(user1));
        assertEq(
            currentBalance,
            INITIAL_BALANCE + rewardsTokenCount,
            "2: Wrong balance"
        );

        vm.stopPrank();

        uint256 newStableDailyClaimLimit = rewards > stableDailyClaimLimit
            ? 0
            : stableDailyClaimLimit - rewards;

        uint256 removedUsdValue = (rewardsTokenCount * token7Price) /
            (10 ** (token7FeedDecimals + token7Decimals));
        stableRewardPoolUsdValue = stableRewardPoolUsdValue < removedUsdValue
            ? 0
            : stableRewardPoolUsdValue - removedUsdValue;
        stableRewardPoolUsdValue +=
            (valueAddedBackToPool * token7Price) /
            (10 ** (token7Decimals + token7FeedDecimals));
        assertEq(
            buffCat.stableRewardPoolUSDValue(),
            stableRewardPoolUsdValue,
            "3: Wrong Pool Value"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "4: Wrong Pool Value"
        );

        console.log("13");
        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            nonStableDailyClaimLimit,
            "Incorrect daily non-stable pool claim limit"
        );

        assertEq(
            buffCat.dailyStablePoolClaimLimit(),
            newStableDailyClaimLimit,
            "Incorrect daily stable pool claim limit"
        );
    }

    // Fee Structure and Management Tests
    function testLockUnlockFeeCollection() public {
        vm.startPrank(user1);

        // Record initial balances
        uint256 initialOwnerBalance = token1.balanceOf(founderWallet);
        uint256 initialDevBalance = token1.balanceOf(developerWallet);

        // Lock tokens
        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        // Verify fee distribution after lock
        uint256 lockFee = (LOCK_AMOUNT * 5) / 100;
        uint256 expectedOwnerShare = (lockFee * 10) / 100; // 10% to owner
        uint256 expectedDevShare = (lockFee * 10) / 100; // 10% to dev wallet

        assertEq(
            token1.balanceOf(founderWallet),
            initialOwnerBalance + expectedOwnerShare,
            "Incorrect owner fee share"
        );

        assertEq(
            token1.balanceOf(developerWallet),
            initialDevBalance + expectedDevShare,
            "Incorrect dev wallet fee share"
        );

        // Skip some time
        skip(15 days);

        // Unlock half of tokens
        uint256 unlockAmount = LOCK_AMOUNT / 2;
        buffCat.unlockAssets(0, unlockAmount);

        // Verify fee distribution after unlock
        uint256 unlockFee = (unlockAmount * 5) / 100;
        expectedOwnerShare = (unlockFee * 10) / 100; // 10% to owner
        expectedDevShare = (unlockFee * 10) / 100; // 10% to dev wallet

        assertEq(
            token1.balanceOf(founderWallet),
            initialOwnerBalance + ((lockFee * 10) / 100) + expectedOwnerShare,
            "Incorrect owner fee share after unlock"
        );

        assertEq(
            token1.balanceOf(developerWallet),
            initialDevBalance + ((lockFee * 10) / 100) + expectedDevShare,
            "Incorrect dev wallet fee share after unlock"
        );

        vm.stopPrank();
    }

    function testFeeDistribution() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 fees = (LOCK_AMOUNT * 5) / 100;
        uint256 lockedAmount = LOCK_AMOUNT - fees;

        uint256 ownerShare = (fees * 10) / 100;
        uint256 developerShare = (fees * 10) / 100;

        uint256 ownerBalance = token1.balanceOf(founderWallet);
        uint256 developerBalance = token1.balanceOf(developerWallet);
        assertEq(ownerBalance, ownerShare, "1: Wrong Owner Balance");
        assertEq(
            developerBalance,
            developerShare,
            "1: Wrong Developer Balance"
        );

        vm.warp(block.timestamp + 1 days);
        // claim rewards distributes fees?

        buffCat.unlockAssets(0, lockedAmount);

        fees = (lockedAmount * 5) / 100;

        ownerShare += (fees * 10) / 100;
        developerShare += (fees * 10) / 100;

        ownerBalance = token1.balanceOf(founderWallet);
        developerBalance = token1.balanceOf(developerWallet);
        assertEq(ownerBalance, ownerShare, "2: Wrong Owner Balance");
        assertEq(
            developerBalance,
            developerShare,
            "2: Wrong Developer Balance"
        );

        vm.stopPrank();
    }

    // Stablecoin Handling Tests
    function testStableCoinIdentification() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token7),
            LOCK_AMOUNT,
            60,
            LockType.FLEXIBLE,
            address(0)
        );

        assertTrue(
            buffCat.isStableCoin(address(token7)),
            "Token3 should be identified as stablecoin"
        );

        vm.stopPrank();
    }

    function testGetPriceFunction() public view {
        (
            uint256 token1Price,
            uint8 token1FeedDecimals,
            uint8 token1Decimals
        ) = getPrice(address(token1));
        console.log("Token1 Price = %d", token1Price);

        (
            uint256 token2Price,
            uint8 token2FeedDecimals,
            uint8 token2Decimals
        ) = getPrice(address(token2));
        console.log("Token2 Price = %d", token2Price);

        (
            uint256 token3Price,
            uint8 token3FeedDecimals,
            uint8 token3Decimals
        ) = getPrice(address(token3));
        console.log("Token3 Price = %d", token3Price);

        (
            uint256 token4Price,
            uint8 token4FeedDecimals,
            uint8 token4Decimals
        ) = getPrice(address(token4));
        console.log("Token4 Price = %d", token4Price);

        (
            uint256 token5Price,
            uint8 token5FeedDecimals,
            uint8 token5Decimals
        ) = getPrice(address(token5));
        console.log("Token5 Price = %d", token5Price);

        (
            uint256 token6Price,
            uint8 token6FeedDecimals,
            uint8 token6Decimals
        ) = getPrice(address(token6));
        console.log("Token6 Price = %d", token6Price);

        (
            uint256 token7Price,
            uint8 token7FeedDecimals,
            uint8 token7Decimals
        ) = getPrice(address(token7));
        console.log("Token7 Price = %d", token7Price);

        (, int256 price, , , ) = registry.latestRoundData(
            address(token1),
            Denominations.USD
        );
        uint256 divisor = 10 ** (18 + 8);
        uint256 rawBalance = 0.5 * 10 ** 18;
        uint256 rawToken1Price = 2000 * 10 ** 8;
        uint256 usdValue = (rawBalance * rawToken1Price) / divisor;
        console.log(
            "USD Value for LOCK_AMOUNT using new formula = %d",
            usdValue
        );
    }
}
