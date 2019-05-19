import { ENVIRONMENT } from 'hunspell-asm';
import * as path from 'path';
import { enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserWindowProvider = new SpellCheckerProvider();
  (window as any).browserWindowProvider = browserWindowProvider;
  await browserWindowProvider.initialize({
    environment: ENVIRONMENT.NODE,
    locateBinary: file => {
      if (file.endsWith('.wasm')) {
        return path.resolve('../node_modules/hunspell-asm/dist/cjs/lib/hunspell.wasm');
      }
      return file;
    }
  });

  await browserWindowProvider.loadDictionary(
    'en',
    path.join(path.resolve('./'), 'en-US.dic'),
    path.join(path.resolve('./'), 'en-US.aff')
  );

  browserWindowProvider.onSwitchLanguage('en');
};

init();
