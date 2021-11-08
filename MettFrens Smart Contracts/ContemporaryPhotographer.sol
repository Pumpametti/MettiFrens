//SPDX-License-Identifier: MIT

//ContemporaryPhotographer my photo collection. whatever text you want to add, add // in front!

pragma solidity ^0.8.0;

interface MettiInuInterface {
  function balanceOf(address account) external view returns (uint256 balance);
}

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RandomlyAssigned.sol";

contract ContemporaryPhotographer is ERC721Enumerable, Ownable, RandomlyAssigned {
  using Strings for uint256;
  
  string public baseExtension = ".json";
  uint256 public cost = 5000 ether;   
  uint256 public maxCP = 100; 
  uint256 public maxCPMintAmount = 10; 
  bool public paused = false;
  
  string public baseURI = "https://ipfs.io/ipfs/QmXx1FooggXUQAQN2FF8DwgPuwRggMQGctXQzjsEK5s8jo/";
  
  address public MettiInuTokenAddress = 0x42aE8468A1FDDB965d420BD71368a87Ec3a2B4b8;
  MettiInuInterface MettiInuTokenContract = MettiInuInterface(MettiInuTokenAddress); 

  constructor(
  ) ERC721("ContemporaryPhotographer", "CP")
  RandomlyAssigned(100, 1) {}

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // public
    function mintMettiTokenHolderMT6s(uint256 _CPMintAmount) public payable {
    require(!paused);
    require(MettiInuTokenContract.balanceOf(msg.sender) >= 10000000000000000000000000000, "Not enough Metti Inu tokens");
    require(_CPMintAmount > 0);
    require(_CPMintAmount <= maxCPMintAmount);
    require(totalSupply() + _CPMintAmount <= maxCP);
    require(msg.value >= cost * _CPMintAmount);

    for (uint256 i = 1; i <= _CPMintAmount; i++) {
        uint256 mintIndex = nextToken();
     if (totalSupply() < maxCP) {
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