"use client"

import React, { JSX, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  FileCode, 
  Robot, 
  CircleNotch, 
  Copy, 
  Check,
  TestTube,
  Code
} from 'phosphor-react';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

type TestFramework = 'hardhat' | 'foundry' | 'remix';

interface TestingOption {
  id: TestFramework;
  name: string;
  description: string;
  icon: JSX.Element;
  features: string[];
}

const TESTING_OPTIONS: TestingOption[] = [
  {
    id: 'hardhat',
    name: 'Hardhat Tests',
    description: 'Generate JavaScript/TypeScript tests using Hardhat and Chai',
    icon: <TestTube size={24} />,
    features: [
      'JavaScript/TypeScript',
      'Chai assertions',
      'Ethers.js integration',
      'Gas reporting'
    ]
  },
  {
    id: 'foundry',
    name: 'Foundry Tests',
    description: 'Generate Solidity-based tests using Foundry framework',
    icon: <Code size={24} />,
    features: [
      'Solidity native',
      'Fuzzing support',
      'Gas optimization',
      'Fast execution'
    ]
  },
  {
    id: 'remix',
    name: 'Remix Manual Tests',
    description: 'Generate step-by-step manual testing instructions for Remix IDE',
    icon: <FileCode size={24} />,
    features: [
      'GUI-based testing',
      'No setup required',
      'Interactive steps',
      'Visual verification'
    ]
  }
];

export default function TestCaseGenerator() {
  const [contractCode, setContractCode] = useState('');
  const [generatedTests, setGeneratedTests] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<TestFramework>('hardhat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getPromptForFramework = (code: string, framework: TestFramework) => {
    const basePrompt = `You are an expert in smart contract testing. Generate comprehensive test cases for the following smart contract:

Contract code:
${code}

Requirements:
- Test all main contract functions
- Include edge cases and error conditions
- Test access control
- Verify state changes
- Check event emissions
- Add gas optimization checks where relevant`;

    const frameworkSpecific = {
      hardhat: `
Additional Requirements:
- Use Hardhat and Chai with latest practices
- Include complete test setup with TypeScript
- Add proper describe/it blocks
- Include deployment scripts
- Add comprehensive assertions
- Include gas usage reporting
Return ONLY the complete test file code without any extra text.`,

      foundry: `
Additional Requirements:
- Use Foundry's Solidity testing framework
- Include setUp() function
- Use forge std assertions
- Add fuzzing where appropriate
- Include proper test annotations
- Add gas optimization tests
Return ONLY the complete test file code without any extra text.`,

      remix: `
Additional Requirements:
- Create step-by-step manual testing instructions
- Include specific input values to test
- Add expected outcomes for each step
- Include verification steps
- Add troubleshooting notes
- Include deployment instructions
Return a structured list of testing steps without any extra text.`
    };

    return basePrompt + frameworkSpecific[framework];
  };

  const generateTests = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code to generate tests');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = getPromptForFramework(contractCode, selectedFramework);

      const result = await model.generateContent(prompt);
      const cleanCode = result.response.text()
        .replace(/```[a-z]*\n/g, '')
        .replace(/```/g, '')
        .replace(/\*/g, '')
        .trim();
      
      setGeneratedTests(cleanCode);
    } catch (error) {
      console.error('Test generation failed:', error);
      setError('Failed to generate test cases. Please try again.');
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
          <h1 className="text-3xl font-mono font-bold mb-4">Test Case Generator</h1>
          <p className="text-gray-400">Generate comprehensive test cases for your smart contracts using different testing frameworks</p>
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
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {TESTING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedFramework(option.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left h-full
                    ${selectedFramework === option.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 hover:border-emerald-500/50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-emerald-400">{option.icon}</div>
                    <span className="font-semibold">{option.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{option.description}</p>
                </button>
              ))}
            </div>

            <div 
              className="h-[600px] bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect"
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`
              } as React.CSSProperties}
            >
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Code className="text-emerald-400" size={20} />
                <span className="font-mono">Contract Code</span>
              </div>
              
              <textarea
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="Paste your smart contract code here..."
                className="w-full h-[calc(100%-60px)] bg-transparent p-6 font-mono text-sm resize-none focus:outline-none"
              />
            </div>
          </div>

          <div className="h-[700px] flex flex-col">
            <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-800 hover-gradient-effect">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TestTube className="text-emerald-400" size={20} />
                  <span className="font-mono">Generated {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}</span>
                </div>
                {generatedTests && (
                  <button
                    onClick={() => copyToClipboard(generatedTests)}
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                  >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>

              <div className="h-[calc(100%-60px)] overflow-auto p-6">
                {generatedTests ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap">{generatedTests}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TestTube size={48} className="mb-4" />
                    <p>Select a framework, enter your contract code, and generate tests</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generateTests}
              disabled={!contractCode || isGenerating}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isGenerating || !contractCode
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-black hover-gradient-effect'
              }`}
            >
              {isGenerating ? (
                <>
                  <CircleNotch className="animate-spin" size={20} />
                  Generating {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}...
                </>
              ) : (
                <>
                  <Robot size={20} />
                  Generate {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}