import { expect } from 'chai';
import * as idx from '../src/index';

describe('index', () => {
  it('should export', () => {
    const { enableLogger, SpellCheckerProvider } = idx;
    expect(enableLogger).to.exist;
    expect(SpellCheckerProvider).to.exist;
  });
});
