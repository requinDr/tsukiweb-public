import { main as runTH } from './processing/scenes.js';
import { main as runTsLogic } from './processing/logic.js';
import { main as runPlusDisc } from './plus_disc.js';

async function main() {
    try {
        console.log('--- Starting scenes generation ---\n')
        
        runTsLogic()

        await runTH()

        runPlusDisc()

        console.log('\n--- Scenes generated ---')
    } catch (error) {
        console.error('An error occurred during execution:', error)
    }
}

main()