// src/app/contract-builder/templates.ts
import React, { ReactNode } from 'react';
import { Cube, Lightning, Gear } from 'phosphor-react';

export interface ContractTemplate {
  name: string;
  description: string;
  icon: ReactNode;
  features: string[];
  defaultParams?: Record<string, string>;
  baseCode: string;
}

// Common base contracts
const ERC20_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CustomToken is ERC20, Ownable, Pausable {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) 
        ERC20(name_, symbol_) 
    {
        _mint(msg.sender, initialSupply * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}`;

const NFT_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CustomNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, Pausable {
    using Strings for uint256;
    
    string private baseURI;
    uint256 private _tokenIdCounter;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) 
        ERC721(name_, symbol_) 
    {
        baseURI = baseURI_;
    }

    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    name: 'ERC20 Token',
    description: 'Create a custom ERC20 token with advanced features',
    icon: React.createElement(Cube, { size: 24 }),
    features: ['Mintable', 'Burnable', 'Pausable', 'Access Control'],
    defaultParams: {
      name: 'My Token',
      symbol: 'MTK',
      initialSupply: '1000000'
    },
    baseCode: ERC20_BASE
  },
  {
    name: 'NFT Collection',
    description: 'Launch your own NFT collection with ERC721',
    icon: React.createElement(Lightning, { size: 24 }),
    features: ['Batch Minting', 'Metadata Support', 'Access Control', 'Pausable'],
    defaultParams: {
      name: 'My NFT Collection',
      symbol: 'MNFT',
      baseURI: 'ipfs://'
    },
    baseCode: NFT_BASE
  },
  {
    name: 'Custom Contract',
    description: 'Build a custom smart contract from scratch',
    icon: React.createElement(Gear, { size: 24 }),
    features: ['Full Customization', 'AI Assistance', 'Best Practices', 'Security First'],
    baseCode: ''
  }
];