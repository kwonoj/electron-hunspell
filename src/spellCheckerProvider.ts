import ElectronType = require('electron'); //tslint:disable-line:no-var-requires no-require-imports
import { Hunspell, HunspellFactory, loadModule } from 'hunspell-asm';
import orderBy = require('lodash.orderby'); //tslint:disable-line:no-var-requires no-require-imports
import * as path from 'path';
import * as unixify from 'unixify';
import { log } from './util/logger';

/**
 * Check if given object is ArrayBufferView.
 * @param {any} value object to check.
 */
const isArrayBuffer = (value: any) => value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;

/**
 * @internal
 * Spell checker instance corresponds to each loaded dictionary.
 */
interface SpellChecker {
  spellChecker: Hunspell;
  uptime: number;
  dispose: () => void;
}

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

  /**
   * Holds ref count of physical mount path to unmount only there isn't ref anymore.
   * multiple aff / dic can be placed under single directory, which will create single directory mount point -
   * unmonuting it immediately will makes other dictionary unavailable. Instead, counts ref and only unmount when
   * last dictionary unmounted.
   */
  private fileMountRefCount = {};

  private currentSpellCheckerStartTime: number | null = null;

  public switchDictionary(key: string): void {
    if (!this.spellCheckerTable[key]) {
      throw new Error(`Spellchecker dictionary for ${key} is not available, ensure dictionary loaded`);
    }

    log.info(
      `switchDictionary: switching dictionary to check spell from '${this._currentSpellCheckerKey}' to '${key}'`
    );

    if (!!this.currentSpellCheckerStartTime) {
      const upTime = Date.now() - this.currentSpellCheckerStartTime;
      const currentKey = this._currentSpellCheckerKey;
      if (!!currentKey) {
        this.spellCheckerTable[currentKey].uptime += upTime;
        log.info(`switchDictionary: total uptime for '${currentKey}' '${this.spellCheckerTable[currentKey].uptime}'`);
      }
    }

    this.currentSpellCheckerStartTime = Date.now();
    this._currentSpellCheckerKey = key;
    this.attach(key);
  }

  public async loadDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView): Promise<void>;
  public async loadDictionary(key: string, dicPath: string, affPath: string): Promise<void>;
  public async loadDictionary(
    key: string,
    dic: string | ArrayBufferView,
    aff: string | ArrayBufferView
  ): Promise<void> {
    await this.loadAsmModule();

    const isBufferDictionary = isArrayBuffer(dic) && isArrayBuffer(aff);
    const isFileDictionary = typeof dic === 'string' && typeof aff === 'string';

    if (!isBufferDictionary && !isFileDictionary) {
      throw new Error('Cannot load dictionary for given parameters');
    }

    const mounted = isBufferDictionary
      ? this.mountBufferDictionary(dic as ArrayBufferView, aff as ArrayBufferView)
      : this.mountFileDictionary(dic as string, aff as string);

    this.assignSpellchecker(key, mounted);
  }

  public unloadDictionary(key: string): void {
    if (!!this._currentSpellCheckerKey && this._currentSpellCheckerKey === key) {
      this._currentSpellCheckerKey = null;

      log.warn(`unloadDictionary: unload dictionary for current spellchecker instance`);
      this.setProvider(key, () => true);
    }

    const dict = this.spellCheckerTable[key];
    dict.dispose();

    delete this.spellCheckerTable[key];
  }

  private attach(key: string): void {
    if (!key) {
      log.warn(`attach: Spellchecker langauge key is not set, will not lookup provider instance`);
      return;
    }

    const checker = this.spellCheckerTable[key];
    if (!checker) {
      log.error(`attach: There isn't corresponding dictionary for key '${key}'`);
      return;
    }

    this.setProvider(key, checker.spellChecker.spell);
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

  private async loadAsmModule(): Promise<void> {
    if (!!this.hunspellFactory) {
      return;
    }

    log.info(`loadAsmModule: loading hunspell-asm module`);
    this.hunspellFactory = await loadModule();
    log.info(`loadAsmModule: asm module loaded successfully`);
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
      const dir = path.basename(filePath);
      this.fileMountRefCount[dir] = !!this.fileMountRefCount[dir] ? this.fileMountRefCount[dir] + 1 : 1;

      log.debug(`increaseRefCount: refCount set for '${dir}' to '${this.fileMountRefCount[dir]}'`);
    };

    const decreaseRefCount = (filePath: string) => {
      const dir = path.basename(filePath);
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
          factory.unmount(p);
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
