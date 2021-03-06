import * as fs from 'fs';
import * as path from 'path';
import { attachSpellCheckProvider, enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserWindowProvider = new SpellCheckerProvider();
  (window as any).browserWindowProvider = browserWindowProvider;

  await browserWindowProvider.initialize({});

  await browserWindowProvider.loadDictionary(
    'en',
    fs.readFileSync(path.join(path.resolve('./example'), 'en-US.dic')),
    fs.readFileSync(path.join(path.resolve('./example'), 'en-US.aff'))
  );

  const attached = await attachSpellCheckProvider(browserWindowProvider);
  attached.switchLanguage('en');
};

init();
