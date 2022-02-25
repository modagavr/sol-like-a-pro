//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MerkleAirdrop {
    using SafeERC20 for IERC20;

    address public immutable token;
    bytes32 public immutable merkleRoot;

    mapping(address => bool) public claimed;

    event Claim(address indexed claimer);

    constructor(address _token, bytes32 _merkleRoot) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    function claim(bytes32[] calldata merkleProof) external {
        require(
            canClaim(msg.sender, merkleProof),
            "MerkleAirdrop: Address is not a candidate for claim"
        );

        claimed[msg.sender] = true;

        IERC20(token).safeTransfer(msg.sender, 1 ether);

        emit Claim(msg.sender);
    }

    function canClaim(address claimer, bytes32[] calldata merkleProof)
        public
        view
        returns (bool)
    {
        return
            !claimed[claimer] &&
            MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(claimer))
            );
    }
}
