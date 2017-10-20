import ElectronType = require('electron'); //tslint:disable-line:no-var-requires no-require-imports
import { Hunspell, HunspellFactory, loadModule } from 'hunspell-asm';
import { orderBy } from 'lodash';
import * as path from 'path';
import * as unixify from 'unixify';
import { log } from './util/logger';

/**
 * @internal
 * Spell checker instance corresponds to each loaded dictionary.
 */
interface SpellChecker {
  spellChecker: Hunspell;
  uptime: number;
  dispose: () => void;
}

/**
 * Provides interface to manage spell checker and corresponding dictionaries, as well as attaching into electron's webFrame.
 */
class SpellCheckerProvider {
  private hunspellFactory: HunspellFactory;
  private spellCheckerTable: { [x: string]: SpellChecker } = {};
  /**
   * Returns array of dictionary keys currently loaded.
   * Array is sorted by usage time of dictionary by descending order.
   */
  public get availableDictionaries(): Readonly<Array<string>> {
    const array = Object.keys(this.spellCheckerTable).map(key => ({ key, uptime: this.spellCheckerTable[key].uptime }));
    return orderBy(array, ['uptime'], ['desc']).map(v => v.key);
  }

  private _currentSpellCheckerKey: string | null = null;
  /**
   * Returns currently selected dictionary key.
   */
  public get selectedDictionary(): string | null {
    return this._currentSpellCheckerKey;
  }

  private _verboseLog: boolean = false;
  /**
   * Allow to emit more verbose log.
   */
  public set verboseLog(value: boolean) {
    this._verboseLog = value;
  }

  /**
   * Holds ref count of physical mount path to unmount only there isn't ref anymore.
   * multiple aff / dic can be placed under single directory, which will create single directory mount point -
   * unmonuting it immediately will makes other dictionary unavailable. Instead, counts ref and only unmount when
   * last dictionary unmounted.
   */
  private fileMountRefCount = {};

  private currentSpellCheckerStartTime: number = Number.NEGATIVE_INFINITY;

  /**
   * Initialize provider.
   */
  public async initialize(): Promise<void> {
    if (!!this.hunspellFactory) {
      return;
    }

    log.info(`loadAsmModule: loading hunspell-asm module`);
    this.hunspellFactory = await loadModule();
    log.info(`loadAsmModule: asm module loaded successfully`);
  }

  /**
   * Set current spell checker instance for given locale key then attach into current webFrame.
   * @param {string} key Locale key for spell checker instance.
   */
  public switchDictionary(key: string): void {
    if (!key || !this.spellCheckerTable[key]) {
      throw new Error(`Spellchecker dictionary for ${key} is not available, ensure dictionary loaded`);
    }

    log.info(
      `switchDictionary: switching dictionary to check spell from '${this._currentSpellCheckerKey}' to '${key}'`
    );

    if (Number.isInteger(this.currentSpellCheckerStartTime)) {
      const timePassed = Date.now() - this.currentSpellCheckerStartTime;
      const currentKey = this._currentSpellCheckerKey;
      if (!!currentKey) {
        this.spellCheckerTable[currentKey].uptime += timePassed;
        log.info(`switchDictionary: total uptime for '${currentKey}' - '${this.spellCheckerTable[currentKey].uptime}'`);
      }
    }

    this.currentSpellCheckerStartTime = Date.now();
    this._currentSpellCheckerKey = key;
    this.attach(key);
  }

  /**
   * Get suggestion for misspelled text.
   * @param {string} Text text to get suggstion.
   * @returns {Readonly<Array<string>>} Array of suggested values.
   */
  public getSuggestion(text: string): Readonly<Array<string>> {
    if (!this._currentSpellCheckerKey) {
      log.warn(`getSuggestedWord: there isn't any spellchecker key, bailing`);
      return [];
    }

    const checker = this.spellCheckerTable[this._currentSpellCheckerKey];
    if (!checker) {
      log.error(`attach: There isn't corresponding dictionary for key '${this._currentSpellCheckerKey}'`);
      return [];
    }

    const ret = checker.spellChecker.suggest(text);
    if (this._verboseLog) {
      log.debug(`getSuggestion: '${text}' got suggestions`, ret);
    }
    return ret;
  }

