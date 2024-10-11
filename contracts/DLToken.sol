// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract DLToken {

    // State variables
    string tokenName;
    string tokenSymbol;
    uint256 totalSupply;
    address owner;
    uint16 percent = 5; // Burn rate is 5%

    // Balance tracking for addresses
    mapping (address => uint256) balances;
    // Allowance mapping for transferFrom
    mapping (address => mapping (address => uint256)) allow;

    // Constructor to initialize token name, symbol and mint tokens
    constructor(string memory _name, string memory _symbol) {
        tokenName = _name;
        tokenSymbol = _symbol;
        owner = msg.sender;

        // Mint initial supply
        mint(1000000, owner);
    }

    // Events for logging
    event Transfer(address indexed sender, address indexed receiver, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    // Getter functions for token details
    function getTokenName() external view returns (string memory) {
        return tokenName;
    }

    function getSymbol() external view returns (string memory) {
        return tokenSymbol;
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }

    function decimal() external pure returns (uint8) {
        return 18;
    }

    // Balance check
    function balanceOf(address _address) external view returns (uint256) {
        return balances[_address];
    }

    // Transfer function with 5% burn mechanism
    function transfer(address _receiver, uint256 _amountOfToken) external {
        require(_receiver != address(0), "Address is not allowed");
        require(_amountOfToken <= balances[msg.sender], "You can't transfer more than what is available");

        uint256 burnAmount = (_amountOfToken * percent) / 100;
        uint256 transferAmount = _amountOfToken - burnAmount;

        // Burn 5% of the amount
        burn(msg.sender, burnAmount);

        // Transfer the remaining 95%
        balances[msg.sender] -= transferAmount;
        balances[_receiver] += transferAmount;

        emit Transfer(msg.sender, _receiver, transferAmount);
    }

    // Approve function for delegation
    function approve(address _delegate, uint256 _amountOfToken) external {
        require(balances[msg.sender] >= _amountOfToken, "Balance is not enough");

        allow[msg.sender][_delegate] = _amountOfToken;
        emit Approval(msg.sender, _delegate, _amountOfToken);
    }

    // Check allowance for delegated transfers
    function allowance(address _owner, address _delegate) external view returns (uint256) {
        return allow[_owner][_delegate];
    }

    // TransferFrom function with 5% burn mechanism
    function transferFrom(address _owner, address _buyer, uint256 _amountOfToken) external {
        require(_owner != address(0), "Owner address is not allowed");
        require(_buyer != address(0), "Buyer address is not allowed");
        require(_amountOfToken <= balances[_owner], "Amount exceeds balance");
        require(_amountOfToken <= allow[_owner][msg.sender], "Amount exceeds allowance");

        uint256 burnAmount = (_amountOfToken * percent) / 100;
        uint256 transferAmount = _amountOfToken - burnAmount;

        // Burn 5% of the amount
        burn(_owner, burnAmount);

        // Transfer the remaining 95%
        balances[_owner] -= transferAmount;
        allow[_owner][msg.sender] -= transferAmount;
        balances[_buyer] += transferAmount;

        emit Transfer(_owner, _buyer, transferAmount);
    }

    // Internal burn function
    function burn(address _address, uint256 _amount) internal {
        require(balances[_address] >= _amount, "Not enough tokens to burn");
        balances[_address] -= _amount;
        totalSupply -= _amount;

        emit Transfer(_address, address(0), _amount);
    }

    // Internal mint function called in constructor
    function mint(uint256 _amount, address _addr) internal {
        uint256 actualSupply = _amount * (10**18);
        balances[_addr] += actualSupply;
        totalSupply += actualSupply;

        emit Transfer(address(0), _addr, actualSupply);
    }
    
}


