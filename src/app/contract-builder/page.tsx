"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  FileCode,
  Robot,
  CircleNotch,
  Copy,
  Check,
} from 'phosphor-react';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export default function ContractBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customFeatures, setCustomFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractParams, setContractParams] = useState<Record<string, string>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    } else {
      setContractParams({});
      setGeneratedCode('');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const generateContract = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `You are an expert Solidity developer. Generate a secure and optimized smart contract based on these requirements:

      Template: ${selectedTemplate.name}
      Base Code: ${selectedTemplate.baseCode || 'Create new contract'}
      Custom Features: ${customFeatures || 'Standard features'}
      Parameters: ${JSON.stringify(contractParams)}

      Requirements:
      1. Use Solidity version 0.8.19
      2. Include comprehensive NatSpec documentation
      3. All OpenZeppelin imports should use @openzeppelin/contracts
      4. Add proper access control and safety checks
      5. Include events for all important state changes
      6. Add gas optimizations
      7. Must be fully deployable
      8. Include clear error messages

      ${customFeatures ? `Additional Features to implement:
      ${customFeatures}` : ''}

      Important:
      - Keep the core functionality of the base template
      - Add requested custom features seamlessly
      - Ensure all OpenZeppelin imports are correct
      - Add proper events for new features
      - Include input validation
      - Add clear error messages
      - Follow security best practices

      Return ONLY the complete contract code without any extra text or markdown.`;

      const result = await model.generateContent(prompt);
      const cleanCode = result.response.text()
        .replace(/```solidity\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();
      
      setGeneratedCode(cleanCode);
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate contract. Please try again.');
      if (selectedTemplate.baseCode) {
        setGeneratedCode(selectedTemplate.baseCode);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold mb-4">Smart Contract Builder</h1>
          <p className="text-gray-400">Generate secure and customized smart contracts with AI assistance</p>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[700px] flex flex-col">
            <div 
              className="flex-1 bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect"
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`
              } as React.CSSProperties}
            >
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Robot className="text-emerald-400" size={20} />
                <span className="font-mono">Contract Templates</span>
              </div>
              
              <div className="p-4 space-y-4 h-[calc(100%-60px)] overflow-auto custom-scrollbar">
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 text-left
                      ${selectedTemplate?.name === template.name
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-800 hover:border-emerald-500/50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-emerald-400">{template.icon}</div>
                      <span className="font-semibold">{template.name}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}

                {selectedTemplate && (
                  <div className="space-y-4 mt-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="font-mono text-sm mb-4">Contract Parameters</h3>
                      {Object.entries(contractParams).map(([key, value]) => (
                        <div key={key} className="mb-3">
                          <label className="text-sm text-gray-400 mb-1 block">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setContractParams(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            className="w-full bg-gray-900 rounded-lg border border-gray-700 p-2"
                          />
                        </div>
                      ))}
                      <div className="mt-4">
                        <label className="text-sm text-gray-400 mb-1 block">
                          Custom Features
                        </label>
                        <textarea
                          value={customFeatures}
                          onChange={(e) => setCustomFeatures(e.target.value)}
                          placeholder="Describe additional features..."
                          className="w-full h-24 bg-gray-900 rounded-lg border border-gray-700 p-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generateContract}
              disabled={!selectedTemplate || isGenerating}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isGenerating || !selectedTemplate
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-black hover-gradient-effect'
              }`}
            >
              {isGenerating ? (
                <>
                  <CircleNotch className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Robot size={20} />
                  Generate Contract
                </>
              )}
            </button>
          </div>

          <div className="h-[700px]">
            <div className="h-full bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileCode className="text-emerald-400" size={20} />
                  <span className="font-mono">Generated Contract</span>
                </div>
                {generatedCode && (
                  <button
                    onClick={() => copyToClipboard(generatedCode)}
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                  >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>

              <div className="h-[calc(100%-60px)] overflow-auto p-6">
                {generatedCode ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap">{generatedCode}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Robot size={48} className="mb-4" />
                    <p>Select a template and generate your contract to see the code here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}