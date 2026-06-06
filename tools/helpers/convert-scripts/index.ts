import { main as runTH } from './processing/scenes.ts';
import { main as runTsLogic } from './processing/logic.ts';
import { main as runPlusDisc } from './plus_disc.ts';

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