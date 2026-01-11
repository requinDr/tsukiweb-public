import { main as runTsukihime } from './tsukihime_processing/scenes.js';
import { main as runTsLogic } from './tsukihime_processing/logic.js';
import { main as runPlusDisc } from './plus_disc.js';

function main() {
    try {
        console.log('--- Starting scenes generation ---\n')
        
        runTsLogic()

        runTsukihime()

        runPlusDisc()

        console.log('\n--- Scenes generated ---')
    } catch (error) {
        console.error('An error occurred during execution:', error)
    }
}

main()