//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RentableNFT is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Rental {
        bool isActive;
        address lord;
        address renter;
        uint256 expiresAt;
    }

    mapping(uint256 => Rental) public rental;

    event Rented(
        uint256 indexed tokenId,
        address indexed lord,
        address indexed renter,
        uint256 expiresAt
    );

    event FinishedRent(
        uint256 indexed tokenId,
        address indexed lord,
        address indexed renter,
        uint256 expiresAt
    );

    constructor() ERC721("RentableNFT", "RENT") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function rentOut(
        address renter,
        uint256 tokenId,
        uint256 expiresAt
    ) external {
        _transfer(msg.sender, renter, tokenId);

        rental[tokenId] = Rental({
            isActive: true,
            lord: msg.sender,
            renter: renter,
            expiresAt: expiresAt
        });

        emit Rented(tokenId, msg.sender, renter, expiresAt);
    }

    function finishRenting(uint256 tokenId) external {
        Rental storage _rental = rental[tokenId];

        require(
            msg.sender == _rental.renter ||
                block.timestamp >= _rental.expiresAt,
            "RentableNFT: this token is rented"
        );

        _rental.isActive = false;

        _transfer(_rental.renter, _rental.lord, tokenId);

        emit FinishedRent(
            tokenId,
            _rental.lord,
            _rental.renter,
            _rental.expiresAt
        );
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        require(!rental[tokenId].isActive, "RentableNFT: this token is rented");

        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
