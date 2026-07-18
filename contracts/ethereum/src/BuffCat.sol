// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

// Chainlink Importss
import {FeedRegistryInterface} from '../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol';
import {Denominations} from '../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol';

// OpenZeppelin (Standard) Imports
import '../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol';
import '../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol';
import '../lib/openzeppelin-contracts/contracts/access/Ownable.sol';
import '../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol';

// OpenZeppelin (Upgradeable) Imports
import '../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol';
import '../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol';
import '../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol';
import '../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol';

// Uniswap Imports
import 'v3-core/libraries/FullMath.sol';
import 'v3-core/libraries/TickMath.sol';
import '../lib/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '../lib/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {FixedPoint96} from '../lib/v3-core/contracts/libraries/FixedPoint96.sol';

enum LockType {
  FLEXIBLE,
  FIXED
}

struct LockInfo {
  uint256 amount;
  uint256 lockStart;
  uint256 lockEnd;
  uint256 lastClaim;
  uint256 withdrawn;
  uint256 _days;
  uint256 daysOfUnclaimedRewards;
  address lockedToken;
  LockType lockType;
}

struct FeeDistribution {
  uint256 rewardPool;
  uint256 marketing;
  uint256 development;
  uint256 developerWallet;
}

struct TokenPool {
  address pool;
  address pairedToken;
}

