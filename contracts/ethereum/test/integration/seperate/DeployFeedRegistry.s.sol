// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {MockFeedRegistry} from '../../test/unit/lib/MockFeedRegistry.sol';

contract TestingScript is Script {
  MockFeedRegistry public registry;

  function run() external {
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    address ownerPublicKey = vm.addr(ownerPrivateKey);
    console.log('Owner Public Key Address:', ownerPublicKey);

    vm.startBroadcast(ownerPrivateKey);
    registry = new MockFeedRegistry();
    console.log('MockFeedRegistry successfully deployed at:', address(registry));
    vm.stopBroadcast();
  }
}
