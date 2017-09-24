import * as path from 'path';
import { enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);

const init = async () => {
  const browserWindowProvider = new SpellCheckerProvider();
  (window as any).browserWindowProvider = browserWindowProvider;
  await browserWindowProvider.loadDictionary(
    'en',
    path.join(path.resolve('./'), 'en-US.dic'),
    path.join(path.resolve('./'), 'en-US.aff')
  );

  browserWindowProvider.switchDictionary('en');
};

init();