contract BuffCatUpgradeable is
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable,
  PausableUpgradeable,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  FeedRegistryInterface internal registry; // Chainlink Feedv Registry on mainet
  IUniswapV3Factory public factory; // Uniswap V3 factory on mainnet
  uint32 public TWAP_PERIOD = 300; // 5 minutes
  mapping(address => TokenPool) tokenPools;
  address public developerWallet;
  address public founderWallet;

  // User Variables
  mapping(address => uint256) public lockCount;
  mapping(address => bool) public participate;
  uint256 public userCount;
  mapping(address => uint256) public referralBoostEndTime;
  mapping(address => mapping(address => uint256)) public userUniqueTokensLocked;
  mapping(address => uint256) public userUniqueTokensCount;
  mapping(address => mapping(uint256 => LockInfo)) public userLocks;

  // Global Contract Variables
  uint256 public dailyNonStablePoolClaimLimit;
  uint256 public dailyStablePoolClaimLimit;

  uint256 public nonStableRewardPoolUSDValue;
  uint256 public stableRewardPoolUSDValue;

  uint256 public MIN_LOCK_VALUE = 500;
  uint256 public MAX_LOCK_DURATION = 3000 days;
  uint256 public MIN_LOCK_DURATION = 1 days;
  uint256 public MAX_NON_STABLE_REWARD_CAP = 10; // 10% daily rewards cap
  uint256 public MAX_STABLE_REWARD_CAP = 3;
  uint256 public MINIMUM_REWARD_USD = 1; // $0.000001
  uint256 public duration = 1 days;
  uint256 public feePercentage;
  FeeDistribution public feeSplit;
  uint256 public USD_SCALER = 1e6;

  uint256 public lastClaimLimitUpdateTimestamp;
  mapping(address => bool) public whitelistedTokens; // Tokens that are whitelisted for locking
  mapping(address => bool) public isStableCoin;
  mapping(address => uint256) public claimableTokens;
  address[] public poolTokens; // List of all tokens in the pool
  mapping(address => uint256) public lastPoolUpdateForToken;
  mapping(address => bool) public authorizedUpdaters;
  mapping(address => uint8) public feedDecimalsCache;
  mapping(address => uint8) public tokenDecimalsCache;

  // Events for contract state changes
  event DailyClaimLimitReset(
    uint256 dailyNonStablePoolClaimLimit,
    uint256 dailyStablePoolClaimLimit,
    uint256 timestamp
  );
  event ReferralSet(address indexed user, address indexed referrer, uint256 timestamp);
  event DeveloperFeesDistributed(address developerWallet, uint256 fees);
  event FounderFeesDistributed(address ownerWallet, uint256 fees);
  event TokensAddedToPool(address token, uint256 amount);
  event NonStablePoolValueUpdated(uint256 newTotalValue, uint256 timestamp);
  event StablePoolValueUpdated(uint256 newTotalValue, uint256 timestamp);
  event StableCoinAdded(address token, uint256 timestamp);
  event StableCoinRemoved(address token, uint256 timestamp);
  event TokenWhitelisted(address token, uint256 timestamp);
  event TokenBlacklisted(address token, uint256 timestamp);
  event TokenAndPoolAdded(address token, address pool, address pairToken, uint256 timestamp);
  event TokenAndPoolRemoved(address token, address pool, address pairToken, uint256 timestamp);

  // Events for user actions
  event LockCreated(
    address indexed user,
    address lockedToken,
    uint256 indexed lockId,
    uint256 amount,
    uint256 lockDuration,
    LockType lockType,
    uint256 daysOfUnclaimedRewards
  );
  event AssetUnlocked(address indexed user, uint256 lockId, address indexed token, uint256 amount);
  event RewardsClaimed(
    address indexed user,
    address indexed token,
    uint256 indexed lockId,
    uint256 amount,
    uint256 daysOfUnclaimedRewards
  );

  // Custom Errors
  error NotAuthorized();
  error InvalidUserLockId();
  error InsufficientLockAmount();
  error InvalidERC20Token();
  error InvalidTokenPrice();
  error InvalidLockDuration();
  error InsufficientAllowance();
  error InsufficientBalance();
  error InvalidUnlockAmount();
  error LockNotExpired();
  error InvalidToken();
  error LockAlreadyEmpty();
  error DailyClaimLimitExceeded();
  error RewardsForTokenDepleted();
  error ClaimTooSoon();
  error NoRewardsToClaim();
  error InvalidAddress();
  error InvalidInput();

  modifier onlyAuthorized() {
    if (!(msg.sender == owner() || authorizedUpdaters[msg.sender])) revert NotAuthorized();
    _;
  }

  modifier onlyFounderWallet() {
    if (msg.sender != founderWallet) revert NotAuthorized();
    _;
  }

  constructor() {
    _disableInitializers();
  }

  /*
   * @title Initialize Contract
   * @notice Initializes the contract with initial values and settings
   * @dev Only callable once during contract deployment
   * @param _developerWallet Address of the developer wallet
   * @param _registry Address of the chainlink feed registry
   */
  function initialize(
    address _developerWallet,
    address _founderWallet,
    address _registry,
    address _factory
  ) public initializer {
    // Initialize OpenZeppelin contracts
    __Ownable_init(msg.sender);
    __Pausable_init();

    // Initialize core addresses
    developerWallet = _developerWallet;
    founderWallet = _founderWallet;

    registry = FeedRegistryInterface(_registry);
    factory = IUniswapV3Factory(_factory);
    TWAP_PERIOD = 300; // 5 minutes

    //Limits, Caps, helper values etc
    MAX_LOCK_DURATION = 3000 days;
    MIN_LOCK_DURATION = 1 days;
    MAX_NON_STABLE_REWARD_CAP = 10;
    MAX_STABLE_REWARD_CAP = 3;
    MINIMUM_REWARD_USD = 1;
    duration = 1 days;
    MIN_LOCK_VALUE = 500;
    USD_SCALER = 1e6;

    // Initialize timestamps
    lastClaimLimitUpdateTimestamp = block.timestamp;

    // Initialize fee structure
    feeSplit.rewardPool = 80;
    feeSplit.marketing = 5;
    feeSplit.development = 5;
    feeSplit.developerWallet = 10;
    feePercentage = 5;

    // Initialize authorized updaters with owner
    authorizedUpdaters[msg.sender] = true;
  }

  /*
   * @title Authorize Upgrade
   * @notice Internal function to authorize contract upgrades
   * @dev Only callable during upgrade process
   * @param _newImplementation Address of the new implementation
   */
  function _authorizeUpgrade(address _newImplementation) internal override onlyOwner {
    // Additional validation logic could go here if needed
  }

  // Reward Pool Functions
  /*
   * @title Set Authorized Updater
   * @notice Sets an address as authorized to update pool values and state that helps in user activity and not user state directly
   * @dev Only callable by the contract owner
   * @param _updater Address of the updater
   * @param _authorized Boolean indicating whether the address is authorized
   */
  function setAuthorizedUpdater(address _updater, bool _authorized) external onlyOwner {
    authorizedUpdaters[_updater] = _authorized;
  }

  /*
   * @title Add Non-Stable Token to Pool
   * @notice Adds non-stable tokens to the reward pool and update it's value
   * @dev Internal function for managing pool tokens and pool value
   * @param _token Address of the token to add
   * @param _amount Amount of tokens to add
   */
  function addNonStableTokenToPool(address _token, uint256 _amount) internal {
    if (_amount == 0) return;

    // Add new token to tracking if needed
    if (claimableTokens[_token] == 0) {
      poolTokens.push(_token);
    }

    claimableTokens[_token] += _amount;
    _amount = claimableTokens[_token];

    // Incrementally update the total pool value
    (uint256 rawPrice, uint8 feedDecimals, uint8 tokenDecimals) = getPrice(_token);

    uint256 addedValueUSD = (_amount * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    nonStableRewardPoolUSDValue = lastPoolUpdateForToken[_token] >= nonStableRewardPoolUSDValue
      ? 0
      : nonStableRewardPoolUSDValue - lastPoolUpdateForToken[_token];
    nonStableRewardPoolUSDValue += addedValueUSD;
    lastPoolUpdateForToken[_token] = addedValueUSD;
    emit NonStablePoolValueUpdated(nonStableRewardPoolUSDValue, block.timestamp);
  }

  /*
   * @title Add Stable Token to Pool
   * @notice Adds stable tokens to the reward pool and update it's value
   * @dev Internal function for managing pool tokens and pool value
   * @param _token Address of the token to add
   * @param _amount Amount of tokens to add
   */
  function addStableTokenToPool(address _token, uint256 _amount) internal {
    if (_amount == 0) return;

    // Add new token to tracking if needed
    if (claimableTokens[_token] == 0) {
      poolTokens.push(_token);
    }

    claimableTokens[_token] += _amount;
    _amount = claimableTokens[_token];

    // Incrementally update the total pool value
    (uint256 rawPrice, uint8 feedDecimals, uint8 tokenDecimals) = getPrice(_token);
    uint256 addedValueUSD = (_amount * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    stableRewardPoolUSDValue = lastPoolUpdateForToken[_token] >= stableRewardPoolUSDValue
      ? 0
      : stableRewardPoolUSDValue - lastPoolUpdateForToken[_token];
    stableRewardPoolUSDValue += addedValueUSD;
    lastPoolUpdateForToken[_token] = addedValueUSD;
    emit StablePoolValueUpdated(stableRewardPoolUSDValue, block.timestamp);
  }

  /*
   * @title Remove Non-Stable Token from Pool
   * @notice Removes non-stable tokens from the reward pool and update it's value
   * @dev Internal function for managing pool tokens and pool value
   * @param _token Address of the token to remove
   * @param _amount Amount of tokens to remove
   */
  function removeNonStableTokenFromPool(address _token, uint256 _amount) internal {
    (uint256 rawPrice, uint8 feedDecimals, uint8 tokenDecimals) = getPrice(_token);

    uint256 lastPoolUpdate = lastPoolUpdateForToken[_token];
    nonStableRewardPoolUSDValue = lastPoolUpdate >= nonStableRewardPoolUSDValue
      ? 0
      : nonStableRewardPoolUSDValue - lastPoolUpdate;
    nonStableRewardPoolUSDValue +=
      (claimableTokens[_token] * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    claimableTokens[_token] = _amount >= claimableTokens[_token]
      ? 0
      : claimableTokens[_token] - _amount;

    // Incrementally update the total pool value
    uint256 removedValueUSD = (_amount * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    nonStableRewardPoolUSDValue = removedValueUSD >= nonStableRewardPoolUSDValue
      ? 0
      : nonStableRewardPoolUSDValue - removedValueUSD;

    lastPoolUpdateForToken[_token] =
      (claimableTokens[_token] * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));
    emit NonStablePoolValueUpdated(nonStableRewardPoolUSDValue, block.timestamp);
  }

  /*
   * @title Remove Stable Token from Pool
   * @notice Removes stable tokens from the reward pool and update it's value
   * @dev Internal function for managing pool tokens and pool value
   * @param _token Address of the token to remove
   * @param _amount Amount of tokens to remove
   */
  function removeStableTokenFromPool(address _token, uint256 _amount) internal {
    (uint256 rawPrice, uint8 feedDecimals, uint8 tokenDecimals) = getPrice(_token);

    uint256 lastPoolUpdate = lastPoolUpdateForToken[_token];
    stableRewardPoolUSDValue = lastPoolUpdate >= stableRewardPoolUSDValue
      ? 0
      : stableRewardPoolUSDValue - lastPoolUpdate;
    stableRewardPoolUSDValue +=
      (claimableTokens[_token] * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    claimableTokens[_token] = _amount >= claimableTokens[_token]
      ? 0
      : claimableTokens[_token] - _amount;

    // Incrementally update the total pool value
    uint256 removedValueUSD = (_amount * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));

    stableRewardPoolUSDValue = removedValueUSD >= stableRewardPoolUSDValue
      ? 0
      : stableRewardPoolUSDValue - removedValueUSD;

    lastPoolUpdateForToken[_token] =
      (claimableTokens[_token] * rawPrice * USD_SCALER) /
      (10 ** (feedDecimals + tokenDecimals));
    emit StablePoolValueUpdated(stableRewardPoolUSDValue, block.timestamp);
  }

  /*
   * @title Update Pool Value
   * @notice Updates the value of both stable and non-stable pools
   * @dev Only callable by authorized updaters
   * @param _newNonStablePoolValueUSD New value for non-stable pool
   * @param _newStablePoolValueUSD New value for stable pool
   */
  function updatePoolValue(
    uint256 _newNonStablePoolValueUSD,
    uint256 _newStablePoolValueUSD
  ) external onlyAuthorized {
    nonStableRewardPoolUSDValue = _newNonStablePoolValueUSD;
    stableRewardPoolUSDValue = _newStablePoolValueUSD;

    emit NonStablePoolValueUpdated(nonStableRewardPoolUSDValue, block.timestamp);
    emit StablePoolValueUpdated(stableRewardPoolUSDValue, block.timestamp);
  }

  /*
   * @title Update Daily Claim Limit
   * @notice Updates the daily claim limits for both pools
   * @dev Internal function for managing claim limits
   */
  function updateDailyClaimLimit() internal {
    dailyNonStablePoolClaimLimit = (nonStableRewardPoolUSDValue * MAX_NON_STABLE_REWARD_CAP) / 100;
    dailyStablePoolClaimLimit = (stableRewardPoolUSDValue * MAX_STABLE_REWARD_CAP) / 100000;

    emit DailyClaimLimitReset(
      dailyNonStablePoolClaimLimit,
      dailyStablePoolClaimLimit,
      block.timestamp
    );
  }

  // User Functions

  /*
   * @title Lock Assets
   * @notice Locks assets in the contract for rewards
   * @dev Only callable by users
   * @param _token Address of the token to lock
   * @param _amount Amount of tokens to lock
   * @param _lockDuration Duration of the lock in days
   * @param _lockType Type of lock (FLEXIBLE or FIXED)
   * @param _referrer Address of the referrer
   */
  function lockAssets(
    address _token,
    uint256 _amount,
    uint256 _lockDuration,
    LockType _lockType,
    address _referrer
  ) external nonReentrant whenNotPaused {
    if (_token == address(0)) revert InvalidAddress();
    if (_amount < MIN_LOCK_VALUE) revert InsufficientLockAmount();
    if (!whitelistedTokens[_token]) revert InvalidToken();
    (uint256 priceAtLock, , ) = getPrice(_token);
    if (priceAtLock == 0) revert InvalidTokenPrice();
    uint256 _duration = _lockDuration * duration;
    if (!(_duration >= MIN_LOCK_DURATION && _duration <= MAX_LOCK_DURATION))
      revert InvalidLockDuration();
    uint256 allowance = IERC20(_token).allowance(msg.sender, address(this));
    if (allowance < _amount) revert InsufficientAllowance();
    if (IERC20(_token).balanceOf(msg.sender) < _amount) revert InsufficientBalance();

    if (_referrer != address(0) && _referrer != msg.sender && participate[_referrer]) {
      // For msg.sender
      if (referralBoostEndTime[msg.sender] == 0) {
        referralBoostEndTime[msg.sender] = block.timestamp + 1 days;
      }
      //For _referrer
      if (referralBoostEndTime[_referrer] == 0) {
        referralBoostEndTime[_referrer] = block.timestamp + 1 days;
      } else {
        uint256 currentEnd = referralBoostEndTime[_referrer];
        if (currentEnd < block.timestamp + 30 days) {
          uint256 newEnd = currentEnd + 1 days;
          if (newEnd > block.timestamp + 30 days) {
            newEnd = block.timestamp + 30 days;
          }
          referralBoostEndTime[_referrer] = newEnd;
        }
      }
      emit ReferralSet(msg.sender, _referrer, block.timestamp);
    }

    IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

    if (!participate[msg.sender]) {
      participate[msg.sender] = true;
    }

    uint256 fee = calculateFee(_amount);
    uint256 lockAmount = _amount - fee;
    bool stableCoin = isStableCoin[_token];
    distributeFee(_token, fee, stableCoin);

    if (userUniqueTokensLocked[msg.sender][_token] == 0) {
      userUniqueTokensCount[msg.sender] += 1;
    }
    userUniqueTokensLocked[msg.sender][_token] += lockAmount;

    // Create a new lock
    if (lockCount[msg.sender] == 0) userCount++;
    uint256 lockId = lockCount[msg.sender]++;
    LockInfo storage lock = userLocks[msg.sender][lockId];
    lock.amount = lockAmount;
    lock.lockStart = block.timestamp;
    lock.lockEnd = block.timestamp + _duration;
    lock.lastClaim = 0;
    lock.lockType = _lockType;
    lock.lockedToken = _token;
    lock._days = _duration;
    lock.daysOfUnclaimedRewards = 0;

    emit LockCreated(
      msg.sender,
      _token,
      lockId,
      lockAmount,
      _duration,
      _lockType,
      lock.daysOfUnclaimedRewards
    );
  }

  /*
   * @title Unlock Assets
   * @notice Unlocks assets from the contract
   * @dev Only callable by the lock owners
   * @param _lockId ID of the lock
   * @param _amount Amount of tokens to unlock
   */
  function unlockAssets(uint256 _lockId, uint256 _amount) external nonReentrant whenNotPaused {
    LockInfo storage lock = userLocks[msg.sender][_lockId];
    uint256 remaining = lock.amount - lock.withdrawn;
    if (!(_amount <= remaining)) revert InvalidUnlockAmount();
    if (remaining >= MIN_LOCK_VALUE && _amount < MIN_LOCK_VALUE) revert InvalidUnlockAmount();
    if (lock.amount == 0) revert InvalidUserLockId();
    if (lock.lockType == LockType.FIXED) {
      if (block.timestamp < lock.lockEnd) revert LockNotExpired();
    }
    if ((lock.amount - lock.withdrawn) == 0) revert LockAlreadyEmpty();

    address token = lock.lockedToken;
    bool stable = isStableCoin[token];

    lock.withdrawn += _amount;
    uint256 unlockAmount = _amount;

    if (remaining >= MIN_LOCK_VALUE) {
      uint256 fee = calculateFee(_amount);
      unlockAmount = _amount - fee;
      distributeFee(token, fee, stable);
    }

    userUniqueTokensLocked[msg.sender][lock.lockedToken] = _amount >=
      userUniqueTokensLocked[msg.sender][lock.lockedToken]
      ? 0
      : userUniqueTokensLocked[msg.sender][lock.lockedToken] - _amount;
    if (userUniqueTokensLocked[msg.sender][lock.lockedToken] == 0) {
      userUniqueTokensCount[msg.sender] = 1 >= userUniqueTokensCount[msg.sender]
        ? 0
        : userUniqueTokensCount[msg.sender] - 1;
    }

    emit AssetUnlocked(msg.sender, _lockId, token, _amount);

    IERC20(token).safeTransfer(msg.sender, unlockAmount);
  }

  /*
   * @title Claim Rewards
   * @notice Claims rewards for a specific lock
   * @dev Only callable by the lock owner
   * @param _tokens Array of token addresses to claim rewards for
   * @param _lockId ID of the lock
   * @param daysOfUnclaimed Days of unclaimed rewards user wants to claim
   */
  function claimRewards(
    address[] calldata _tokens,
    uint256 _lockId,
    uint256 daysOfUnclaimed
  ) external nonReentrant whenNotPaused {
    LockInfo storage lock = userLocks[msg.sender][_lockId];
    if (lock.amount == 0) revert InvalidUserLockId();
    if (_tokens.length == 0) revert InvalidAddress();

    uint256 lastClaimTime = lock.lastClaim > 0 ? lock.lastClaim : lock.lockStart;
    if (block.timestamp - lastClaimTime < 1 days) revert ClaimTooSoon();

    if (block.timestamp >= lastClaimLimitUpdateTimestamp + 1 days) {
      updateDailyClaimLimit();
    }
    lastClaimLimitUpdateTimestamp = block.timestamp;

    (uint256 lockedTokenPrice, uint8 lockTokenFeedDecimals, uint8 lockTokenDecimals) = getPrice(
      lock.lockedToken
    );

    bool isLockTokenStable = isStableCoin[lock.lockedToken];

    // Calculate user rewards
    if (isLockTokenStable) {
      if (dailyStablePoolClaimLimit == 0) revert DailyClaimLimitExceeded();
    } else {
      if (dailyNonStablePoolClaimLimit == 0) revert DailyClaimLimitExceeded();
    }

    lock.lastClaim = block.timestamp;

    uint256 rewards = calculateUserRewards(
      msg.sender,
      _lockId,
      lockedTokenPrice,
      isLockTokenStable,
      lockTokenFeedDecimals,
      lockTokenDecimals
    );
    if (rewards == 0) revert NoRewardsToClaim(); // should i revert or not revert
    // maybe revert if lock is empty inside calculateUserRewards

    // Calculate valid days of unclaimed rewards
    uint256 newDaysOfUnclaimedRewards = (block.timestamp - lastClaimTime) / 1 days;
    newDaysOfUnclaimedRewards = newDaysOfUnclaimedRewards > 1 ? newDaysOfUnclaimedRewards : 0;
    newDaysOfUnclaimedRewards += lock.daysOfUnclaimedRewards;
    if (daysOfUnclaimed == 0) {
      lock.daysOfUnclaimedRewards = newDaysOfUnclaimedRewards;
      daysOfUnclaimed = 1;
    } else {
      if (daysOfUnclaimed < newDaysOfUnclaimedRewards) {
        newDaysOfUnclaimedRewards -= daysOfUnclaimed;
        lock.daysOfUnclaimedRewards = newDaysOfUnclaimedRewards;
      } else if (daysOfUnclaimed == newDaysOfUnclaimedRewards) {
        lock.daysOfUnclaimedRewards = 0;
      } else {
        daysOfUnclaimed = newDaysOfUnclaimedRewards;
        lock.daysOfUnclaimedRewards = 0;
      }
    }

    // Calculate total rewards
    rewards = rewards * daysOfUnclaimed;

    if (isLockTokenStable) {
      // Ensure rewards don't exceed daily stable pool claim limit
      rewards = rewards > dailyStablePoolClaimLimit ? dailyStablePoolClaimLimit : rewards;
    } else {
      // Ensure rewards don't exceed daily non stable pool claim limit
      rewards = rewards > dailyNonStablePoolClaimLimit ? dailyNonStablePoolClaimLimit : rewards;
    }

    // Calculate rewards per token
    uint256 rewardsPerToken = rewards / _tokens.length;
    if (rewardsPerToken == 0) revert NoRewardsToClaim(); // change revert name to rewards became too thin

    for (uint256 i = 0; i < _tokens.length; i++) {
      address token = _tokens[i];
      if (token == address(0)) revert InvalidAddress();
      if (claimableTokens[token] == 0) revert RewardsForTokenDepleted();

      (uint256 claimTokenPrice, uint8 claimTokenFeedDecimals, uint8 claimTokenDecimals) = getPrice(
        token
      );
      bool isClaimTokenStable = isStableCoin[token];

      // Convert usd rewards to token amounts
      uint256 tokenRewards = (rewardsPerToken *
        10 ** (claimTokenFeedDecimals + claimTokenDecimals)) / (claimTokenPrice * (10 ** 6));

      // Check if pool has enough token rewards
      tokenRewards = tokenRewards > claimableTokens[token] ? claimableTokens[token] : tokenRewards;
      if (tokenRewards == 0) continue; // Skip if no rewards for this token

      // Deduct fees
      uint256 fee = calculateFee(tokenRewards);
      distributeFee(token, fee, isClaimTokenStable);
      uint256 newTokenRewards = tokenRewards - fee;

      // Update pool state
      if (isClaimTokenStable) {
        dailyStablePoolClaimLimit = rewardsPerToken >= dailyStablePoolClaimLimit
          ? 0
          : dailyStablePoolClaimLimit - rewardsPerToken;
        removeStableTokenFromPool(token, newTokenRewards);
      } else {
        dailyNonStablePoolClaimLimit = rewardsPerToken >= dailyNonStablePoolClaimLimit
          ? 0
          : dailyNonStablePoolClaimLimit - rewardsPerToken;
        removeNonStableTokenFromPool(token, newTokenRewards);
      }

      emit RewardsClaimed(msg.sender, token, _lockId, newTokenRewards, daysOfUnclaimed);

      // Transfer rewards to the user
      IERC20(token).safeTransfer(msg.sender, newTokenRewards);
    }
  }

  /*
   * @title Calculate Fee
   * @notice Calculates the fee for a given amount
   * @dev Internal function for fee calculations
   * @param _amount Amount to calculate fee for
   * @return Calculated fee amount
   */
  function calculateFee(uint256 _amount) internal view returns (uint256) {
    return (_amount * feePercentage) / 100;
  }

  /*
   * @title Check Boost Eligibility
   * @notice Checks if a user is eligible for boost rewards
   * @dev Internal function for checking boost eligibility
   * @param _user Address of the user
   * @param _lockId ID of the lock
   * @return Boolean indicating boost eligibility
   */
  function isEligibleForBoost(address _user, uint256 _lockId) internal view returns (bool) {
    LockInfo storage lock = userLocks[_user][_lockId];
    uint256 halfDuration = lock.lockStart + (lock._days / 2);
    bool eligible = block.timestamp >= halfDuration;
    return eligible;
  }

  /*
   * @title Calculate Duration Multiplier
   * @notice Calculates the multiplier based on lock duration
   * @dev Internal function for multiplier calculations
   * @param _duration Duration of the lock
   * @return Calculated multiplier
   */
  function calculateDurationMultiplier(uint256 _duration) internal pure returns (uint256) {
    uint256 multiplier = 0;

    if (_duration >= 30 days) multiplier = 30; // 0.3% boost
    if (_duration >= 60 days) multiplier = 80; // 0.5% boost
    if (_duration >= 120 days) multiplier = 150; // 0.7% boost

    return multiplier;
  }

  /*
   * @title Calculate Referral Boost
   * @notice Gives back the referral boost multiplier for the user address
   * @dev Only callable by the contract functions
   * @param _user Address of the user
   * @param _lockId ID of the lock
   */
  function calculateReferralBoost(address _user) internal view returns (uint256) {
    if (referralBoostEndTime[_user] >= block.timestamp) {
      return 50; // 0.5% boost
    }
    return 0;
  }

  /*
   * @title Calculate Diversification Bonus
   * @notice Calculates boost multiplier based on the unique number of tokens user has locked
   * @dev Only callable by the contract functions
   * @param _user Address of the user
   */
  function calculateDiversificationBonus(address _user) internal view returns (uint256) {
    uint256 multiplier = 0;
    uint256 validTokens = 0;

    validTokens = userUniqueTokensCount[_user];

    if (validTokens >= 2) multiplier = 30; // 0.3% boost
    if (validTokens >= 3) multiplier = 80; // 0.5% boost
    if (validTokens >= 6) multiplier = 150; // 0.7% boost

    return multiplier;
  }

  /*
   * @title Calculate Total Boost Multiplier
   * @notice Calculates user's all boost multipliers combined
   * @dev Only callable by the contract functions
   * @param _user Address of the user
   * @param _lockId ID of the lock
   */
  function calculateTotalMultiplier(
    address _user,
    uint256 _lockId
  ) internal view returns (uint256) {
    uint256 multiplier = 100;
    LockInfo storage lock = userLocks[_user][_lockId];
    uint256 effectiveAmount = lock.amount - lock.withdrawn;
    uint256 acceptableAmount = (lock.amount * 97) / 100;
    if (
      isEligibleForBoost(_user, _lockId) && (effectiveAmount >= (lock.amount - acceptableAmount))
    ) {
      multiplier += calculateDurationMultiplier(lock._days);
      if (userUniqueTokensCount[_user] >= 2) {
        multiplier += calculateDiversificationBonus(_user);
      }
      multiplier += calculateReferralBoost(_user);
    }
    uint256 finalMultiplier = multiplier > 350 ? 350 : multiplier;
    return finalMultiplier;
  }

  /*
   * @title Calculate User Rewards
   * @notice Calculates rewards for a specific user and lock
   * @dev Internal function for reward calculations
   * @param _user Address of the user
   * @param _lockId ID of the lock
   * @param _currentPrice Current price of the token
   * @param _stable Boolean indicating if token is stable
   * @param _tokenFeedDecimals Decimals in the token's USD Feed
   * @param _tokenDecimals Decimals in the token's contract
   * @return Calculated rewards
   */
  function calculateUserRewards(
    address _user,
    uint256 _lockId,
    uint256 _currentPrice,
    bool _stable,
    uint8 _tokenFeedDecimals,
    uint8 _tokenDecimals
  ) internal view returns (uint256) {
    LockInfo storage lock = userLocks[_user][_lockId];

    // Calculate available rewards based on lock amount and multipliers
    uint256 availableRewards = 0;
    uint256 effectiveAmount = lock.amount - lock.withdrawn;
    uint256 effectiveAmountInUsd = (effectiveAmount * _currentPrice * USD_SCALER) /
      (10 ** (_tokenFeedDecimals + _tokenDecimals));

    // Apply different calculation for stablecoins vs non-stablecoins
    if (_stable) {
      // calculate rewards
      uint256 safeStableRewardPoolUSDValue = stableRewardPoolUSDValue > 0
        ? stableRewardPoolUSDValue
        : 1;
      uint256 userTotalRewards = (effectiveAmountInUsd * dailyStablePoolClaimLimit) /
        safeStableRewardPoolUSDValue;
      // is it 10% of daily rewards or 0.003%?
      uint256 userDailyRewards = (userTotalRewards * 3) / 100000;
      uint256 validRewards = userDailyRewards > MINIMUM_REWARD_USD
        ? userDailyRewards
        : MINIMUM_REWARD_USD;
      availableRewards = validRewards;
    } else {
      uint256 multiplier = calculateTotalMultiplier(_user, _lockId);
      // calculate rewards
      uint256 userWeighted = (effectiveAmountInUsd * multiplier) / 100;
      uint256 safenonStableRewardPoolUSDValue = nonStableRewardPoolUSDValue > 0
        ? nonStableRewardPoolUSDValue
        : 1;
      uint256 userTotalRewards = (userWeighted * dailyNonStablePoolClaimLimit) /
        safenonStableRewardPoolUSDValue;
      uint256 userDailyRewards = (userTotalRewards * 10) / 100;
      uint256 validRewards = userDailyRewards > MINIMUM_REWARD_USD
        ? userDailyRewards
        : MINIMUM_REWARD_USD;
      availableRewards = validRewards;
    }
    // still check if anything is left/written wrong in this function
    return availableRewards;
  }

  /*
   * @title Distribute Fees
   * @notice Distributes fees to different pools and wallets
   * @dev Internal function for fee distribution
   * @param _token Address of the token
   * @param _fee Amount of fees to distribute
   * @param _stable Boolean indicating if token is stable
   */
  function distributeFee(address _token, uint256 _fee, bool _stable) internal {
    uint256 rewardFeeSplit = (_fee * feeSplit.rewardPool) / 100;
    uint256 marketingFeeSplit = (_fee * feeSplit.marketing) / 100;
    uint256 devFeeSplit = (_fee * feeSplit.development) / 100;
    uint256 devWalletFeeSplit = (_fee * feeSplit.developerWallet) / 100;

    if (_stable) addStableTokenToPool(_token, rewardFeeSplit);
    else addNonStableTokenToPool(_token, rewardFeeSplit);

    IERC20(_token).safeTransfer(founderWallet, marketingFeeSplit + devFeeSplit);
    IERC20(_token).safeTransfer(developerWallet, devWalletFeeSplit);

    emit DeveloperFeesDistributed(developerWallet, devWalletFeeSplit);
    emit FounderFeesDistributed(founderWallet, marketingFeeSplit + devFeeSplit);
    emit TokensAddedToPool(_token, rewardFeeSplit);
  }

  // Utility Functions

  /*
   * @title Get Price
   * @notice Gets the current price of a token
   * @dev Internal function for price queries
   * @param _token Address of the token
   * @return Current price of the token
   */
  function getPrice(address token) internal returns (uint256, uint8, uint8) {
    (, int256 price, , , ) = registry.latestRoundData(token, Denominations.USD);

    // Use cached decimals if available, otherwise fetch and cache them
    uint8 feedDecimals = feedDecimalsCache[token];
    uint8 tokenDecimals = tokenDecimalsCache[token];

    if (feedDecimals == 0) {
      feedDecimals = registry.decimals(token, Denominations.USD);
      feedDecimalsCache[token] = feedDecimals;
    }

    if (tokenDecimals == 0) {
      tokenDecimals = IERC20Metadata(token).decimals();
      tokenDecimalsCache[token] = tokenDecimals;
    }

    if (price <= 0) {
      return getTwapPrice(token);
    } else {
      // Calculate price per wei with 18 decimals of precision
      return (uint256(price), feedDecimals, tokenDecimals);
    }
  }

  function getTwapPrice(address token) internal returns (uint256, uint8, uint8) {
    TokenPool storage tokenPool = tokenPools[token];
    address pool = tokenPool.pool;
    address pairToken = tokenPool.pairedToken;

    uint160 sqrtPriceX96 = getSqrtTwapX96(pool);

    uint256 quoteAmount = getPriceX96FromSqrtPriceX96(sqrtPriceX96);
    quoteAmount = FullMath.mulDiv(quoteAmount, 1e18, FixedPoint96.Q96);

    uint8 pairTokenFeedDecimals = feedDecimalsCache[pairToken];
    uint8 pairTokenDecimals = tokenDecimalsCache[pairToken];

    if (pairTokenFeedDecimals == 0) {
      pairTokenFeedDecimals = registry.decimals(pairToken, Denominations.USD);
      feedDecimalsCache[pairToken] = pairTokenFeedDecimals;
    }

    if (pairTokenDecimals == 0) {
      pairTokenDecimals = IERC20Metadata(pairToken).decimals();
      tokenDecimalsCache[pairToken] = pairTokenDecimals;
    }

    (, int256 pairTokenPrice, , , ) = registry.latestRoundData(pairToken, Denominations.USD);

    uint256 tokenPrice = (quoteAmount * uint256(pairTokenPrice) * 1e8) /
      (10 ** (pairTokenFeedDecimals + pairTokenDecimals));

    uint8 tokenDecimals = tokenDecimalsCache[token];
    if (tokenDecimals == 0) {
      tokenDecimals = IERC20Metadata(token).decimals();
      tokenDecimalsCache[token] = tokenDecimals;
    }

    if (tokenPrice <= 0) {
      revert InvalidTokenPrice();
    } else {
      return (tokenPrice, uint8(8), tokenDecimals);
    }
  }

  function getSqrtTwapX96(address uniswapV3Pool) internal view returns (uint160 sqrtPriceX96) {
    uint32[] memory secondsAgos = new uint32[](2);
    secondsAgos[0] = TWAP_PERIOD; // from (before)
    secondsAgos[1] = 0; // to (now)

    (int56[] memory tickCumulatives, ) = IUniswapV3Pool(uniswapV3Pool).observe(secondsAgos);

    // tick to price
    sqrtPriceX96 = TickMath.getSqrtRatioAtTick(
      int24((tickCumulatives[1] - tickCumulatives[0]) / int56(uint56(TWAP_PERIOD)))
    );
  }

  function getPriceX96FromSqrtPriceX96(
    uint160 sqrtPriceX96
  ) internal pure returns (uint256 priceX96) {
    return FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96);
  }

  /*
   * @title Whitelist Stable Coin
   * @notice Whitelists a coin as a stable coin in the contract
   * @dev Only callable by authorized addresses
   * @param _token The address of the token
   */
   function addStableCoin(address[] calldata _tokens) external onlyAuthorized {
       for (uint256 i = 0; i < _tokens.length; i++) {
           address token = _tokens[i];
           if (token == address(0)) revert InvalidAddress();
           isStableCoin[token] = true;
           emit StableCoinAdded(token, block.timestamp);
       }
   }

  /*
   * @title Removes Whitelisted Stable Coin
   * @notice Removed a coin as a stable coin from the contract's whitelist
   * @dev Only callable by authorized addresses
   * @param _token The address of the token
   */
   function removeStableCoin(address[] calldata _tokens) external onlyAuthorized {
       for (uint256 i = 0; i < _tokens.length; i++) {
           address token = _tokens[i];
           if (token == address(0)) revert InvalidAddress();
           isStableCoin[token] = false;
           emit StableCoinRemoved(token, block.timestamp);
       }
   }

  /*
   * @title Whitelist Tokens
   * @notice Whitelists tokens in the contract
   * @dev Only callable by authorized addresses
   * @param _tokens Array of token addresses to whitelist
   */
  function whitelistTokens(address[] calldata _tokens) external onlyAuthorized {
    for (uint256 i = 0; i < _tokens.length; i++) {
      address token = _tokens[i];
      if (token == address(0)) revert InvalidAddress();
      whitelistedTokens[token] = true;
      emit TokenWhitelisted(token, block.timestamp);
    }
  }

  function addTokenPools(
    address[] calldata _tokens,
    address[] calldata _pools,
    address[] calldata _pairedTokens,
    uint256 length
  ) external onlyAuthorized {
    if (_tokens.length != length) revert InvalidInput();
    if (_pools.length != length) revert InvalidInput();
    if (_pairedTokens.length != length) revert InvalidInput();
    for (uint256 i = 0; i < length; i++) {
      if (_tokens[i] == address(0)) revert InvalidInput();
      if (_pools[i] == address(0)) revert InvalidInput();
      if (_pairedTokens[i] == address(0)) revert InvalidInput();
      TokenPool storage tokenPool = tokenPools[_tokens[i]];
      tokenPool.pool = _pools[i];
      tokenPool.pairedToken = _pairedTokens[i];
      emit TokenAndPoolAdded(_tokens[i], _pools[i], _pairedTokens[i], block.timestamp);
    }
  }

  function removeTokenPools(address[] calldata _tokens) external onlyAuthorized {
    for (uint256 i = 0; i < _tokens.length; i++) {
      if (_tokens[i] == address(0)) revert InvalidInput();
      TokenPool storage tokenPool = tokenPools[_tokens[i]];
      emit TokenAndPoolRemoved(_tokens[i], tokenPool.pool, tokenPool.pairedToken, block.timestamp);
      tokenPool.pool = address(0);
      tokenPool.pairedToken = address(0);
    }
  }

  /*
   * @title Blacklist Tokens
   * @notice Blacklists tokens in the contract
   * @dev Only callable by authorized addresses
   * @param _tokens Array of token addresses to blacklist
   */
  function blacklistTokens(address[] calldata _tokens) external onlyAuthorized {
    for (uint256 i = 0; i < _tokens.length; i++) {
      address token = _tokens[i];
      if (token == address(0)) revert InvalidAddress();
      whitelistedTokens[token] = false;
      emit TokenBlacklisted(token, block.timestamp);
    }
  }

  /*
   * @title ERC20 Validation
   * @notice Validates if a token follows ERC20 standard
   * @dev Only callable by other functions
   * @param _token The token which needs to be validated
   * @return success Returns true if token follows ERC20 standard and false if not
   */
  function isValidERC20(address _token) internal view returns (bool) {
    try IERC20Metadata(_token).decimals() returns (uint8) {
      return true;
    } catch {
      return false;
    }
  }

  // Admin Functions

  /*
   * @title Pause Control
   * @notice Pauses all contract operations
   * @dev Only callable by the contract owner
   * @return success Returns true if successful
   */
  function pause() external onlyOwner returns (bool result) {
    _pause();
    return true;
  }

  /*
   * @title Pause Control
   * @notice Unpauses all contract operations
   * @dev Only callable by the contract owner
   * @return success Returns true if successful
   */
  function unpause() external onlyOwner returns (bool result) {
    _unpause();
    return true;
  }

  function getPoolTokens() external returns (address[] memory) {
    return poolTokens;
  }
}
