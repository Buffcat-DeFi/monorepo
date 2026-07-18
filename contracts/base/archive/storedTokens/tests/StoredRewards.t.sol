// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "../../../lib/forge-std/src/Test.sol";
import {BuffCatUpgradeable, LockType, LockInfo} from "../BuffCat.sol";
import {Token1} from "../../../test/tokens/Token1.sol";
import {Token2} from "../../../test/tokens/Token2.sol";
import {Token3} from "../../../test/tokens/Token3.sol";
import {Token4} from "../../../test/tokens/Token4.sol";
import {Token5} from "../../../test/tokens/Token5.sol";
import {Token6} from "../../../test/tokens/Token6.sol";
import {Token7} from "../../../test/tokens/Token7.sol";
import {FeedRegistryInterface} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import {Denominations} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol";
import {AggregatorV2V3Interface} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import {ERC1967Proxy} from "../../../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {MockFeedRegistry} from "../../../test/MockFeedRegistry.sol";

contract BuffCatTest is Test {
    BuffCatUpgradeable public buffCat;
    MockFeedRegistry public registry;
    Token1 public token1;
    Token2 public token2;
    Token3 public token3;
    Token4 public token4;
    Token5 public token5;
    Token6 public token6;
    Token7 public token7;

    address public owner = address(31);
    address public user1 = address(32);
    address public user2 = address(33);
    address public developerWallet = address(34);

    uint256 public constant INITIAL_BALANCE = 100000 * 10 ** 18; // 100 tokens
    uint256 public constant INITIAL_BALANCE_DENORMALIZED = 1000;
    uint256 public constant LOCK_AMOUNT = 10 * 10 ** 18; // 10 tokens
    uint256 public constant LOCK_AMOUNT_DENORMALIZED = 10;
    uint256 public REDISTRIBUTION_INTERVAL = 30 days;
    uint256 distributionStartTimestamp;
    uint256 public TOKEN_DECIMALS = 18;
    uint256 public USD_FEED_DECIMALS = 8;

    function setUp() public {
        // Fork mainnet for testing
        // vm.createSelectFork("https://eth-mainnet.g.alchemy.com/v2/reRHZn-g99QDHwJ1yuBt41gN4yyQ_S_S");

        // Deploy mock registry
        registry = new MockFeedRegistry();

        // Deploy tokens
        token1 = new Token1();
        token2 = new Token2();
        token3 = new Token3();
        token4 = new Token4();
        token5 = new Token5();
        token6 = new Token6();
        token7 = new Token7();

        // Deploy BuffCat
        vm.startPrank(owner);
        // 1. Deploy the logic contract.
        buffCat = new BuffCatUpgradeable();

        // 2. Encode the initializer call.
        bytes memory data = abi.encodeWithSelector(
            BuffCatUpgradeable.initialize.selector,
            developerWallet,
            registry
        );

        // 3. Deploy the proxy with the logic address and initializer data.
        ERC1967Proxy proxy = new ERC1967Proxy(address(buffCat), data);

        // 4. Cast the proxy address to your contract type.
        buffCat = BuffCatUpgradeable(address(proxy));

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

        // Whitelist stablecoins
        // buffCat.addStableCoin(address(token3));
        // buffCat.addStableCoin(address(token4));
        address[] memory stableCoins = new address[](1);
        stableCoins[0] = address(address(token7));
        buffCat.addStableCoin(stableCoins);

        address[] memory tokensWhitelist = new address[](7);
        tokensWhitelist[0] = address(token1);
        tokensWhitelist[1] = address(token2);
        tokensWhitelist[2] = address(token3);
        tokensWhitelist[3] = address(token4);
        tokensWhitelist[4] = address(token5);
        tokensWhitelist[5] = address(token6);
        tokensWhitelist[6] = address(token7);
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

        token1.mint(user2, INITIAL_BALANCE);
        token2.mint(user2, INITIAL_BALANCE);
        token3.mint(user2, INITIAL_BALANCE);
        token4.mint(user2, INITIAL_BALANCE);
        token5.mint(user2, INITIAL_BALANCE);
        token6.mint(user2, INITIAL_BALANCE);
        token7.mint(user2, INITIAL_BALANCE);

        // Approve tokens
        vm.startPrank(user1);
        token1.approve(address(buffCat), INITIAL_BALANCE);
        token2.approve(address(buffCat), INITIAL_BALANCE);
        token3.approve(address(buffCat), INITIAL_BALANCE);
        token4.approve(address(buffCat), INITIAL_BALANCE);
        token5.approve(address(buffCat), INITIAL_BALANCE);
        token6.approve(address(buffCat), INITIAL_BALANCE);
        token7.approve(address(buffCat), INITIAL_BALANCE);
        vm.stopPrank();

        vm.startPrank(user2);
        token1.approve(address(buffCat), INITIAL_BALANCE);
        token2.approve(address(buffCat), INITIAL_BALANCE);
        token3.approve(address(buffCat), INITIAL_BALANCE);
        token4.approve(address(buffCat), INITIAL_BALANCE);
        token5.approve(address(buffCat), INITIAL_BALANCE);
        token7.approve(address(buffCat), INITIAL_BALANCE);
        vm.stopPrank();
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

    function testRewardStoringAndClaimingLater() public {
        vm.startPrank(user1);

        buffCat.lockAssets(
            address(token2),
            LOCK_AMOUNT * 100,
            30,
            LockType.FLEXIBLE,
            address(0)
        );

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

        uint256 user1Fees = ((LOCK_AMOUNT * 100) * 5) / 100;
        uint256 user1PoolValue = (user1Fees * 80) / 100;

        uint256 nonStableRewardPool = user1PoolValue;
        assertEq(
            buffCat.nonStableRewardPool(),
            nonStableRewardPool,
            "1: Wrong Pool Value (Token Count)"
        );
        uint256 nonStableRewardPoolUsdValue = (user1PoolValue * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "1: Wrong Pool Value"
        );

        vm.stopPrank();

        vm.startPrank(user2);

        buffCat.lockAssets(
            address(token1),
            LOCK_AMOUNT,
            1,
            LockType.FLEXIBLE,
            address(0)
        );

        uint256 user2Fees = (LOCK_AMOUNT * 5) / 100;
        uint256 user2LockedAmount = LOCK_AMOUNT - user2Fees;
        uint256 user2PoolValue = (user2Fees * 80) / 100;

        nonStableRewardPool += user2PoolValue;
        assertEq(
            buffCat.nonStableRewardPool(),
            nonStableRewardPool,
            "2: Wrong Pool Value (Token Count)"
        );
        nonStableRewardPoolUsdValue +=
            (user2PoolValue * token1Price) /
            (10 ** (token1Decimals + token1FeedDecimals));
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "2: Wrong Pool Value"
        );

        vm.warp(block.timestamp + 1 days);

        // daily non stable claim limit is set
        address[] memory tokens9 = new address[](1);
        tokens9[0] = address(token2);
        buffCat.claimRewards(tokens9, 0, 0, false);

        uint256 nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) /
            100);

        uint256 availableRewards = 0;
        uint256 effectiveAmount = user2LockedAmount;
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
        rewardsTokenCount = rewardsTokenCount > user1PoolValue
            ? user1PoolValue
            : rewardsTokenCount;
        uint256 fee = calculateFee(rewardsTokenCount);
        rewardsTokenCount = rewardsTokenCount - fee;
        uint256 valueAddedBackToPool = (fee * 80) / 100;

        uint256 addedToken2 = rewardsTokenCount;
        user1PoolValue -= rewardsTokenCount;
        user1PoolValue += valueAddedBackToPool;
        uint256 balanceAfterRewards = token2.balanceOf(user2);
        assertEq(
            balanceAfterRewards,
            INITIAL_BALANCE + addedToken2,
            "1: Wrong Rewards Calculation"
        );

        nonStableRewardPool = rewardsTokenCount > nonStableRewardPool
            ? 0
            : nonStableRewardPool - rewardsTokenCount;
        nonStableRewardPool += valueAddedBackToPool;
        assertEq(
            buffCat.nonStableRewardPool(),
            nonStableRewardPool,
            "3: Wrong Pool Value (Token Count)"
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
            "3: Wrong Pool Value"
        );

        uint256 remainingDailyLimitAfterFirstClaim = nonStableDailyClaimLimit -
            rewards;
        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            remainingDailyLimitAfterFirstClaim,
            "1: Wrong Daily Non Stable Claim Limit"
        );

        vm.warp(block.timestamp + 1.1 days);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token2);
        buffCat.claimRewards(tokens, 0, 0, true);

        nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) / 100);

        availableRewards = 0;
        effectiveAmount = user2LockedAmount;
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
        rewardsTokenCount = rewardsTokenCount > user1PoolValue
            ? user1PoolValue
            : rewardsTokenCount;

        uint256 rewardsForClaimingLater = buffCat.storedTokensForLaterClaim(
            user2,
            0,
            address(token2)
        );
        assertEq(
            rewardsForClaimingLater,
            rewardsTokenCount,
            "1: Wrong stored rewards"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "6: Wrong Pool Value"
        );
        assertEq(
            buffCat.claimableTokens(address(token2)),
            user1PoolValue,
            "6: Wrong Pool Value (Token Count)"
        );

        nonStableDailyClaimLimit = ((nonStableRewardPoolUsdValue * 10) / 100);

        uint256 storedRewardsInUsd = (rewardsTokenCount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        uint256 claimableAmount = storedRewardsInUsd > nonStableDailyClaimLimit
            ? nonStableDailyClaimLimit
            : storedRewardsInUsd;
        uint256 claimableAmountInTokenCount = (claimableAmount *
            10 ** (token2FeedDecimals + token2Decimals)) / token2Price;
        claimableAmountInTokenCount = claimableAmountInTokenCount >
            user1PoolValue
            ? user1PoolValue
            : claimableAmountInTokenCount;
        uint256 diff = rewardsTokenCount > claimableAmountInTokenCount
            ? rewardsTokenCount - claimableAmountInTokenCount
            : 0;
        uint256 fee2 = calculateFee(claimableAmountInTokenCount);
        uint256 newClaimableAmountInTokenCount = claimableAmountInTokenCount -
            fee2;
        uint256 valueAddedBackToPool2 = (fee2 * 80) / 100;

        user1PoolValue -= claimableAmountInTokenCount;
        user1PoolValue += valueAddedBackToPool2;
        nonStableRewardPool = claimableAmountInTokenCount > nonStableRewardPool
            ? 0
            : nonStableRewardPool - claimableAmountInTokenCount;
        nonStableRewardPool += valueAddedBackToPool2;
        nonStableDailyClaimLimit -=
            (claimableAmountInTokenCount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        nonStableRewardPoolUsdValue -=
            (claimableAmountInTokenCount * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));
        nonStableRewardPoolUsdValue +=
            (valueAddedBackToPool2 * token2Price) /
            (10 ** (token2Decimals + token2FeedDecimals));

        vm.warp(block.timestamp + 1.3 days);
        buffCat.claimStoredRewards(tokens, 0);

        uint256 currentBalance = token2.balanceOf(user2);
        assertEq(
            currentBalance,
            INITIAL_BALANCE + addedToken2 + newClaimableAmountInTokenCount,
            "3: Wrong Rewards Calculation"
        );

        assertEq(
            buffCat.dailyNonStablePoolClaimLimit(),
            nonStableDailyClaimLimit,
            "2: Wrong Daily Non Stable Claim Limit"
        );
        assertEq(
            buffCat.storedTokensForLaterClaim(user2, 0, address(token2)),
            diff,
            "2: Wrong stored rewards"
        );
        assertEq(
            buffCat.nonStableRewardPool(),
            nonStableRewardPool,
            "7: Wrong Pool Value (Token Count)"
        );
        assertEq(
            buffCat.nonStableRewardPoolUSDValue(),
            nonStableRewardPoolUsdValue,
            "7: Wrong Pool Value"
        );
        assertEq(
            buffCat.claimableTokens(address(token2)),
            user1PoolValue,
            "7: Wrong Pool Value (Token Count)"
        );

        vm.stopPrank();
    }
}
