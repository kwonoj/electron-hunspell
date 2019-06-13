import * as fs from 'fs';
import * as path from 'path';
import { attachSpellCheckProvider, enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserViewProvider = new SpellCheckerProvider();

  (window as any).browserViewProvider = browserViewProvider;
  await browserViewProvider.initialize();

  await browserViewProvider.loadDictionary(
    'en',
    fs.readFileSync(path.join(path.resolve('./example'), 'en-US.dic')),
    fs.readFileSync(path.join(path.resolve('./example'), 'en-US.aff'))
  );

  const attached = await attachSpellCheckProvider(browserViewProvider);

  setTimeout(async () => attached.switchLanguage('en'), 3000);
};

init();
