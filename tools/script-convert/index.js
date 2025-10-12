import { main as runTsukihime } from './tsukihime.js';
import { main as runPlusDisc } from './plus_disc.js';

function main() {
    try {
        console.log('--- Starting scenes generation ---\n')

        runTsukihime()

        runPlusDisc()

        console.log('\n--- Scenes generated ---')
    } catch (error) {
        console.error('An error occurred during execution:', error)
    }
}

main()