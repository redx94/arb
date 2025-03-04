import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { configManager } from "./utils/config/index.js";
import { GlobalErrorBoundary } from "./utils/errorBoundary.js";
import { Logger } from "./utils/monitoring/index.js";
import { walletManager } from "./utils/wallet.js"; // Import walletManager
const logger = Logger.getInstance();
// Initialize configuration and wallet
const initApp = async () => {
    try {
        // Initialize with local network for development
        await configManager.initialize("local");
        // Configure live provider and private key
        const providerUrl = process.env.PROVIDER_URL;
        const privateKey = process.env.PRIVATE_KEY;
        if (!providerUrl || !privateKey) {
            logger.warn("PROVIDER_URL or PRIVATE_KEY not found in .env. Using default mock provider.");
        }
        else {
            walletManager.setLiveProvider(providerUrl);
            await walletManager.createWallet(privateKey); // Import wallet with private key
            logger.info("Live provider configured and wallet imported.");
        }
        createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(GlobalErrorBoundary, { children: _jsx(App, {}) }) }));
    }
    catch (error) {
        logger.error("Failed to initialize app:", error);
    }
};
initApp();
