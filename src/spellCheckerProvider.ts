class SpellCheckerProvider {
  /**
   * Create provider instance of hunspell.
   * Provider manages general behavior of hunspell,
   * such as loading dictionary instance, attaching spellchecker, and switching languages.
   *
   * @param {number} maxDictionary number of dictionary provider can hold without unloading it.
   * If provider already loaded number of dictionary and asked to load additional one, least used dictionary will be unloaded.
   * 1 by default.
   */
  constructor() {
    //noop
  }

  public loadDictionary(_dicBuffer: ArrayBufferView, _affBuffer: ArrayBufferView): void;
  public loadDictionary(_dicPath: string, _affPath: string): void;
  public loadDictionary(_dic: string | ArrayBufferView, _aff: string | ArrayBufferView): void {
    throw new Error('not implemented');
  }
}

export { SpellCheckerProvider };
