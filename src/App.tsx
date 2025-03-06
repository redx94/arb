import React from 'react';
import SecurityAnalysis from './components/SecurityAnalysis.js';

const App = () => {
  const handleAnalyze = async (contractName: string) => {
    // Placeholder for actual analysis logic
    console.log(`Analyzing ${contractName} for vulnerabilities...`);
  };

  return (
    <div>
      <h1>Hello World</h1>
      <SecurityAnalysis contractName="ArbTrader.sol" onAnalyze={handleAnalyze} />
    </div>
  );
};

export default App;
