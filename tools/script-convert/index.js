import { main as runTsukihime } from './tsukihime.js';
import { main as runPlusDisc } from './plus_disc.js';

function main() {
    try {
        console.log('--- Starting tsukihime.js ---')
        runTsukihime()

        console.log('\n--- Starting plus_disc.js ---')
        runPlusDisc()

        console.log('\n--- Both scripts finished successfully. ---')
    } catch (error) {
        console.error('An error occurred during execution:', error)
    }
}

main()