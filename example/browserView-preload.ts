import { ENVIRONMENT } from 'hunspell-asm';
import * as path from 'path';
import { createAsmProvider, enableLogger } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserViewProvider = createAsmProvider();

  (window as any).browserViewProvider = browserViewProvider;
  await browserViewProvider.initialize({ environment: ENVIRONMENT.NODE });

  await browserViewProvider.loadDictionary(
    'en',
    path.join(path.resolve('./'), 'en-US.dic'),
    path.join(path.resolve('./'), 'en-US.aff')
  );
  setTimeout(async () => browserViewProvider.switchDictionary('en'), 3000);
};

init();
