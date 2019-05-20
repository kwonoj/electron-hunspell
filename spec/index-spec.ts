import * as idx from '../src/index';

describe('index', () => {
  it('should export', () => {
    const { enableLogger, SpellCheckerProvider, attachSpellCheckProvider } = idx;
    expect(enableLogger).toBeDefined();
    expect(SpellCheckerProvider).toBeDefined();
    expect(attachSpellCheckProvider).toBeDefined();
  });
});
