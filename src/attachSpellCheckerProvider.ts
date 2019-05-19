import { log } from './util/logger';

interface ProviderProxy {
  spell: (text: string) => Promise<boolean>;
  getSuggestion: (text: string) => Promise<Readonly<Array<string>>>;
  onSwitchLanguage: (languageKey: string) => Promise<void>;
  getSelectedDictionaryLanguage: () => Promise<string | null>;
}

const attachSpellCheckProvider = async (providerProxy: ProviderProxy) => {
  const { webFrame }: { webFrame: typeof import('electron').webFrame } = require('electron'); //tslint:disable-line:no-var-requires no-require-imports

  if (!webFrame) {
    throw new Error(`attach: Cannot lookup webFrame to set spell checker provider`);
  }

  const spellCheckerCallback = {
    spellCheck: async (words: Array<string>, completionCallback: (misspeltWords: string[]) => void) => {
      try {
        const spellCheckResult = await Promise.all(
          words.map(word => providerProxy.spell(word).then(isCorrectSpell => (isCorrectSpell ? null : word)))
        );

        completionCallback(spellCheckResult.filter((word => !!word) as (w: any) => w is string));
      } catch (error) {
        log.error(`spellCheckerCallback: unexpected error occurred ${error.message}`, error);
      }
    }
  };

  return {
    switchLanguage: (languageKey: string) => {
      webFrame.setSpellCheckProvider(languageKey, spellCheckerCallback);
      return providerProxy.onSwitchLanguage(languageKey);
    },

    unsubscribe: async () => {
      const currentLanguageKey = await providerProxy.getSelectedDictionaryLanguage();
      if (currentLanguageKey) {
        webFrame.setSpellCheckProvider(currentLanguageKey, {
          spellCheck: (_, cb) => cb([])
        });
      }
    }
  };
};

export { ProviderProxy, attachSpellCheckProvider };
