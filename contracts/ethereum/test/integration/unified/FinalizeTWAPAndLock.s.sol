// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
pragma abicoder v2;

import {Script} from 'forge-std/Script.sol';
import {console} from 'forge-std/console.sol';
import {stdJson} from 'forge-std/StdJson.sol';
import {MockERC20} from '../../unit/lib/MockERC20.sol';
import {IBuffCat} from '../../../src/IBuffCat.sol';
import {LockType} from '../../../src/BuffCat.sol';
import '@openzeppelin-contracts/token/ERC20/IERC20.sol';
import {IUniswapV3Pool} from 'v3-core/interfaces/IUniswapV3Pool.sol';
import {ISwapRouter} from 'v3-periphery/interfaces/ISwapRouter.sol';

contract FinalizeTWAPAndLockScript is Script {
    using stdJson for string;

    uint256 public constant INITIAL_BALANCE = 1000 * 10 ** 18;
    uint256 public constant LOCK_AMOUNT = 100 * 10 ** 18;

    function run() external {
        uint256 userPrivateKey = vm.envUint('USER_PRIVATE_KEY_HEX');
        address user = vm.addr(userPrivateKey);

        address swapRouterAddr = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
        ISwapRouter swapRouter = ISwapRouter(swapRouterAddr);

        console.log('--- Starting FinalizeTWAPAndLock Script ---');
        console.log('User Address :', user);

        string memory path = string.concat(vm.projectRoot(), "/broadcast/deploy-addresses.json");
        string memory json = vm.readFile(path);

        address[] memory tokensWhitelist = new address[](9);

        for (uint256 i = 0; i < 9; i++) {
            tokensWhitelist[i] = json.readAddress(
                string.concat(".token", vm.toString(i + 1))
            );
        }

        address usdc = json.readAddress(".usdc");
        address usdt = json.readAddress(".usdt");
        IBuffCat buffCat = IBuffCat(json.readAddress(".buffCatProxy"));

        address[] memory poolArr = new address[](6);
        poolArr[0] = json.readAddress(".pool0");
        poolArr[1] = json.readAddress(".pool1");
        poolArr[2] = json.readAddress(".pool2");
        poolArr[3] = json.readAddress(".pool3");
        poolArr[4] = json.readAddress(".pool4");
        poolArr[5] = json.readAddress(".pool5");

        address[] memory allAssets = new address[](11);
        for(uint i=0; i<9; i++) { allAssets[i] = tokensWhitelist[i]; }
        allAssets[9] = usdc;
        allAssets[10] = usdt;

        console.log("forge timestamp", block.timestamp);
        vm.startBroadcast(userPrivateKey);

        for (uint256 i = 3; i < tokensWhitelist.length; i++) {
            _swapExactInputSingle(swapRouter, tokensWhitelist[i], usdc, user);
            console.log('Executed 10-minute Swap for TWAP for token:', tokensWhitelist[i]);
        }
        console.log("forge timestamp", block.timestamp);
        console.log('Swaps executed for TWAP.');

        // 8. Lock Assets
        for (uint256 i = 0; i < allAssets.length; i++) {
            IERC20(allAssets[i]).approve(address(buffCat), INITIAL_BALANCE);
            console.log('Approved BuffCat for asset:', allAssets[i]);
        }

        uint256 totalLockAmount = LOCK_AMOUNT;
        for (uint256 i = 0; i < 6; i++) {
            if (i >= 3) {
                (
                    ,
                    ,
                    uint16 observationIndex,
                    uint16 observationCardinality,
                    uint16 observationCardinalityNext,
                    ,
                    bool unlocked
                ) = IUniswapV3Pool(poolArr[i-3]).slot0();

                console.log("observationIndex", observationIndex);
                console.log("observationCardinality", observationCardinality);
                console.log("observationCardinalityNext", observationCardinalityNext);
            }

            buffCat.lockAssets(allAssets[i], totalLockAmount, 30, LockType.FLEXIBLE, address(0));
            console.log('Locked asset:', allAssets[i]);
        }
        console.log('Assets Locked.');

        vm.stopBroadcast();

        console.log('--- FinalizeTWAPAndLock Script Completed Successfully ---');
    }

    function _swapExactInputSingle(
        ISwapRouter swapRouter,
        address tokenIn,
        address tokenOut,
        address recipient
    ) internal {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 10000,
            recipient: recipient,
            deadline: block.timestamp + 1 hours,
            amountIn: 100 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        swapRouter.exactInputSingle(params);
    }
}
