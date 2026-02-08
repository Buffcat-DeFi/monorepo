// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev Mints new tokens and assigns them to the specified account
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from the specified account
     * @param from The address from which tokens will be burned
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(
            msg.sender == owner() || msg.sender == from,
            "Not authorized to burn"
        );
        _burn(from, amount);
    }
}
