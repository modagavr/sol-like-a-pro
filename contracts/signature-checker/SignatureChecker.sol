//SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SignatureChecker {
    using ECDSA for bytes32;

    bytes32 public constant CAT = keccak256("Cat");

    address public immutable claimer;

    uint8 public giftsClaimed = 0;

    constructor() {
        claimer = msg.sender;
    }

    function isValidSignature(bytes calldata signature)
        public
        view
        returns (bool)
    {
        return CAT.toEthSignedMessageHash().recover(signature) == claimer;
    }

    function claimGift(bytes calldata signature) external {
        require(
            isValidSignature(signature),
            "SignatureChecker: Invalid Signature"
        );

        giftsClaimed++;
    }
}
