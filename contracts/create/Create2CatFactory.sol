//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";

import "./CreateCat.sol";

contract Create2CatFactory {
    address public cat;

    function deployCat(bytes32 _salt, uint8 _age) external returns (bool) {
        cat = Create2.deploy(
            0,
            _salt,
            abi.encodePacked(type(CreateCat).creationCode, abi.encode(_age))
        );

        return true;
    }

    function computeCatAddress(bytes32 _salt, uint8 _age)
        public
        view
        returns (address)
    {
        return
            Create2.computeAddress(
                _salt,
                keccak256(
                    abi.encodePacked(
                        type(CreateCat).creationCode,
                        abi.encode(_age)
                    )
                )
            );
    }
}
