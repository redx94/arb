import { GasOptimizer } from './dist/utils/gas/GasOptimizer.js';

async function main() {
  const gasOptimizer = GasOptimizer.getInstance();
  console.log('GasOptimizer instance created:', gasOptimizer);
}

main();
