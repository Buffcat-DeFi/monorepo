// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/BuffCat.sol";
import {ERC1967Proxy} from "@openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployBuffCatUpgradeableOnSepolia is Script {
    function run() external {
        address developerPublicKey = vm.envAddress("DEVELOPER_PUBLIC_KEY");
        address founderPublicKey = vm.envAddress("FOUNDER_PUBLIC_KEY");

        address chainlinkFeedRegistryPublicKey = vm.envAddress("CHAINLINK_FEED_REGISTRY_SEPOLIA_ADDRESS");
        address uniswapPublicKey = vm.envAddress("UNISWAP_SEPOLIA_ADDRESS");

        uint256 ownerPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");
        address ownerPublicKey = vm.addr(ownerPrivateKey);

        vm.startBroadcast(ownerPrivateKey);

        // Deploy BuffCatUpgradeable logic contract
        BuffCatUpgradeable buffcatImpl = new BuffCatUpgradeable();

        console.log(
            "BuffCatUpgradeable Implementation deployed at:",
            address(buffcatImpl)
        );
        console.log("");
        console.log("");

        // Deploy proxy with initializer
        bytes memory data = abi.encodeWithSelector(
            BuffCatUpgradeable.initialize.selector,
            developerPublicKey,
            founderPublicKey,
            chainlinkFeedRegistryPublicKey,
            uniswapPublicKey
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(buffcatImpl), data);

        console.log("BuffCatUpgradeable Proxy deployed at:", address(proxy));
        console.log("");
        console.log("");

        vm.stopBroadcast();
    }
}
