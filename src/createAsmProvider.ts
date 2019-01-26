import { loadAsmModule } from 'hunspell-asm';
import { SpellCheckerProvider } from './spellCheckerProvider';

/**
 * Create instance of SpellCheckerProvider with asm binary of hunspell.
 */
const createAsmProvider = () => new SpellCheckerProvider(loadAsmModule);

export { createAsmProvider };
