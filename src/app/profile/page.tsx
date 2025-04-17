'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Star,
  ArrowSquareOut,
  CircleNotch,
  Wallet,
} from 'phosphor-react';
import Image from 'next/image';
import { connectWallet } from '@/utils/web3';
import { CHAIN_CONFIG } from '@/utils/web3';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI } from '@/utils/contracts';

interface AuditStats {
  totalAudits: number;
  averageStars: number;
  chainBreakdown: Record<string, number>;
  recentAudits: UserAudit[];
}

interface UserAudit {
  contractHash: string;
  stars: number;
  summary: string;
  timestamp: number;
  chain: keyof typeof CHAIN_CONFIG;
}

export default function ProfilePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [stats, setStats] = useState<AuditStats>({
    totalAudits: 0,
    averageStars: 0,
    chainBreakdown: {},
    recentAudits: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const { address: userAddress } = await connectWallet();
        setAddress(userAddress);
        await fetchUserStats(userAddress);
      } catch (error) {
        console.error('Failed to initialize profile:', error);
      }
    };

    initializeProfile();
  }, []);

  const fetchUserStats = async (userAddress: string) => {
    setIsLoading(true);
    try {
      const allAudits: UserAudit[] = [];
      const chainCounts: Record<string, number> = {};
      let totalStars = 0;
  
      for (const [chainKey, chainData] of Object.entries(CHAIN_CONFIG)) {
        try {
          console.log(`Fetching from ${chainKey}...`);
          const provider = new ethers.JsonRpcProvider(chainData.rpcUrls[0]);
  
          const contract = new ethers.Contract(
            CONTRACT_ADDRESSES[chainKey as keyof typeof CONTRACT_ADDRESSES],
            AUDIT_REGISTRY_ABI,
            provider
          );
  
          // Get all audits in batches
          const BATCH_SIZE = 50;
          const totalContracts = await contract.getTotalContracts();
          let processed = 0;
  
          while (processed < totalContracts) {
            try {
              const {
                contractHashes,
                stars,
                summaries,
                auditors,
                timestamps
              } = await contract.getAllAudits(processed, BATCH_SIZE);
  
              // Filter audits for the current user
              for (let i = 0; i < contractHashes.length; i++) {
                if (auditors[i].toLowerCase() === userAddress.toLowerCase()) {
                  allAudits.push({
                    contractHash: contractHashes[i],
                    stars: Number(stars[i]),
                    summary: summaries[i],
                    timestamp: Number(timestamps[i]),
                    chain: chainKey as keyof typeof CHAIN_CONFIG
                  });
  
                  // Update chain counts and total stars
                  chainCounts[chainKey] = (chainCounts[chainKey] || 0) + 1;
                  totalStars += Number(stars[i]);
                }
              }
  
              processed += contractHashes.length;
            } catch (batchError) {
              console.error(`Error fetching batch at ${processed} from ${chainKey}:`, batchError);
              break;
            }
          }
        } catch (chainError) {
          console.error(`Error fetching from ${chainKey}:`, chainError);
          chainCounts[chainKey] = 0;
        }
      }
  
      const totalAudits = allAudits.length;
      
      setStats({
        totalAudits,
        averageStars: totalAudits > 0 ? totalStars / totalAudits : 0,
        chainBreakdown: chainCounts,
        recentAudits: allAudits
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
      });
  
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4 mt-20">
            <Wallet size={48} className="text-gray-400" />
            <h2 className="text-2xl font-mono">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your audit profile</p>
            <button
              onClick={async () => {
                try {
                  const { address } = await connectWallet();
                  setAddress(address);
                  await fetchUserStats(address);
                } catch (error) {
                  console.error('Failed to connect wallet:', error);
                }
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all duration-200"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold mb-2">Auditor Profile</h1>
              <div className="flex items-center space-x-2 text-gray-400">
                <span className="font-mono">{address}</span>
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <ArrowSquareOut size={16} />
                </a>
              </div>
            </div>
            <button
              onClick={() => fetchUserStats(address)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              title="Refresh Stats"
            >
              <CircleNotch 
                size={24} 
                className={`text-emerald-400 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CircleNotch size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats Cards */}
            <div className="space-y-8">
              {/* Overall Stats */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-mono mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold">{stats.totalAudits}</div>
                    <div className="text-sm text-gray-400">Total Audits</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-bold">
                        {stats.averageStars.toFixed(1)}
                      </span>
                      <Star weight="fill" className="text-emerald-400" size={20} />
                    </div>
                    <div className="text-sm text-gray-400">Average Rating</div>
                  </div>
                </div>
              </div>

              {/* Chain Distribution */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-mono mb-4">Chain Distribution</h2>
                <div className="space-y-4">
                  {Object.entries(stats.chainBreakdown).map(([chain, count]) => (
                    <div key={chain} className="flex items-center space-x-4">
                      <Image
                        src={CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG].iconPath}
                        alt={CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG].chainName}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span>{CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG].chainName}</span>
                          <span className="text-gray-400">{count} audits</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${(count / stats.totalAudits) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Audits */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-mono mb-4">Recent Audits</h2>
              <div className="space-y-4">
                {stats.recentAudits.map((audit) => (
                  <div
                    key={`${audit.contractHash}-${audit.chain}`}
                    className="bg-gray-800/50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-sm">
                        {audit.contractHash.slice(0, 8)}...{audit.contractHash.slice(-6)}
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            weight={i < audit.stars ? "fill" : "regular"}
                            className={i < audit.stars ? "text-emerald-400" : "text-gray-600"}
                            size={16}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">{audit.summary}</div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={CHAIN_CONFIG[audit.chain].iconPath}
                          alt={CHAIN_CONFIG[audit.chain].chainName}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                        <span>{CHAIN_CONFIG[audit.chain].chainName}</span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(audit.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {stats.recentAudits.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No audits found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}