// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSvgNft is ERC721 {
    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI; 
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) private s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(address _priceFeedAddress, string memory _lowSvg, string memory _highSvg)
        ERC721("Dynamic SVG NFT", "DSN")
    {
        s_tokenCounter = 0;
        i_priceFeed = AggregatorV3Interface(_priceFeedAddress);
        i_lowImageURI = svgToImageUri(_lowSvg);
        i_highImageURI = svgToImageUri(_highSvg);
    }

    function svgToImageUri(string memory _svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(_svg)))
        );
        return
            string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function mintNft(int256 _highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = _highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter++;
        emit CreatedNFT(s_tokenCounter, _highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "URI query for nonexistent token");
    

        (, int256 price, , , ) = i_priceFeed.latestRoundData(); 
        
        string memory imageURI = i_lowImageURI; 
         if (price >= s_tokenIdToHighValue[_tokenId]) {
            imageURI = i_highImageURI;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description": "An NFT that changes based on the Chainlink Feed", ',
                                '"attributes":  [{"trait_type": "coolness", "value": 100 }], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}

// mint
// store SVG info somewhere
// Some logic to say "Show X image" or "Show Y image" based on some condition
