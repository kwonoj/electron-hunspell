import { expect } from 'chai';
import { webFrame } from 'electron';
import { loadModule } from 'hunspell-asm';
import { createProvider } from '../src/createProvider';

jest.mock('hunspell-asm');
jest.mock('electron', () => ({ webFrame: { setSpellCheckProvider: jest.fn() } }), {
  virtual: true
});

describe('spellCheckerProvider', () => {
  beforeEach(() => jest.resetAllMocks());

  it('should able to set verbose', () => {
    const provider = createProvider();
    provider.verboseLog = true;

    expect((provider as any)._verboseLog).to.be.true;
  });

  describe('initialize', () => {
    it('should init factory', async () => {
      const provider = createProvider();

      await provider.initialize();
      expect((loadModule as jest.Mock<any>).mock.calls).to.have.lengthOf(1);
    });

    it('should inint factory once', async () => {
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockReturnValueOnce({});
      const provider = createProvider();

      await provider.initialize();
      await provider.initialize();
      expect(loadModuleMock.mock.calls).to.have.lengthOf(1);
    });
  });

  describe('availableDictionaries', () => {
    it('should return empty if dictionaries are not loaded', () => {
      const provider = createProvider();
      expect(provider.availableDictionaries).to.be.empty;
    });

    it('should return dictionaries sorted by uptime', () => {
      const provider = createProvider();
      (provider as any).spellCheckerTable = {
        kr: { uptime: 100 },
        en: { uptime: 80 },
        jp: { uptime: 120 }
      };

      const dict = provider.availableDictionaries;
      expect(dict).to.deep.equal(['jp', 'kr', 'en']);
    });
  });

  describe('selectedDictionary', () => {
    it('should return null if not selected', () => {
      const provider = createProvider();

      expect(provider.selectedDictionary).to.be.null;
    });

    it('should return currently selected dictionary', () => {
      const provider = createProvider();
      (provider as any)._currentSpellCheckerKey = 'kr';

      expect(provider.selectedDictionary).to.equal('kr');
    });
  });

  describe('getSuggestion', () => {
    it('should return empty without current checker key', () => {
      const provider = createProvider();
      const suggestion = provider.getSuggestion('boo');
      expect(suggestion).to.be.empty;
    });

    it('should return empty without checker instance', () => {
      const provider = createProvider();
      (provider as any)._currentSpellCheckerKey = 'kr';

      const suggestion = provider.getSuggestion('boo');
      expect(suggestion).to.be.empty;
    });

    it('should return suggestions with verbose log', () => {
      const provider = createProvider();
      provider.verboseLog = true;

      (provider as any)._currentSpellCheckerKey = 'kr';
      (provider as any).spellCheckerTable['kr'] = {
        spellChecker: {
          suggest: jest.fn(() => ['boo', 'meh'])
        }
      };

      const suggestion = provider.getSuggestion('boo');
      expect(suggestion).to.deep.equal(['boo', 'meh']);
    });

    it('should return suggestions', () => {
      const provider = createProvider();

      (provider as any)._currentSpellCheckerKey = 'kr';
      (provider as any).spellCheckerTable['kr'] = {
        spellChecker: {
          suggest: jest.fn(() => ['boo', 'meh'])
        }
      };

      const suggestion = provider.getSuggestion('boo');
      expect(suggestion).to.deep.equal(['boo', 'meh']);
    });
  });

  describe('loadDictionary', () => {
    it('should throw when key is not valid', async () => {
      const provider = createProvider();
      let thrown = false;

      try {
        await provider.loadDictionary(null as any, 'a' as any, new Int32Array(1) as any);
      } catch (e) {
        expect(e).to.be.an('Error');
        thrown = true;
      }

      expect(thrown).to.be.true;
    });

    it('should throw when key is already registered', async () => {
      const mockCreate = jest.fn();
      const mockMountBuffer = jest.fn(() => 'boo');
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountBuffer: mockMountBuffer,
        create: mockCreate
      }));

      const provider = createProvider();
      await provider.initialize();
      let thrown = false;

      try {
        await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
        await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
      } catch (e) {
        expect(e).to.be.an('Error');
        thrown = true;
      }

      expect(thrown).to.be.true;
    });

    it('should throw when dictionary is not valid', async () => {
      const provider = createProvider();
      let thrown = false;

      try {
        await provider.loadDictionary('k', 'a' as any, new Int32Array(1) as any);
      } catch (e) {
        expect(e).to.be.an('Error');
        thrown = true;
      }

      expect(thrown).to.be.true;
    });

    it('should load buffer dictionary', async () => {
      const mockCreate = jest.fn();
      const mockMountBuffer = jest.fn(() => 'boo');
      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountBuffer: mockMountBuffer,
        create: mockCreate
      }));

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));
      expect(mockMountBuffer.mock.calls).to.have.lengthOf(2);

      expect(mockCreate.mock.calls).to.have.lengthOf(1);
      expect(mockCreate.mock.calls).to.deep.equal([['boo', 'boo']]);

      expect(provider.availableDictionaries).to.deep.equal(['kk']);
      expect(provider.selectedDictionary).to.be.null;
    });

    it('should load file dictionary', async () => {
      const mockMountDirectory = jest.fn(x => x);
      const mockCreate = jest.fn();

      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountDirectory: mockMountDirectory,
        create: mockCreate
      }));

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('xx', '/x/a.dic', '/y/a.aff');
      expect(mockMountDirectory.mock.calls).to.have.lengthOf(2);
      expect(mockMountDirectory.mock.calls).to.deep.equal([['/y'], ['/x']]);

      expect(mockCreate.mock.calls).to.have.lengthOf(1);
      expect(mockCreate.mock.calls).to.deep.equal([['/y/a.aff', '/x/a.dic']]);

      expect(provider.availableDictionaries).to.deep.equal(['xx']);
      expect(provider.selectedDictionary).to.be.null;
    });
  });

  describe('unloadDictionary', () => {
    it('should clear currently selected key', () => {
      const oldType = process.type;
      process.type = 'renderer';

      const provider = createProvider();
      (provider as any)._currentSpellCheckerKey = 'kk';
      (provider as any).spellCheckerTable = {
        kk: {
          dispose: jest.fn()
        }
      };

      provider.unloadDictionary('kk');
      expect((provider as any)._currentSpellCheckerKey).to.be.null;
      expect((provider as any).currentSpellCheckerStartTime).to.equal(Number.NEGATIVE_INFINITY);

      const calls = (webFrame.setSpellCheckProvider as jest.Mock<any>).mock.calls;
      expect(calls).to.have.lengthOf(1);

      expect(calls[0][2].spellCheck('boo')).to.be.true;

      process.type = oldType;
    });

    it('should not throw when key is not valid', () => {
      const provider = createProvider();
      expect(() => provider.unloadDictionary(null as any)).to.not.throw();
    });

    it('should not throw when dictionary is not available', () => {
      const provider = createProvider();
      expect(() => provider.unloadDictionary('meh')).to.not.throw();
    });

    it('should destroy spellchecker instance', () => {
      const dispose = jest.fn();
      const provider = createProvider();
      (provider as any).spellCheckerTable = {
        kk: { dispose }
      };

      provider.unloadDictionary('kk');
      expect(dispose.mock.calls).to.have.lengthOf(1);
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

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', new Int32Array(1), new Int32Array(1));

      provider.unloadDictionary('kk');

      expect(mockUnmount.mock.calls).to.have.lengthOf(2);
      expect(mockChecker.dispose.mock.calls).to.have.lengthOf(1);
    });

    it('should unmount directory if refcount cleared', async () => {
      const mockChecker = { dispose: jest.fn() };
      const mockCreate = jest.fn(() => mockChecker);
      const mockMountDirectory = jest.fn(x => x);
      const mockUnmount = jest.fn();

      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountDirectory: mockMountDirectory,
        create: mockCreate,
        unmount: mockUnmount
      }));

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', '/x/a.dic', '/x/a.aff');

      expect((provider as any).fileMountRefCount).to.deep.equal({ '/x': 2 });
      provider.unloadDictionary('kk');

      expect(mockUnmount.mock.calls).to.have.lengthOf(1);
      expect((provider as any).fileMountRefCount).to.be.empty;
    });

    it('should not throw while decrease refcount for zero refs', async () => {
      const mockChecker = { dispose: jest.fn() };
      const mockCreate = jest.fn(() => mockChecker);
      const mockMountDirectory = jest.fn(x => x);
      const mockUnmount = jest.fn();

      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountDirectory: mockMountDirectory,
        create: mockCreate,
        unmount: mockUnmount
      }));

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', '/y/a.dic', '/x/a.aff');

      expect((provider as any).fileMountRefCount).to.deep.equal({ '/x': 1, '/y': 1 });

      //augment refcount to zero
      (provider as any).fileMountRefCount['/x'] = 0;
      provider.unloadDictionary('kk');

      expect(mockUnmount.mock.calls).to.have.lengthOf(2);
      expect((provider as any).fileMountRefCount).to.be.empty;
    });

    it('should decrease refcount file dictionary if mounted path have another dictionary', async () => {
      const mockChecker = { dispose: jest.fn() };
      const mockCreate = jest.fn(() => mockChecker);
      const mockMountDirectory = jest.fn(x => x);
      const mockUnmount = jest.fn();

      const loadModuleMock = loadModule as jest.Mock<any>;
      loadModuleMock.mockImplementationOnce(() => ({
        mountDirectory: mockMountDirectory,
        create: mockCreate,
        unmount: mockUnmount
      }));

      const provider = createProvider();
      await provider.initialize();

      await provider.loadDictionary('kk', '/x/a.dic', '/x/a.aff');
      await provider.loadDictionary('xx', '/x/y.dic', '/x/y.aff');

      expect((provider as any).fileMountRefCount).to.deep.equal({ '/x': 4 });

      provider.unloadDictionary('kk');

      expect(mockUnmount.mock.calls).to.have.lengthOf(0);
      expect((provider as any).fileMountRefCount).to.deep.equal({ '/x': 2 });

      provider.unloadDictionary('xx');

      expect(mockUnmount.mock.calls).to.have.lengthOf(1);
      expect((provider as any).fileMountRefCount).to.be.empty;
    });
  });

  describe('switchDictionary', () => {
    it('should throw if dictionary is not available', () => {
      const provider = createProvider();

      expect(() => provider.switchDictionary('k')).to.throw();
    });

    it('should log uptime if current dictionary exists', () => {
      const _now = Date.now;

      const provider = createProvider();
      (provider as any)._currentSpellCheckerKey = 'kk';
      (provider as any).currentSpellCheckerStartTime = 10;
      (provider as any).spellCheckerTable = {
        kk: { uptime: 5 },
        ll: {}
      };
      Date.now = jest.fn(() => 100);

      provider.switchDictionary('ll');
      const uptime = (provider as any).spellCheckerTable['kk'].uptime;
      expect(uptime).to.equal(95); //100 - 10 + 5
      Date.now = _now;
    });

    it('should ignore uptime if starttime exist but current dictionary not exists', () => {
      const _now = Date.now;

      const provider = createProvider();
      (provider as any).currentSpellCheckerStartTime = 10;
      (provider as any).spellCheckerTable = {
        kk: { uptime: 5 },
        ll: {}
      };
      Date.now = jest.fn(() => 100);

      provider.switchDictionary('ll');
      const uptime = (provider as any).spellCheckerTable['kk'].uptime;
      expect(uptime).to.equal(5);
      Date.now = _now;
    });

    it('should start uptime for new dictionary', () => {
      const provider = createProvider();
      (provider as any).spellCheckerTable = {
        ll: {}
      };

      expect((provider as any).currentSpellCheckerStartTime).to.equal(Number.NEGATIVE_INFINITY);
      provider.switchDictionary('ll');

      expect((provider as any).currentSpellCheckerStartTime).to.be.greaterThan(0);
    });

    it('should not throw if webframe does not exist to attach', () => {
      const provider = createProvider();
      (provider as any).spellCheckerTable = {
        ll: {}
      };

      expect(() => provider.switchDictionary('ll')).to.not.throw();
    });

    it('should attach into webframe', () => {
      const oldType = process.type;
      process.type = 'renderer';

      const provider = createProvider();
      (provider as any).spellCheckerTable = {
        ll: {
          spellChecker: {
            spell: jest.fn()
          }
        }
      };

      provider.switchDictionary('ll');
      expect(provider.selectedDictionary).to.equal('ll');
      const calls = (webFrame.setSpellCheckProvider as jest.Mock<any>).mock.calls;
      expect(calls).to.have.lengthOf(1);
      expect(calls[0][0]).to.equal('ll');
      expect(calls[0][1]).to.equal(true);

      calls[0][2].spellCheck('boo');
      const spellMock = (provider as any).spellCheckerTable['ll'].spellChecker.spell;
      expect(spellMock.mock.calls).to.have.lengthOf(1);
      expect(spellMock.mock.calls[0]).to.deep.equal(['boo']);

      process.type = oldType;
    });

    it('should attach into webframe with verbose log', () => {
      const oldType = process.type;
      process.type = 'renderer';

      const provider = createProvider();
      provider.verboseLog = true;
      (provider as any).spellCheckerTable = {
        ll: {
          spellChecker: {
            spell: jest.fn()
          }
        }
      };

      provider.switchDictionary('ll');
      expect(provider.selectedDictionary).to.equal('ll');
      const calls = (webFrame.setSpellCheckProvider as jest.Mock<any>).mock.calls;
      expect(calls).to.have.lengthOf(1);
      expect(calls[0][0]).to.equal('ll');
      expect(calls[0][1]).to.equal(true);

      calls[0][2].spellCheck('boo');
      const spellMock = (provider as any).spellCheckerTable['ll'].spellChecker.spell;
      expect(spellMock.mock.calls).to.have.lengthOf(1);
      expect(spellMock.mock.calls[0]).to.deep.equal(['boo']);

      process.type = oldType;
    });
  });
});
//tslint:enable:no-require-imports
