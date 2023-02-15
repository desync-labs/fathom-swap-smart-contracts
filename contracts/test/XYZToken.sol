pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract XYZ is ERC20 {
    constructor() ERC20('XYZ Token', 'XYZ') public {
        _mint(msg.sender, 10**10);
    }
}