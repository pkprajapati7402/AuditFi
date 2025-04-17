import { ethers } from 'ethers';

// Define event types for better type safety
type EthereumEvent = 
  | { type: 'accountsChanged'; value: string[] }
  | { type: 'chainChanged'; value: string }
  | { type: 'connect'; value: { chainId: string } }
  | { type: 'disconnect'; value: { code: number; message: string } };

// Define event listener type
type EthereumEventListener<T extends EthereumEvent['type']> = (
  ...args: Extract<EthereumEvent, { type: T }>['value'] extends never
    ? []
    : [Extract<EthereumEvent, { type: T }>['value']]
) => void;

// Define interfaces for better type safety
interface EthereumProvider extends ethers.Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on<T extends EthereumEvent['type']>(event: T, listener: EthereumEventListener<T>): void;
  removeListener<T extends EthereumEvent['type']>(event: T, listener: EthereumEventListener<T>): void;
}

interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface ChainConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconPath: string;
}

// Extend Window interface properly
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  lineaSepolia: {
    chainId: '0xE705', // 59141 in hex
    chainName: 'Linea Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.linea.build'],
    blockExplorerUrls: ['https://sepolia.lineascan.build'],
    iconPath: '/chains/linea.png'
  },
  neoX: {
    chainId: '0xBA93', // 47763 in hex
    chainName: 'Neo X Mainnet',
    nativeCurrency: { name: 'GAS', symbol: 'GAS', decimals: 18 },
    rpcUrls: ['https://mainnet-1.rpc.banelabs.org/'],
    blockExplorerUrls: ['https://xexplorer.neo.org/'],
    iconPath: '/chains/neox.png'
  },
  neoXTestnet: {
    chainId: '0xBA9304', // 12227332 in hex
    chainName: 'Neo X TestNet',
    nativeCurrency: { name: 'GAS', symbol: 'GAS', decimals: 18 },
    rpcUrls: ['https://neoxt4seed1.ngd.network'],
    blockExplorerUrls: ['https://xt4scan.ngd.network/'],
    iconPath: '/chains/neox.png'
  },
  kaiaTestnet: {
    chainId: '0x3E9', // 1001 in hex
    chainName: 'Kaia Testnet',
    nativeCurrency: { 
      name: 'KAIA', 
      symbol: 'KAIA', 
      decimals: 18 
    },
    rpcUrls: ['https://kaia-kairos.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://kairos.kaiascope.com'],
    iconPath: '/chains/kaia.png'
  },
  flowTestnet: {
    chainId: '0x221', // 545 in hex
    chainName: 'Flow Testnet',
    nativeCurrency: { 
      name: 'FLOW', 
      symbol: 'FLOW', 
      decimals: 18 
    },
    rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
    blockExplorerUrls: ['https://evm-testnet.flowscan.io'],
    iconPath: '/chains/flow.png' 
  },
  telosTestnet: {
    chainId: '0x29', // 47 in hex
    chainName: 'Telos Testnet',
    nativeCurrency: { 
      name: 'TLOS', 
      symbol: 'TLOS', 
      decimals: 18 
    },
    rpcUrls: ['https://testnet.telos.net/evm'],
    blockExplorerUrls: ['https://testnet.teloscan.io'],
    iconPath: '/chains/telos.png' 
  },
  ancient8Testnet: {
    chainId: '0x1AD1BA8', // 28122024 in hex
    chainName: 'Ancient8 Testnet',
    nativeCurrency: { 
      name: 'ETH', 
      symbol: 'ETH', 
      decimals: 18 
    },
    rpcUrls: ['https://rpcv2-testnet.ancient8.gg'],
    blockExplorerUrls: ['https://ancient8.testnet.routescan.io', 'https://scanv2-testnet.ancient8.gg'],
    iconPath: '/chains/ancient8.png' 
  },
  educhainTestnet: {
    chainId: '0xA045C', // 656476 in hex
    chainName: 'EDU Chain Testnet',
    nativeCurrency: { 
      name: 'EDU', 
      symbol: 'EDU', 
      decimals: 18 
    },
    rpcUrls: ['https://open-campus-codex-sepolia.drpc.org'],
    blockExplorerUrls: ['https://opencampus-codex.blockscout.com'],
    iconPath: '/chains/educhain.png'
  }
} as const;

export type ChainKey = keyof typeof CHAIN_CONFIG;

interface WalletConnection {
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}

interface EthereumError extends Error {
  code: number;
}

export const connectWallet = async (): Promise<WalletConnection> => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const switchNetwork = async (chainKey: ChainKey): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  const chain = CHAIN_CONFIG[chainKey];
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.chainId }],
    });
  } catch (error) {
    const switchError = error as EthereumError;
    // This error code means the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chain.chainId,
            chainName: chain.chainName,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls,
            blockExplorerUrls: chain.blockExplorerUrls
          }],
        });
      } catch (addError) {
        console.error('Error adding chain:', addError);
        throw addError;
      }
    } else {
      console.error('Error switching chain:', switchError);
      throw switchError;
    }
  }
};

export const isSupportedNetwork = (chainId: string): boolean => {
  return Object.values(CHAIN_CONFIG).some(
    chain => chain.chainId.toLowerCase() === chainId.toLowerCase()
  );
};