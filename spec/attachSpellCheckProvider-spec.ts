import { webFrame } from 'electron';
import { attachSpellCheckProvider } from '../src/index';

jest.mock('electron', () => ({ webFrame: { setSpellCheckProvider: jest.fn() } }), {
  virtual: true
});

describe('attachSpellCheckProvider', () => {
  beforeEach(() => jest.resetAllMocks());

  it(`should switch language for webframe`, async () => {
    const providerMock = {
      onSwitchLanguage: jest.fn()
    };

    const attached = await attachSpellCheckProvider(providerMock as any);
    await attached.switchLanguage('ko');

    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1);
    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledWith('ko', jasmine.any(Object));

    expect(providerMock.onSwitchLanguage).toHaveBeenCalledWith('ko');
  });

  it(`should run spellcheck via provider proxy`, async done => {
    const providerMock = {
      onSwitchLanguage: jest.fn(),
      spell: jest.fn((w: string) => Promise.resolve(w === 'a'))
    };

    const attached = await attachSpellCheckProvider(providerMock as any);
    await attached.switchLanguage('ko');

    const webFrameSpellcheckerProvider = (webFrame.setSpellCheckProvider as jest.Mock).mock.calls[0][1];

    webFrameSpellcheckerProvider.spellCheck(['a', 'b'], (result: Array<string>) => {
      expect(result).toEqual(['b']);
      done();
    });
  });

  it(`should not throw when spellchecker proxy failed`, async done => {
    const providerMock = {
      onSwitchLanguage: jest.fn(),
      spell: jest.fn(() => Promise.reject('boo'))
    };

    const attached = await attachSpellCheckProvider(providerMock as any);
    await attached.switchLanguage('ko');

    const webFrameSpellcheckerProvider = (webFrame.setSpellCheckProvider as jest.Mock).mock.calls[0][1];

    webFrameSpellcheckerProvider.spellCheck(['a', 'b'], (result: Array<string>) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it(`should reset existing spellchecker when teardown`, async () => {
    const providerMock = {
      getSelectedDictionaryLanguage: jest.fn(() => Promise.resolve('boo'))
    };

    const attached = await attachSpellCheckProvider(providerMock as any);
    await attached.unsubscribe();

    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledTimes(1);
    expect(webFrame.setSpellCheckProvider).toHaveBeenCalledWith('boo', jasmine.any(Object));
  });
});
