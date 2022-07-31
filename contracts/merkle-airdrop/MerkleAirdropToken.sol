//SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MerkleAirdropToken is ERC20 {
    constructor() ERC20("MerkleAirdropToken", "MAT") {
        _mint(msg.sender, 10 * 10**decimals());
    }
}
