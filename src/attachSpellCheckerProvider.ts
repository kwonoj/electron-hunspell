import { log } from './util/logger';
interface ProviderProxy {
  spell: (languageKey: string, text: string) => Promise<boolean>;
  getSuggestion: (languageKey: string, text: string) => Promise<Readonly<Array<string>>>;
}

const attachSpellCheckProvider = async (providerProxy: ProviderProxy) => {
  const { webFrame }: { webFrame: typeof import('electron').webFrame } = require('electron'); //tslint:disable-line:no-var-requires no-require-imports

  if (!webFrame) {
    throw new Error(`attach: Cannot lookup webFrame to set spell checker provider`);
  }

  let currentLanguageKey: string | null = null;

  const spellCheckerCallback = {
    spellCheck: (words: Array<string>, completionCallback: (misspeltWords: string[]) => void) => {
      if (!currentLanguageKey) {
        completionCallback([]);
        return;
      }

      const wordsCheckSpell = words.map(word =>
        providerProxy.spell(currentLanguageKey!, word).then(isCorrectSpell => (isCorrectSpell ? null : word))
      );
      Promise.all(wordsCheckSpell).then(
        results => completionCallback(results.filter((word => !!word) as (w: any) => w is string)),
        error => log.error(`spellCheckerCallback: failed to check spell`, error)
      );
    }
  };

  return {
    switchLanguage: (languageKey: string) => {
      currentLanguageKey = languageKey;
      webFrame.setSpellCheckProvider(currentLanguageKey, spellCheckerCallback);
    },

    unsubscribe: () => {
      if (currentLanguageKey) {
        webFrame.setSpellCheckProvider(currentLanguageKey, {
          spellCheck: (_, cb) => cb([])
        });
        currentLanguageKey = null;
      }
    }
  };
};

export { ProviderProxy, attachSpellCheckProvider };
