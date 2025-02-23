import React, { FC } from "react";
import { Dashboard } from "./components/dashboard/Dashboard"; 
import { GlobalErrorBoundary } from "./utils/errorBoundary";

const App: FC = () => {
  return (
    <GlobalErrorBoundary>
      <Dashboard />
    </GlobalErrorBoundary>
  );
};

export default App;
