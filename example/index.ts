import * as path from 'path';
import { enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console.log.bind(console));

const init = async () => {
  const provider = new SpellCheckerProvider();
  await provider.loadDictionary('ko', path.join(path.resolve('./'), 'ko.dic'), path.join(path.resolve('./'), 'ko.aff'));

  provider.switchDictionary('ko');
};

init();
