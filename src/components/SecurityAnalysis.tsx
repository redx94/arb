import React, { useState } from 'react';
import { execute_command } from '../utils/tool_utils.ts'; // Assuming you create a tool_utils file

interface SecurityAnalysisProps {
  contractName: string;
  onAnalyze: (contractName: string) => Promise<void>;
}

const SecurityAnalysis: React.FC<SecurityAnalysisProps> = ({ contractName, onAnalyze }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  React.useEffect(() => {
    handleAnalyze();
  }, []);

  const vulnerabilityCategories = [
    { id: 'all', label: 'All Vulnerabilities' },
    { id: 'breach', label: 'Smart Contract Breaches' },
    { id: 'crypto', label: 'Cryptographic Fragilities' },
    { id: 'reentrancy', label: 'Transactional Reentrancy' },
    { id: 'defi', label: 'DeFi Manipulation Vectors' },
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await performSecurityAudit(contractName);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performSecurityAudit = async (contractName: string) => {
    setIsAnalyzing(true);
    setVulnerabilities([]);
    try {
      const command = `solhint --config .solhint.json contracts/${contractName}`;
      const result = await executeCommand(command);
      if (result && result.exitCode === 0) { // Check if result is not null and then access properties
        const parsedVulnerabilities = parseSolhintOutput(result.output);
        setVulnerabilities(parsedVulnerabilities);
      } else {
        console.error('Solhint analysis failed:', result ? result.error : 'Command execution failed'); // Added check for result being null
        setVulnerabilities([`Solhint analysis failed: ${result ? (result.error || 'Unknown error') : 'Command execution failed'}. Please check console for details.`]);
      }
    } catch (error) {
      console.error('Error executing solhint:', error);
      setVulnerabilities(['Error executing security analysis tool.']);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Refactored executeCommand to use the tool
  const executeCommand = async (command: string): Promise<{ exitCode: number; output: string; error: string } | null> => {
    try {
      const executionResult = await execute_command({ command: command, requires_approval: false });
      if (executionResult) {
        return {
          exitCode: 0, // Assuming success if executionResult is not null, adjust as needed based on actual tool response
          output: executionResult.stdout || '',
          error: executionResult.stderr || '',
        };
      } else {
        console.error('Command execution failed, no result returned from tool.');
        return null; // Indicate failure to get a result from the tool
      }
    } catch (error: any) {
      console.error('Command execution error:', error);
      return null; // Indicate command execution failure
    }
  };


  const parseSolhintOutput = (output: string): string[] => {
    const lines = output.split('\n');
    const vulnerabilities: string[] = [];
    for (const line of lines) {
      if (line.includes('Error') || line.includes('Warning')) {
        const parts = line.split(':');
        if (parts.length >= 4) {
          const message = parts.slice(3).join(':').trim();
          vulnerabilities.push(`${parts[0]}:${parts[1]}:${parts[2]} - ${message}`);
        }
      }
    }
    return vulnerabilities;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Smart Contract Security Analysis</h2>
        <p className="mt-2 text-gray-600">Analyzing {contractName || 'ArbTrader.sol'} for security vulnerabilities using Solhint</p>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="h-10 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium transition-all duration-200 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm disabled:opacity-70"
          >
            {isAnalyzing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Run Security Analysis'
            )}
          </button>

          <div className="text-sm text-gray-500">
            {vulnerabilities.length > 0 ? `${vulnerabilities.length} vulnerabilities found` : 'No vulnerabilities detected yet'}
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {vulnerabilityCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-in-out ${
                  activeTab === category.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {vulnerabilities.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {vulnerabilities.map((vulnerability, index) => (
                <li key={index} className="py-4 transition-all duration-200 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{vulnerability}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Severity: High | Impact: Critical | Location: Line ... {/* More detailed location to be added */}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <button className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm px-2 py-1">
                        View Details {/* Placeholder for future detailed view */}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : isAnalyzing ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-pulse rounded-full h-12 w-12 bg-indigo-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="mt-4 text-gray-500">Scanning contract for vulnerabilities...</p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="mt-4 text-gray-500">Run the security analysis to detect vulnerabilities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityAnalysis;