  /**
   * Load specified dictionary into memory, creates hunspell instance for corresponding locale key.
   * @param {string} key Locale key for spell checker instance.
   * @param {string | ArrayBufferView} dicPath Path to physical dictionary, or ArrayBufferView content.
   * @param {string | ArrayBufferView} affPath Path to physical affix, or ArrayBufferView content.
   * @returns {Promise<void>} Indication to load completes.
   */
  public async loadDictionary(key: string, dicPath: string, affPath: string): Promise<void>;
  public async loadDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView): Promise<void>;
  public async loadDictionary(
    key: string,
    dic: string | ArrayBufferView,
    aff: string | ArrayBufferView
  ): Promise<void> {
    if (!key || !!this.spellCheckerTable[key]) {
      throw new Error(`Invalid key: ${!!key ? 'already registered key' : 'key is empty'}`);
    }

    const isBufferDictionary = ArrayBuffer.isView(dic) && ArrayBuffer.isView(aff);
    const isFileDictionary = typeof dic === 'string' && typeof aff === 'string';

    if (!isBufferDictionary && !isFileDictionary) {
      throw new Error('Cannot load dictionary for given parameters');
    }

    const mounted = isBufferDictionary
      ? this.mountBufferDictionary(dic as ArrayBufferView, aff as ArrayBufferView)
      : this.mountFileDictionary(dic as string, aff as string);

    this.assignSpellchecker(key, mounted);
  }

  /**
   * Dispose given spell checker instance and unload dictionary from memory.
   * @param {string} key Locale key for spell checker instance.
   */
  public unloadDictionary(key: string): void {
    if (!key || !this.spellCheckerTable[key]) {
      log.info(`unloadDictionary: not able to find corresponding spellchecker for given key`);
      return;
    }

    if (!!this._currentSpellCheckerKey && this._currentSpellCheckerKey === key) {
      this._currentSpellCheckerKey = null;
      this.currentSpellCheckerStartTime = Number.NEGATIVE_INFINITY;

      log.warn(`unloadDictionary: unload dictionary for current spellchecker instance`);
      this.setProvider(key, () => true);
    }

    const dict = this.spellCheckerTable[key];
    dict.dispose();

    delete this.spellCheckerTable[key];
    log.info(`unloadDictionary: dictionary for '${key}' is unloaded`);
  }

  private attach(key: string): void {
    const checker = this.spellCheckerTable[key];

    const provider = (text: string) => {
      const ret = checker.spellChecker.spell(text);
      if (this._verboseLog) {
        log.debug(`spellChecker: checking spell for '${text}' with '${key}' returned`, ret);
      }
      return ret;
    };
    this.setProvider(key, provider);
  }

  private setProvider(key: string, provider: (text: string) => boolean): void {
    const webFrame: typeof ElectronType.webFrame | null =
      process.type === 'renderer' ? require('electron').webFrame : null; //tslint:disable-line:no-var-requires no-require-imports

    if (!webFrame) {
      log.warn(`attach: Cannot lookup webFrame to set spell checker provider`);
      return;
    }

    webFrame.setSpellCheckProvider(key, true, { spellCheck: provider });
  }

  private mountBufferDictionary(dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView) {
    const factory = this.hunspellFactory;

    return {
      affPath: factory.mountBuffer(affBuffer),
      dicPath: factory.mountBuffer(dicBuffer),
      buffer: true
    };
  }

  private mountFileDictionary(dicFilePath: string, affFilePath: string) {
    const factory = this.hunspellFactory;

    const getMountedPath = (filePath: string) => {
      const mountedDir = factory.mountDirectory(path.dirname(filePath));
      return unixify(path.join(mountedDir, path.basename(filePath)));
    };

    return {
      affPath: getMountedPath(affFilePath),
      dicPath: getMountedPath(dicFilePath),
      buffer: false
    };
  }

  private assignSpellchecker(
    key: string,
    { buffer, affPath, dicPath }: { buffer: boolean; affPath: string; dicPath: string }
  ) {
    const factory = this.hunspellFactory;
    const spellChecker = factory.create(affPath, dicPath);

    const increaseRefCount = (filePath: string) => {
      const dir = path.dirname(filePath);
      this.fileMountRefCount[dir] = !!this.fileMountRefCount[dir] ? this.fileMountRefCount[dir] + 1 : 1;

      log.debug(`increaseRefCount: refCount set for '${dir}' to '${this.fileMountRefCount[dir]}'`);
    };

    const decreaseRefCount = (filePath: string) => {
      const dir = path.dirname(filePath);
      if (this.fileMountRefCount[dir] > 0) {
        this.fileMountRefCount[dir] -= 1;
      }

      if (this.fileMountRefCount[dir] === 0) {
        delete this.fileMountRefCount[dir];
      }

      const refCount = !!this.fileMountRefCount[dir] ? this.fileMountRefCount[dir] : 0;

      log.debug(`decreaseRefCount: refCount set for '${dir}' to '${refCount}'`);
      return refCount;
    };

    if (!buffer) {
      increaseRefCount(affPath);
      increaseRefCount(dicPath);
    }

    const unmountFile = () => {
      const paths = [affPath, dicPath];
      paths.forEach(p => {
        const ref = decreaseRefCount(p);
        if (ref === 0) {
          factory.unmount(path.dirname(p));
        }
      });

      spellChecker.dispose();
    };

    const unmountBuffer = () => {
      factory.unmount(affPath);
      factory.unmount(dicPath);
      log.debug(`unmountBuffer: unmounted buffer `, affPath, dicPath);

      spellChecker.dispose();
      log.debug(`unmountBuffer: disposed hunspell instance for `, key);
    };

    this.spellCheckerTable[key] = {
      uptime: 0,
      spellChecker,
      dispose: buffer ? unmountBuffer : unmountFile
    };

    log.info(`assignSpellchecker: spellCheckerTable added new checker for '${key}'`);
  }
}

export { SpellCheckerProvider };
