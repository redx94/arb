"use strict";

const ArbitrageEngineModule = require('./src/utils/arbitrage/arbitrageEngine.cjs');
const monitoring_ts_1 = require('./src/utils/monitoring.cjs');
const configManager_1 = require('./src/utils/config/configManager.js');

async function main() {
    console.log('Current working directory:', process.cwd());
    console.log('run-arbitrage.cjs: main() function called');

    const ArbitrageEngine = ArbitrageEngineModule.ArbitrageEngine;
    const logger = monitoring_ts_1.Logger.getInstance();

    try {
        // Initialize configuration
        await configManager_1.configManager.initialize();
        logger.info('ConfigManager initialized successfully.');
    } catch (configError) {
        logger.error('Failed to initialize ConfigManager: ' + String(configError));
        return;
    }

    const arbitrageEngine = ArbitrageEngine.getInstance();

    logger.info('Starting arbitrage engine...');
    arbitrageEngine.start();
    console.log('run-arbitrage.cjs: arbitrageEngine.start() called');

    process.on('SIGINT', function () {
        logger.info('Stopping arbitrage engine...');
        arbitrageEngine.stop();
        console.log('Logs:', logger.getLogs());
        process.exit(0);
    });

    logger.info('Arbitrage engine started and listening for price updates.');
    console.log('run-arbitrage.cjs: Arbitrage engine started message logged');
}

main().catch(err => {
    console.error("Error in main:", err);
});
