import { ENVIRONMENT } from 'hunspell-asm';
import * as path from 'path';
import { enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserViewProvider = new SpellCheckerProvider();

  (window as any).browserViewProvider = browserViewProvider;
  await browserViewProvider.initialize({ environment: ENVIRONMENT.NODE });

  await browserViewProvider.loadDictionary(
    'en',
    path.join(path.resolve('./'), 'en-US.dic'),
    path.join(path.resolve('./'), 'en-US.aff')
  );
  setTimeout(async () => browserViewProvider.onSwitchLanguage('en'), 3000);
};

init();
