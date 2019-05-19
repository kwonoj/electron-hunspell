import { ENVIRONMENT } from 'hunspell-asm';
import { enableLogger, SpellCheckerProvider } from '../src/index';

enableLogger(console);
const provider = new SpellCheckerProvider();

const init = async () => {
  await provider.initialize({ environment: ENVIRONMENT.WEB });

  const aff = await (await fetch('https://unpkg.com/hunspell-dict-en-us@0.1.0/en-us.aff')).arrayBuffer();
  const dic = await (await fetch('https://unpkg.com/hunspell-dict-en-us@0.1.0/en-us.dic')).arrayBuffer();

  await provider.loadDictionary('en', new Uint8Array(dic), new Uint8Array(aff));

  self.onmessage = function(event) {
    const response = (type: string, value?: any) => (self.postMessage as any)({ type: `${type}Response`, value });
    const { data } = event;

    switch (data.type) {
      case 'onSwitchLanguage':
        provider.onSwitchLanguage(data.value);
        response(data.type);
        break;
      case 'spell':
        provider.spell(data.value).then(ret => {
          response(data.type, { word: data.value, spell: ret });
        });
        break;
      case 'getSuggestion':
        provider.getSuggestion(data.value).then(suggestion => response(data.type, suggestion));
        break;
      case 'getSelectedDictionaryLanguage':
        provider.getSelectedDictionaryLanguage().then(dict => response(data.type, dict));
        break;
    }
  };
};

init();
