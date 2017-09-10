import { HunspellFactory, loadModule } from 'hunspell-asm';
import * as path from 'path';
import * as unixify from 'unixify';

const isArrayBuffer = (value: any) => value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;

interface SpellChecker {}

class SpellCheckerProvider {
  private hunspellFactory: HunspellFactory;
  private spellCheckerTable: { [x: string]: SpellChecker } = {};

  private currentSpellcheckerKey: string;

  /**
   * Create provider instance of hunspell.
   * Provider manages general behavior of hunspell,
   * such as loading dictionary instance, attaching spellchecker, and switching languages.
   *
   * @param {number} maxDictionaryCount number of dictionary provider can hold without unloading it.
   * If provider already loaded number of dictionary and asked to load additional one, least used dictionary will be unloaded.
   * 1 by default.
   */
  constructor(private readonly maxDictionaryCount = 1) {
    //noop
  }

  public attach(): void {
    throw new Error('not implemented');
  }

  public switchDictionary(key: string): void {
    if (!this.spellCheckerTable[key]) {
      throw new Error(`Spellchecker dictionary for ${key} is not available`);
    }

    this.currentSpellcheckerKey = key;
  }

  public async loadDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView): Promise<void>;
  public async loadDictionary(key: string, dicPath: string, affPath: string): Promise<void>;
  public async loadDictionary(
    key: string,
    dic: string | ArrayBufferView,
    aff: string | ArrayBufferView
  ): Promise<void> {
    await this.loadAsmModule();

    this.invalidateLoadedDictionary();

    const isBufferDictionary = isArrayBuffer(dic) && isArrayBuffer(aff);
    const isFileDictionary = typeof dic === 'string' && typeof aff === 'string';

    if (!isBufferDictionary && !isFileDictionary) {
      throw new Error('Cannot load dictionary for given parameters');
    }

    const mounted = isBufferDictionary
      ? this.mountBufferDictionary(key, dic as ArrayBufferView, aff as ArrayBufferView)
      : this.mountFileDictionary(dic as string, aff as string);

    this.assignSpellchecker(key, mounted.mountedAffPath, mounted.mountedDicPath);
  }

  private invalidateLoadedDictionary(): void {
    const keys = Object.keys(this.spellCheckerTable);
    if (keys.length >= this.maxDictionaryCount) {
      throw new Error('not implemented');
    }
  }

  private async loadAsmModule(): Promise<void> {
    if (!!this.hunspellFactory) {
      return;
    }

    this.hunspellFactory = await loadModule();
  }

  private mountBufferDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView) {
    const factory = this.hunspellFactory;

    const mountedAffPath = factory.mountBuffer(affBuffer, `${key}.aff`);
    const mountedDicPath = factory.mountBuffer(dicBuffer, `${key}.dic`);

    return {
      mountedAffPath,
      mountedDicPath
    };
  }

  private mountFileDictionary(dicFilePath: string, affFilePath: string) {
    const factory = this.hunspellFactory;

    const affFilename = path.basename(affFilePath);
    const affDir = path.dirname(affFilePath);

    const dicFilename = path.basename(dicFilePath);
    const dicDir = path.dirname(dicFilePath);

    const mountedAffDir = factory.mountDirectory(affDir);
    const mountedDicDir = factory.mountDirectory(dicDir);

    const mountedAffPath = unixify(path.join(mountedAffDir, affFilename));
    const mountedDicPath = unixify(path.join(mountedDicDir, dicFilename));

    return {
      mountedAffPath,
      mountedDicPath
    };
  }

  private assignSpellchecker(key: string, affPath: string, dicPath: string) {
    const factory = this.hunspellFactory;

    this.spellCheckerTable[key] = {
      affPath,
      dicPath,
      spellChecker: factory.create(affPath, dicPath)
    };
  }
}

export { SpellCheckerProvider };
