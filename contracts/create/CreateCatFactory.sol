//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./CreateCat.sol";

contract CreateCatFactory {
    address public cat;

    function deployCat(uint8 _age) external {
        cat = address(new CreateCat(_age));
    }
}
