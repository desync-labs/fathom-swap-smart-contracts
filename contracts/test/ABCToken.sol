pragma solidity =0.6.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ABC is ERC20 {
    constructor() ERC20('ABC Token', 'ABC') public {
        _mint(msg.sender, 10**10);
    }
}