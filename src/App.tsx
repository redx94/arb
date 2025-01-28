import React from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { GlobalErrorBoundary } from './utils/errorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <Dashboard />
    </GlobalErrorBoundary>
  );
}

export default App;