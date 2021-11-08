//SPDX-License-Identifier: MIT

// ███    ███ ███████ ████████ ████████ ██     ███████ ██████  ███████ ███    ██ ███████ 
// ████  ████ ██         ██       ██    ██     ██      ██   ██ ██      ████   ██ ██      
// ██ ████ ██ █████      ██       ██    ██     █████   ██████  █████   ██ ██  ██ ███████ 
// ██  ██  ██ ██         ██       ██    ██     ██      ██   ██ ██      ██  ██ ██      ██ 
// ██      ██ ███████    ██       ██    ██     ██      ██   ██ ███████ ██   ████ ███████ 
// 
// MettiFrens is a test NFT collection for artists to learn the genertaive process of NFT collection minting without coding background!
// Testing so these will not be in official artwork collections created by Pumpametti. Maybe as educational artifacts who knows. 

pragma solidity ^0.8.0;

interface MettiInuInterface {
  function balanceOf(address account) external view returns (uint256 balance);
}

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RandomlyAssigned.sol";

contract MettiFrens is ERC721Enumerable, Ownable, RandomlyAssigned {
  using Strings for uint256;
  
  string public baseExtension = ".json";
  uint256 public cost = 0.05 ether; 
  uint256 public maxFREN = 100; 
  uint256 public maxFRENMintAmount = 10; 
  bool public paused = false;
  
  string public baseURI = "https://ipfs.io/ipfs/QmXx1FooggXUQAQN2FF8DwgPuwRggMQGctXQzjsEK5s8jo/";
  
  address public MettiInuTokenAddress = 0x42aE8468A1FDDB965d420BD71368a87Ec3a2B4b8;
  MettiInuInterface MettiInuTokenContract = MettiInuInterface(MettiInuTokenAddress); 

  constructor(
  ) ERC721("MettiFrens", "FREN")
  RandomlyAssigned(100, 1) {}

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // public
    function mintMettiTokenHolderFRENs(uint256 _FRENMintAmount) public payable {
    require(!paused);
    require(MettiInuTokenContract.balanceOf(msg.sender) >= 10000000000000000000000000000, "Not enough Metti Inu tokens");
    require(_FRENMintAmount > 0);
    require(_FRENMintAmount <= maxFRENMintAmount);
    require(totalSupply() + _FRENMintAmount <= maxFREN);
    require(msg.value >= cost * _FRENMintAmount);

    for (uint256 i = 1; i <= _FRENMintAmount; i++) {
        uint256 mintIndex = nextToken();
     if (totalSupply() < maxFREN) {
                _safeMint(_msgSender(), mintIndex);
    }
   }
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }

  //only owner

  function withdraw() public payable onlyOwner {
    require(payable(msg.sender).send(address(this).balance));
  }
}