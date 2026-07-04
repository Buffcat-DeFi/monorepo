// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from '../../../lib/forge-std/src/Script.sol';
import {BuffCatUpgradeable, LockType, LockInfo} from '../../../archive/chainlinkOracleOnly/BuffCat.sol';
import {MockERC20} from '../../unit/lib/MockERC20.sol';
import {ERC1967Proxy} from '../../../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '../../../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol';
import '../../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '../../../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol';
import {MockFeedRegistry} from '../../../test/unit/lib/MockFeedRegistry.sol';
import {Denominations} from '../../../lib/chainlink-brownie-contracts/contracts/src/v0.8/Denominations.sol';

contract TestingScript is Script {
  BuffCatUpgradeable public buffCat;
  MockFeedRegistry public registry;
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

  uint256 public constant INITIAL_BALANCE = 100000 * 10 ** 18;
  uint256 public constant LOCK_AMOUNT = 10 * 10 ** 18;

  function run() external {
    // Renamed to run()
    // Derive addresses from private keys
    uint256 ownerPrivateKey = vm.envUint('OWNER_PRIVATE_KEY_HEX');
    // address owner = vm.addr(ownerPrivateKey);

    uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
    address user = vm.addr(userPrivateKey);

    uint256 founderPrivateKey = vm.envUint('FOUNDER_PRIVATE_KEY_HEX');
    address founder = vm.addr(founderPrivateKey);

    uint256 developerPrivateKey = vm.envUint('DEVELOPER_PRIVATE_KEY_HEX');
    address developer = vm.addr(developerPrivateKey);

    // Broadcast token deployments
    vm.startBroadcast();
    token1 = new MockERC20('Token1', 'T1');
    token2 = new MockERC20('Token2', 'T2');
    token3 = new MockERC20('Token3', 'T3');
    token4 = new MockERC20('Token4', 'T4');
    token5 = new MockERC20('Token5', 'T5');
    token6 = new MockERC20('Token6', 'T6');
    token7 = new MockERC20('Token7', 'T7');
    token8 = new MockERC20('Token8', 'T8');
    token9 = new MockERC20('Token9', 'T9');
    usdc = new MockERC20('USD Centric', 'USDC');
    usdt = new MockERC20('USD Tether', 'USDT');
    vm.stopBroadcast();

    // Broadcast minting operations
    vm.startBroadcast();
    token1.mint(user, INITIAL_BALANCE);
    token2.mint(user, INITIAL_BALANCE);
    token3.mint(user, INITIAL_BALANCE);
    token4.mint(user, INITIAL_BALANCE);
    token5.mint(user, INITIAL_BALANCE);
    token6.mint(user, INITIAL_BALANCE);
    token7.mint(user, INITIAL_BALANCE);
    vm.stopBroadcast();

    // Broadcast registry setup
    vm.startBroadcast();
    registry = new MockFeedRegistry();
    registry.setPrice(address(token1), Denominations.USD, int256(2000 * 10 ** 8));
    registry.setPrice(address(token2), Denominations.USD, int256(60000 * 10 ** 8));
    registry.setPrice(address(token3), Denominations.USD, int256(1 * 10 ** 8));
    registry.setPrice(address(token4), Denominations.USD, int256(1 * 10 ** 8));
    registry.setPrice(address(token5), Denominations.USD, int256(1 * 10 ** 8));
    registry.setPrice(address(token6), Denominations.USD, int256(1 * 10 ** 8));
    registry.setPrice(address(token7), Denominations.USD, int256(2000 * 10 ** 8));
    vm.stopBroadcast();

    // Broadcast BuffCat deployment (owner only)
    vm.startBroadcast(ownerPrivateKey);
    BuffCatUpgradeable implementation = new BuffCatUpgradeable();
    bytes memory data = abi.encodeWithSelector(
      BuffCatUpgradeable.initialize.selector,
      developer,
      founder,
      address(registry)
    );
    ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), data);
    buffCat = BuffCatUpgradeable(address(proxy));

    buffCat.addStableCoin(address(token7));

    address[] memory tokensWhitelist = new address[](7);
    tokensWhitelist[0] = address(token1);
    tokensWhitelist[1] = address(token2);
    tokensWhitelist[2] = address(token3);
    tokensWhitelist[3] = address(token4);
    tokensWhitelist[4] = address(token5);
    tokensWhitelist[5] = address(token6);
    tokensWhitelist[6] = address(token7);
    buffCat.whitelistTokens(tokensWhitelist);
    vm.stopBroadcast();

    // Broadcast user operations
    vm.startBroadcast(userPrivateKey);
    token1.approve(address(buffCat), INITIAL_BALANCE);
    token2.approve(address(buffCat), INITIAL_BALANCE);
    token3.approve(address(buffCat), INITIAL_BALANCE);
    token4.approve(address(buffCat), INITIAL_BALANCE);
    token5.approve(address(buffCat), INITIAL_BALANCE);
    token6.approve(address(buffCat), INITIAL_BALANCE);
    token7.approve(address(buffCat), INITIAL_BALANCE);

    buffCat.lockAssets(address(token1), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token2), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token3), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token4), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token5), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token6), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    buffCat.lockAssets(address(token7), LOCK_AMOUNT * 100, 30, LockType.FLEXIBLE, address(0));
    vm.stopBroadcast();
  }
}
