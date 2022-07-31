//SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

contract CreateCat {
    uint8 public immutable age;

    constructor(uint8 _age) {
        age = _age;
    }
}
