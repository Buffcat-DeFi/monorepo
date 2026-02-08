// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AggregatorV2V3Interface} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import {FeedRegistryInterface} from "../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";

contract MockFeedRegistry is FeedRegistryInterface {
    struct Feed {
        address aggregator;
        Phase phase;
    }

    mapping(address => mapping(address => int256)) public prices;
    mapping(address => mapping(address => Feed)) public feeds;

    function setPrice(address base, address quote, int256 price) external {
        prices[base][quote] = price;
    }

    function decimals(
        address base,
        address quote
    ) external pure override returns (uint8) {
        return 8;
    }

    function description(
        address base,
        address quote
    ) external pure override returns (string memory) {
        return "Mock Price Feed";
    }

    function version(
        address base,
        address quote
    ) external pure override returns (uint256) {
        return 2;
    }

    function latestRoundData(
        address base,
        address quote
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
        return (0, prices[base][quote], block.timestamp, block.timestamp, 0);
    }

    function getRoundData(
        address base,
        address quote,
        uint80 _roundId
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
        return (
            _roundId,
            prices[base][quote],
            block.timestamp,
            block.timestamp,
            _roundId
        );
    }

    function latestAnswer(
        address base,
        address quote
    ) external view override returns (int256 answer) {
        return prices[base][quote];
    }

    function latestTimestamp(
        address base,
        address quote
    ) external view override returns (uint256 timestamp) {
        return block.timestamp;
    }

    function latestRound(
        address base,
        address quote
    ) external view override returns (uint256 roundId) {
        return 0;
    }

    function getAnswer(
        address base,
        address quote,
        uint256 roundId
    ) external view override returns (int256 answer) {
        return prices[base][quote];
    }

    function getTimestamp(
        address base,
        address quote,
        uint256 roundId
    ) external view override returns (uint256 timestamp) {
        return block.timestamp;
    }

    function getFeed(
        address base,
        address quote
    ) external view override returns (AggregatorV2V3Interface aggregator) {
        return AggregatorV2V3Interface(feeds[base][quote].aggregator);
    }

    function getPhaseFeed(
        address base,
        address quote,
        uint16 phaseId
    ) external view override returns (AggregatorV2V3Interface aggregator) {
        return AggregatorV2V3Interface(feeds[base][quote].aggregator);
    }

    function isFeedEnabled(
        address aggregator
    ) external pure override returns (bool) {
        return true;
    }

    function getPhase(
        address base,
        address quote,
        uint16 phaseId
    ) external view override returns (Phase memory phase) {
        return feeds[base][quote].phase;
    }

    function getRoundFeed(
        address base,
        address quote,
        uint80 roundId
    ) external view override returns (AggregatorV2V3Interface aggregator) {
        return AggregatorV2V3Interface(feeds[base][quote].aggregator);
    }

    function getPhaseRange(
        address base,
        address quote,
        uint16 phaseId
    )
        external
        view
        override
        returns (uint80 startingRoundId, uint80 endingRoundId)
    {
        Phase memory phase = feeds[base][quote].phase;
        return (phase.startingAggregatorRoundId, phase.endingAggregatorRoundId);
    }

    function getPreviousRoundId(
        address base,
        address quote,
        uint80 roundId
    ) external pure override returns (uint80 previousRoundId) {
        return roundId - 1;
    }

    function getNextRoundId(
        address base,
        address quote,
        uint80 roundId
    ) external pure override returns (uint80 nextRoundId) {
        return roundId + 1;
    }

    function proposeFeed(
        address base,
        address quote,
        address aggregator
    ) external override {
        feeds[base][quote].aggregator = aggregator;
        emit FeedProposed(base, quote, aggregator, address(0), msg.sender);
    }

    function confirmFeed(
        address base,
        address quote,
        address aggregator
    ) external override {
        feeds[base][quote].aggregator = aggregator;
        feeds[base][quote].phase = Phase({
            phaseId: 1,
            startingAggregatorRoundId: 0,
            endingAggregatorRoundId: 0
        });
        emit FeedConfirmed(base, quote, aggregator, address(0), 1, msg.sender);
    }

    function getProposedFeed(
        address base,
        address quote
    )
        external
        view
        override
        returns (AggregatorV2V3Interface proposedAggregator)
    {
        return AggregatorV2V3Interface(feeds[base][quote].aggregator);
    }

    function proposedGetRoundData(
        address base,
        address quote,
        uint80 roundId
    )
        external
        view
        override
        returns (
            uint80 id,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            roundId,
            prices[base][quote],
            block.timestamp,
            block.timestamp,
            roundId
        );
    }

    function proposedLatestRoundData(
        address base,
        address quote
    )
        external
        view
        override
        returns (
            uint80 id,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, prices[base][quote], block.timestamp, block.timestamp, 0);
    }

    function getCurrentPhaseId(
        address base,
        address quote
    ) external view override returns (uint16 currentPhaseId) {
        return feeds[base][quote].phase.phaseId;
    }
}
