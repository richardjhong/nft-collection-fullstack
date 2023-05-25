// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
  string _baseTokenURI;
  uint public _price = 0.01 ether;
  bool public _paused;
  uint256 public maxTokenIds = 20;
  uint256 public tokenIds;
  IWhitelist whitelist;
  bool public presaleStarted;
  uint256 public presaleEnded;

  modifier onlyWhenNotPaused() {
    require(!_paused, "Contract currently paused");
    _;
  }

  /**
   * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
   * name in our case is `Crypto Devs` and symbol is `CD`.
   * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
   * It also initializes an instance of whitelist interface.
   */
  constructor(string memory baseURI, address whitelistContract) ERC721("CryptoDevs", "CD") {
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract);
  }

  /**
   * @dev startPresale starts a presale for the whitelisted addresses and ends 5 minutes after invoking
   */
  function startPresale() public onlyOwner {
    presaleStarted = true;
    presaleEnded = block.timestamp + 5 minutes;
  }

  /**
   * @dev presaleMint allows a user to mint one NFT per transaction during the presale.
   */
  function presaleMint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
    require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
    require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
    require(msg.value >= _price, "Ether sent is not correct");

    tokenIds++;
    //_safeMint is a safer version of the _mint function as it ensures that
    // if the address being minted to is a contract, then it knows how to deal with ERC721 tokens
    // If the address being minted to is not a contract, it works the same way as _mint
    _safeMint(msg.sender, tokenIds);
  }

  /**
   * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
   */
  function mint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended yet");
    require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
    require(msg.value >= _price, "Ether sent is not correct");

    tokenIds++;
    _safeMint(msg.sender, tokenIds);
  }

  /**
   * @dev _baseURI overrides the Openzeppelin's ERC721 implementation which by default
   * returned an empty string for the baseURI
   */
  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  /**
   * @dev setPaused makes the contract paused or unpaused
   */
  function setPaused(bool pauseState) public onlyOwner {
    _paused = pauseState;
  }

  /**
   * @dev withdraw sends all the ether in the contract
   * to the owner of the contract
   */
  function withdraw() public onlyOwner {
    address _owner = owner();
    uint256 amount = address(this).balance;
    (bool sent, ) = _owner.call{value: amount}("");
    require(sent, "Failed to send Ether");
  }

  receive() external payable {}

  fallback() external payable {}
}
