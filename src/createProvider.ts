import { loadModule } from 'hunspell-asm';
import { SpellCheckerProvider } from './spellCheckerProvider';

/**
 * Create instance of SpellCheckerProvider with wasm binary of hunspell.
 */
const createProvider = () => new SpellCheckerProvider(loadModule);

export { createProvider };
