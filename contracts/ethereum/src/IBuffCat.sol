// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LockType} from "./BuffCat.sol";

interface IBuffCat {
  // Events :-

  // Errors :-

  // Functions :-
  function setAuthorizedUpdater(address _updater, bool _authorized) external;

  function updatePoolValue(
    uint256 _newNonStablePoolValueUSD,
    uint256 _newStablePoolValueUSD
  ) external;

  function lockAssets(
    address _token,
    uint256 _amount,
    uint256 _lockDuration,
    LockType _lockType,
    address _referrer
  ) external;

  function unlockAssets(uint256 _lockId, uint256 _amount) external;

  function claimRewards(
    address[] calldata _tokens,
    uint256 _lockId,
    uint256 daysOfUnclaimed
  ) external;

  function addStableCoin(address _token) external;

  function removeStableCoin(address token) external;

  function whitelistTokens(address[] calldata _tokens) external;

  function addTokenPools(
    address[] calldata _tokens,
    address[] calldata _pools,
    address[] calldata _pairedTokens,
    uint256 length
  ) external;

  function removeTokenPools(address[] calldata _tokens) external;

  function blacklistTokens(address[] calldata _tokens) external;

  function pause() external;

  function unpause() external;

  function getPoolTokens() external;
}
