// constants/contracts.ts
export const CONTRACT_ADDRESSES = {
    lineaSepolia: '0x03c4fb7563e593ca0625C1c64959AC56081785cE',
    neoX: '0xF859EB9658b52E29232f2a308920D4c04Df24D2F',
    neoXTestnet: '0x57fe5FC224a4609b0672bAd2563E5F2BF7c40E7B',
    kaiaTestnet: '0xAC89706b3D307D5d2aC740Afad7eF95F5bA7224c',
    flowTestnet:'0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6',
    telosTestnet: '0xF887B4D3b17C12C86cc917cF72fb8881f866a847',
    ancient8Testnet: '0xF887B4D3b17C12C86cc917cF72fb8881f866a847',
    educhainTestnet: '0x1AE7ED8C5Cc87E84b91eD8627Ac18540cB7a744F',
  } as const;

  export const AUDIT_REGISTRY_ABI = [
    "function registerAudit(bytes32 contractHash, uint8 stars, string calldata summary) external",
    "function getContractAudits(bytes32 contractHash) external view returns (tuple(uint8 stars, string summary, address auditor, uint256 timestamp)[])",
    "function getAuditorHistory(address auditor) external view returns (bytes32[])",
    "function getLatestAudit(bytes32 contractHash) external view returns (tuple(uint8 stars, string summary, address auditor, uint256 timestamp))",
    "function getAllAudits(uint256 startIndex, uint256 limit) external view returns (bytes32[] contractHashes, uint8[] stars, string[] summaries, address[] auditors, uint256[] timestamps)",
    "function getTotalContracts() external view returns (uint256)",
    "event AuditRegistered(bytes32 indexed contractHash, uint8 stars, string summary, address indexed auditor, uint256 timestamp)"
] as const;

export type ChainKey = keyof typeof CONTRACT_ADDRESSES;