import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { configManager } from "./utils/config";
import { GlobalErrorBoundary } from "./utils/errorBoundary";
import { Logger } from "./utils/monitoring";

const logger = Logger.getInstance();

// Initialize configuration
const initApp = async () => {
  try {
    // Initialize with local network for development
    await configManager.initialize("local");

    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    logger.error("Failed to initialize app:", error as Error);
  }
};

initApp();