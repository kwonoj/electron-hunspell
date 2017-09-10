import { Hunspell, HunspellFactory, loadModule } from 'hunspell-asm';
import orderBy = require('lodash.orderby'); //tslint:disable-line:no-var-requires no-require-imports
import * as path from 'path';
import * as unixify from 'unixify';

const isArrayBuffer = (value: any) => value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;

interface SpellChecker {
  spellChecker: Hunspell;
  uptime: number;
  dispose: () => void;
}

class SpellCheckerProvider {
  private hunspellFactory: HunspellFactory;
  private spellCheckerTable: { [x: string]: SpellChecker } = {};
  public get availableDictionaries(): Readonly<Array<string>> {
    const array = Object.keys(this.spellCheckerTable).map(key => ({ key, uptime: this.spellCheckerTable[key].uptime }));
    return orderBy(array, ['uptime'], ['desc']).map(v => v.key);
  }

  private _currentSpellCheckerKey: string | null = null;
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

  public attach(): void {
    throw new Error('not implemented');
  }

  public switchDictionary(key: string): void {
    if (!this.spellCheckerTable[key]) {
      throw new Error(`Spellchecker dictionary for ${key} is not available, ensure dictionary loaded`);
    }

    if (!!this.currentSpellCheckerStartTime) {
      const upTime = Date.now() - this.currentSpellCheckerStartTime;
      this.spellCheckerTable[this._currentSpellCheckerKey!].uptime += upTime;
    }

    this.currentSpellCheckerStartTime = Date.now();
    this._currentSpellCheckerKey = key;
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
    }

    const dict = this.spellCheckerTable[key];
    dict.dispose();

    delete this.spellCheckerTable[key];
  }

  private async loadAsmModule(): Promise<void> {
    if (!!this.hunspellFactory) {
      return;
    }

    this.hunspellFactory = await loadModule();
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
      this.fileMountRefCount[dir] = !!this.fileMountRefCount[dir] ? this.fileMountRefCount[dir] + 1 : 0;
    };

    const decreaseRefCount = (filePath: string) => {
      const dir = path.basename(filePath);
      if (this.fileMountRefCount[dir] > 0) {
        this.fileMountRefCount[dir] -= 1;
      }

      if (this.fileMountRefCount[dir] === 0) {
        delete this.fileMountRefCount[dir];
      }
      return !!this.fileMountRefCount[dir] ? this.fileMountRefCount[dir] : 0;
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

      spellChecker.dispose();
    };

    this.spellCheckerTable[key] = {
      uptime: 0,
      spellChecker,
      dispose: buffer ? unmountBuffer : unmountFile
    };
  }
}

export { SpellCheckerProvider };
