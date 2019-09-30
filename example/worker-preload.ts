import * as fs from 'fs';
import * as path from 'path';
import { attachSpellCheckProvider } from '../src/index';

const init = async () => {
  // For easier example execution without server, creates worker from blob
  const workerFile = fs.readFileSync(path.resolve(__dirname, './worker.bundle.js'), 'utf-8');
  const blob = new Blob([workerFile], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  const worker = new Worker(blobUrl);

  //naive proxy to worker via direct postmessage
  const providerProxy = {
    onSwitchLanguage: (languageKey: string) => {
      return new Promise<void>(res => {
        const responseHandler = (event: MessageEvent) => {
          const { data } = event;
          if (data.type === 'onSwitchLanguageResponse') {
            worker.removeEventListener('message', responseHandler);
            res();
          }
        };

        worker.addEventListener('message', responseHandler);
        worker.postMessage({ type: 'onSwitchLanguage', value: languageKey });
      });
    },
    spell: (text: string) => {
      return new Promise<boolean>(res => {
        const responseHandler = (event: MessageEvent) => {
          const { data } = event;
          if (data.type === 'spellResponse' && data.value.word === text) {
            worker.removeEventListener('message', responseHandler);
            res(data.value.spell);
          }
        };

        worker.addEventListener('message', responseHandler);
        worker.postMessage({ type: 'spell', value: text });
      });
    },
    getSuggestion: (text: string) => {
      return new Promise<Readonly<Array<string>>>(res => {
        const responseHandler = (event: MessageEvent) => {
          const { data } = event;
          if (data.type === 'getSuggestionResponse') {
            worker.removeEventListener('message', responseHandler);
            res(data.value);
          }
        };

        worker.addEventListener('message', responseHandler);
        worker.postMessage({ type: 'getSuggestion', value: text });
      });
    },
    addWord: (text: string) => {
      return new Promise<Readonly<Array<string>>>(res => {
        const responseHandler = (event: MessageEvent) => {
          const { data } = event;
          if (data.type === 'addWordResponse') {
            worker.removeEventListener('message', responseHandler);
            res(data.value);
          }
        };

        worker.addEventListener('addWord', responseHandler);
        worker.postMessage({ type: 'addWord', value: text });
      });
    },
    getSelectedDictionaryLanguage: () => {
      return new Promise<string>(res => {
        const responseHandler = (event: MessageEvent) => {
          const { data } = event;
          if (data.type === 'getSelectedDictionaryLanguageResponse') {
            worker.removeEventListener('message', responseHandler);
            res(data.value);
          }
        };

        worker.addEventListener('message', responseHandler);
        worker.postMessage({ type: 'getSelectedDictionaryLanguage' });
      });
    }
  };

  (window as any).provider = providerProxy;

  const attached = await attachSpellCheckProvider(providerProxy);

  setTimeout(async () => attached.switchLanguage('en'), 3000);
};

init();
