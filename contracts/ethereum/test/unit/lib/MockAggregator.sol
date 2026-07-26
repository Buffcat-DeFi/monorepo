// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AggregatorV2V3Interface} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";

contract MockAggregator is AggregatorV2V3Interface {
    uint8 private _decimals;
    string private _description;
    uint256 private _version;

    int256 private _answer;
    uint80 private _roundId;
    uint256 private _startedAt;
    uint256 private _updatedAt;
    uint80 private _answeredInRound;

    /**
     * @param decimals_ Number of decimals of the answer
     * @param initialAnswer Initial price answer (scaled by decimals_)
     */
    constructor(uint8 decimals_, int256 initialAnswer) {
        _decimals = decimals_;
        _description = "MockAggregator";
        _version = 1;

        _roundId = 1;
        _answer = initialAnswer;
        _startedAt = block.timestamp;
        _updatedAt = block.timestamp;
        _answeredInRound = 1;
    }

    /** @notice Returns number of decimals */
    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    /** @notice Returns description of the aggregator */
    function description() external view override returns (string memory) {
        return _description;
    }

    /** @notice Returns version */
    function version() external view override returns (uint256) {
        return _version;
    }

    /** @notice Updates the answer to a new value */
    function updateAnswer(int256 newAnswer) external {
        _roundId += 1;
        _answer = newAnswer;
        _startedAt = _updatedAt;
        _updatedAt = block.timestamp;
        _answeredInRound = _roundId;
    }

    /**
     * @notice Returns latest round data
     * @return roundId Round ID
     * @return answer Answer for this round
     * @return startedAt Timestamp when round started
     * @return updatedAt Timestamp when round was updated
     * @return answeredInRound ID of the round in which answer was computed
     */
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _answer, _startedAt, _updatedAt, _answeredInRound);
    }

    /**
     * @notice Returns round data for a given round ID
     */
    function getRoundData(
        uint80 id
    )
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(id == _roundId, "No data present");
        return (_roundId, _answer, _startedAt, _updatedAt, _answeredInRound);
    }

    // The following functions are required by AggregatorV2V3Interface but not used in tests
    function latestAnswer() external view override returns (int256) {
        return _answer;
    }

    function latestTimestamp() external view override returns (uint256) {
        return _updatedAt;
    }

    function latestRound() external view override returns (uint256) {
        return _roundId;
    }

    function getAnswer(uint256) external view override returns (int256) {
        return _answer;
    }

    function getTimestamp(uint256) external view override returns (uint256) {
        return _updatedAt;
    }
}
