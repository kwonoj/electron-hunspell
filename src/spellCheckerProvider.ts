import { Hunspell, HunspellFactory, loadModule } from 'hunspell-asm';
import sortBy = require('lodash.sortby'); //tslint:disable-line:no-var-requires no-require-imports
import * as path from 'path';
import * as unixify from 'unixify';

const isArrayBuffer = (value: any) => value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;

interface SpellChecker {
  affPath: string;
  dicPath: string;
  spellChecker: Hunspell;
  uptime: number;
}

class SpellCheckerProvider {
  private hunspellFactory: HunspellFactory;
  private spellCheckerTable: { [x: string]: SpellChecker } = {};

  private currentSpellCheckerKey: string | null = null;

  private currentSpellCheckerStartTime: number | null = null;

  /**
   * Create provider instance of hunspell.
   * Provider manages general behavior of hunspell,
   * such as loading dictionary instance, attaching spellchecker, and switching languages.
   *
   * @param {number} maxDictionaryCount number of dictionary provider can hold without unloading it.
   * If provider already loaded number of dictionary and asked to load additional one, least used dictionary will be unloaded.
   * 1 by default.
   */
  constructor(private readonly maxDictionaryCount = 1) {}

  public attach(): void {
    throw new Error('not implemented');
  }

  public switchDictionary(key: string): void {
    if (!this.spellCheckerTable[key]) {
      throw new Error(`Spellchecker dictionary for ${key} is not available, ensure dictionary loaded`);
    }

    if (!!this.currentSpellCheckerStartTime) {
      const upTime = Date.now() - this.currentSpellCheckerStartTime;
      this.spellCheckerTable[this.currentSpellCheckerKey!].uptime += upTime;
    }

    this.currentSpellCheckerStartTime = Date.now();
    this.currentSpellCheckerKey = key;
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
      ? this.mountBufferDictionary(dic as ArrayBufferView, aff as ArrayBufferView)
      : this.mountFileDictionary(dic as string, aff as string);

    this.assignSpellchecker(key, mounted.mountedAffPath, mounted.mountedDicPath);
  }

  private invalidateLoadedDictionary(): void {
    const keys = Object.keys(this.spellCheckerTable);
    const unloadCount = keys.length - this.maxDictionaryCount;

    const dicts = sortBy(
      keys.map(key => ({ key, value: this.spellCheckerTable[key] })),
      checker => checker.value.uptime
    ).slice(0, unloadCount);

    dicts.forEach(dict => {
      const { value, key } = dict;
      value.spellChecker.dispose();
      this.hunspellFactory.unmount(value.affPath);
      this.hunspellFactory.unmount(value.dicPath);
      delete this.spellCheckerTable[key];

      if (this.currentSpellCheckerKey === key) {
        this.currentSpellCheckerKey = null;
      }
    });
  }

  private async loadAsmModule(): Promise<void> {
    if (!!this.hunspellFactory) {
      return;
    }

    this.hunspellFactory = await loadModule();
  }

  private mountBufferDictionary(dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView) {
    const factory = this.hunspellFactory;

    const mountedAffPath = factory.mountBuffer(affBuffer);
    const mountedDicPath = factory.mountBuffer(dicBuffer);

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
      spellChecker: factory.create(affPath, dicPath),
      uptime: 0
    };

    if (!!this.currentSpellCheckerKey) {
      this.switchDictionary(key);
    }
  }
}

export { SpellCheckerProvider };
