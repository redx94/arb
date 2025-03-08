import React, { useState } from 'react';
import SecurityAnalysis from './components/SecurityAnalysis.js';

const App = () => {
  const [analysisResult, setAnalysisResult] = useState('');

  const handleAnalyze = async (contractName: string) => {
    console.log(`Analyzing ${contractName} for vulnerabilities...`);
    // Simulate analysis - replace with actual logic later
    const result = `Security analysis of ${contractName} completed. No critical vulnerabilities found (simulated).`;
    setAnalysisResult(result);
  };

  return (
    <div>
      <h1>Quantum-Enhanced Arbitrage System</h1>
      <SecurityAnalysis contractName="ArbTrader.sol" onAnalyze={handleAnalyze} />
      {analysisResult && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h2>Security Analysis Result:</h2>
          <p>{analysisResult}</p>
        </div>
      )}
    </div>
  );
};

export default App;
