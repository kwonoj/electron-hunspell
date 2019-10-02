import { loadModule } from 'hunspell-asm';
import { SpellCheckerProvider } from '../src/spellCheckerProvider';

jest.mock('hunspell-asm');

describe('spellCheckerProvider', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('initialize', () => {
    it('should init factory', async () => {
      const provider = new SpellCheckerProvider();

      await provider.initialize();
      expect((loadModule as jest.Mock<any>).mock.calls).toHaveLength(1);
    });

    it('should inint factory once', async () => {
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockReturnValueOnce({});
      const provider = new SpellCheckerProvider();

      await provider.initialize();
      await provider.initialize();
      expect(loadModuleMock.mock.calls).toHaveLength(1);
    });
  });

  describe('getAvailableDictionaries', () => {
    it('should return empty if dictionaries are not loaded', async () => {
      const provider = new SpellCheckerProvider();
      expect(await provider.getAvailableDictionaries()).toEqual([]);
    });

    it('should return dictionaries sorted by uptime', async () => {
      const provider = new SpellCheckerProvider();
      (provider as any).spellCheckerTable = {
        kr: { uptime: 100 },
        en: { uptime: 80 },
        jp: { uptime: 120 }
      };

      const dict = await provider.getAvailableDictionaries();
      expect(dict).toEqual(['jp', 'kr', 'en']);
    });
  });

  describe('getSelectedDictionaryLanguage', () => {
    it('should return null if not selected', async () => {
      const provider = new SpellCheckerProvider();

      expect(await provider.getSelectedDictionaryLanguage()).toBeNull();
    });

    it('should return currently selected dictionary', async () => {
      const provider = new SpellCheckerProvider();
      (provider as any)._currentSpellCheckerKey = 'kr';

      expect(await provider.getSelectedDictionaryLanguage()).toEqual('kr');
    });
  });

  describe('getSuggestion', () => {
    it('should throw without current checker key', async () => {
      const provider = new SpellCheckerProvider();
      expect(provider.getSuggestion('boo')).rejects.toThrow();
    });

    it('should throw without checker instance', async () => {
      const provider = new SpellCheckerProvider();
      (provider as any)._currentSpellCheckerKey = 'kr';

      expect(provider.getSuggestion('boo')).rejects.toThrow();
    });

    it('should return suggestions', async () => {
      const provider = new SpellCheckerProvider();

      (provider as any)._currentSpellCheckerKey = 'kr';
      (provider as any).spellCheckerTable['kr'] = {
        spellChecker: {
          suggest: jest.fn(() => ['boo', 'meh'])
        }
      };

      const suggestion = await provider.getSuggestion('boo');
      expect(suggestion).toEqual(['boo', 'meh']);
    });
  });

  describe('addWord', () => {
    it('should throw without checker instance', async () => {
      const provider = new SpellCheckerProvider();
      (provider as any)._currentSpellCheckerKey = 'kr';

      expect(provider.addWord('en', 'boo')).rejects.toThrow();
    });

    it('add the word', async () => {
      const provider = new SpellCheckerProvider();

      const spellChecker = {
        addWord: jest.fn()
      };

      (provider as any)._currentSpellCheckerKey = 'kr';
      (provider as any).spellCheckerTable['kr'] = { spellChecker };

      await provider.addWord('kr', 'boo');
      expect(spellChecker.addWord).toHaveBeenCalledWith('boo');
    });
  });

  describe('loadDictionary', async () => {
    it('should throw when key is not valid', async () => {
      const provider = new SpellCheckerProvider();
      expect(provider.loadDictionary(null as any, 'a' as any, new Int32Array(1) as any)).rejects.toThrow();
    });

    it('should throw when key is already registered', async () => {
      const mockCreate = jest.fn();
      const mockMountBuffer = jest.fn(() => 'boo');
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountBuffer: mockMountBuffer,
        create: mockCreate
      }));

      const provider = new SpellCheckerProvider();
      await provider.initialize();
      let thrown = false;

      try {
        await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
        await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
      } catch (e) {
        thrown = true;
      }

      expect(thrown).toEqual(true);
    });

    it('should throw when dictionary is not valid', async () => {
      const provider = new SpellCheckerProvider();
      expect(provider.loadDictionary('k', 'a' as any, new Int32Array(1) as any)).rejects.toThrow();
    });

    it('should load buffer dictionary', async () => {
      const mockCreate = jest.fn();
      const mockMountBuffer = jest.fn(() => 'boo');
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountBuffer: mockMountBuffer,
        create: mockCreate
      }));

      const provider = new SpellCheckerProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
      expect(mockMountBuffer.mock.calls).toHaveLength(2);

      expect(mockCreate.mock.calls).toHaveLength(1);
      expect(mockCreate.mock.calls).toEqual([['boo', 'boo']]);

      expect(await provider.getAvailableDictionaries()).toEqual(['kk']);
      expect(await provider.getSelectedDictionaryLanguage()).toBeNull();
    });
  });

  describe('unloadDictionary', () => {
    it('should clear currently selected key', async () => {
      const provider = new SpellCheckerProvider();
      (provider as any)._currentSpellCheckerKey = 'kk';
      (provider as any).spellCheckerTable = {
        kk: {
          dispose: jest.fn()
        }
      };

      provider.unloadDictionary('kk');
      expect((provider as any)._currentSpellCheckerKey).toBeNull();
      expect((provider as any).currentSpellCheckerStartTime).toEqual(Number.NEGATIVE_INFINITY);
    });

    it('should not throw when key is not valid', async () => {
      const provider = new SpellCheckerProvider();
      expect(provider.unloadDictionary(null as any)).resolves.not.toThrow();
    });

    it('should not throw when dictionary is not available', async () => {
      const provider = new SpellCheckerProvider();
      expect(provider.unloadDictionary('meh')).resolves.not.toThrow();
    });

    it('should destroy spellchecker instance', () => {
      const dispose = jest.fn();
      const provider = new SpellCheckerProvider();
      (provider as any).spellCheckerTable = {
        kk: { dispose }
      };

      provider.unloadDictionary('kk');
      expect(dispose.mock.calls).toHaveLength(1);
    });

    it('should unmount buffer dictionary', async () => {
      const mockChecker = { dispose: jest.fn() };
      const mockCreate = jest.fn(() => mockChecker);
      const mockMountBuffer = jest.fn(() => 'boo');
      const mockUnmount = jest.fn();
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountBuffer: mockMountBuffer,
        create: mockCreate,
        unmount: mockUnmount
      }));

      const provider = new SpellCheckerProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));

      provider.unloadDictionary('kk');

      expect(mockUnmount.mock.calls).toHaveLength(2);
      expect(mockChecker.dispose.mock.calls).toHaveLength(1);
    });
  });

  describe('switchDictionary', () => {
    it('should throw if dictionary is not available', async () => {
      const provider = new SpellCheckerProvider();

      expect(provider.onSwitchLanguage('k')).rejects.toThrow();
    });

    it('should log uptime if current dictionary exists', () => {
      const _now = Date.now;

      const provider = new SpellCheckerProvider();
      (provider as any)._currentSpellCheckerKey = 'kk';
      (provider as any).currentSpellCheckerStartTime = 10;
      (provider as any).spellCheckerTable = {
        kk: { uptime: 5 },
        ll: {}
      };
      Date.now = jest.fn(() => 100);

      provider.onSwitchLanguage('ll');
      const uptime = (provider as any).spellCheckerTable['kk'].uptime;
      expect(uptime).toEqual(95); //100 - 10 + 5
      Date.now = _now;
    });

    it('should ignore uptime if starttime exist but current dictionary not exists', () => {
      const _now = Date.now;

      const provider = new SpellCheckerProvider();
      (provider as any).currentSpellCheckerStartTime = 10;
      (provider as any).spellCheckerTable = {
        kk: { uptime: 5 },
        ll: {}
      };
      Date.now = jest.fn(() => 100);

      provider.onSwitchLanguage('ll');
      const uptime = (provider as any).spellCheckerTable['kk'].uptime;
      expect(uptime).toEqual(5);
      Date.now = _now;
    });

    it('should start uptime for new dictionary', () => {
      const provider = new SpellCheckerProvider();
      (provider as any).spellCheckerTable = {
        ll: {}
      };

      expect((provider as any).currentSpellCheckerStartTime).toEqual(Number.NEGATIVE_INFINITY);
      provider.onSwitchLanguage('ll');

      expect((provider as any).currentSpellCheckerStartTime).toBeGreaterThan(0);
    });
  });
});
