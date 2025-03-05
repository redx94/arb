import * as ArbitrageEngineModule from './src/utils/arbitrage/arbitrageEngine.js';
import { Logger } from './src/utils/monitoring.ts';

const ArbitrageEngine = ArbitrageEngineModule.ArbitrageEngine;
const logger = Logger.getInstance();
const arbitrageEngine = ArbitrageEngine.getInstance();

async function main() {
  console.log('run-arbitrage.ts: main() function called'); // Added console log
  logger.info('Starting arbitrage engine...');
  arbitrageEngine.start();
  console.log('run-arbitrage.ts: arbitrageEngine.start() called'); // Added console log

  // Keep the script running to allow the engine to process price updates
  process.on('SIGINT', () => {
    logger.info('Stopping arbitrage engine...');
    arbitrageEngine.stop();
    process.exit(0);
  });

  logger.info('Arbitrage engine started and listening for price updates.');
  console.log('run-arbitrage.ts: Arbitrage engine started message logged'); // Added console log
}

main().catch(err => {
  logger.error('Error starting arbitrage engine:', err);
});
