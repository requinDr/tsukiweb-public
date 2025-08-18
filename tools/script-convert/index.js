// Import the 'main' function from each module.
import { main as runTsukihime } from './tsukihime.js';
import { main as runPlusDisc } from './plus_disc.js';

async function runAll() {
    try {
        console.log('--- Starting tsukihime.js ---');
        await runTsukihime();

        console.log('\n--- Starting plus_disc.js ---');
        await runPlusDisc();

        console.log('\n--- Both scripts finished successfully. ---');
    } catch (error) {
        console.error('An error occurred during execution:', error);
    }
}

// Execute the main orchestrating function.
runAll()