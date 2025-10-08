// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OptimizedToken
 * @dev Optimized ERC20 token with gas-efficient patterns, burnable, pausable, and ownable features
 * @notice This contract implements gas-optimized patterns for deployment and trading
 */
contract OptimizedToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    uint8 private constant DECIMALS = 18;
    uint256 private constant MAX_SUPPLY = 1_000_000_000 * 10**DECIMALS; // 1B tokens max
    
    // Gas-optimized events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event EmergencyPause();
    event EmergencyUnpause();

    /**
     * @dev Constructor that initializes the token with optimized gas usage
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of tokens (in wei)
     * @param owner The owner of the contract
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds maximum");
        require(owner != address(0), "Owner cannot be zero address");
        
        _mint(owner, initialSupply);
        emit TokensMinted(owner, initialSupply);
    }

    /**
     * @dev Returns the number of decimals used
     * @return The number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Returns the maximum supply of tokens
     * @return The maximum supply
     */
    function maxSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Mint would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) public override whenNotPaused {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from a specific account (only owner)
     * @param from The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override whenNotPaused {
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Pause all token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPause();
    }

    /**
     * @dev Unpause all token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause();
    }

    /**
     * @dev Hook that is called before any transfer of tokens
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param value The amount of tokens transferred
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }

    /**
     * @dev Emergency function to recover accidentally sent tokens (only owner)
     * @param token The token contract address
     * @param amount The amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot recover own tokens");
        IERC20(token).transfer(owner(), amount);
    }
}

