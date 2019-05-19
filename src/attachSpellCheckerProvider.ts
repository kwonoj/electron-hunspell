import { log } from './util/logger';

/**
 * Interface to spell checker provider proxy can be accessed from renderer process.
 * `attachSpellCheckProvider` will use this proxy to communicate to actual provider.
 */
interface ProviderProxy {
  /**
   * Notify provider to current spellchecker language changed.
   * Provider should handle this for subsequent `spell`, `getSuggestion`, `getSelectedDictionaryLanguage` request.
   */
  onSwitchLanguage: (languageKey: string) => Promise<void>;
  /**
   * Request to check spell for word with currently selected language.
   */
  spell: (text: string) => Promise<boolean>;
  /**
   * Request to get spell suggestion for word with currently selected language.
   */
  getSuggestion: (text: string) => Promise<Readonly<Array<string>>>;
  /**
   * Returns currently selected spellchecker dictionary language.
   */
  getSelectedDictionaryLanguage: () => Promise<string | null>;
}

/**
 * Attach spellchecker callback to current webFrame.
 *
 * @param providerProxy
 */
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
    /**
     * Change language for spellchecker attached to webFrame.
     */
    switchLanguage: (languageKey: string) => {
      webFrame.setSpellCheckProvider(languageKey, spellCheckerCallback);
      return providerProxy.onSwitchLanguage(languageKey);
    },
    /**
     * Teardown webFrame's spellchecker based on current language.
     */
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
