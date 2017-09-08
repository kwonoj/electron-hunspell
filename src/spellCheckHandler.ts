interface SpellCheckHandlerBase {}

class SpellCheckHandler implements SpellCheckHandlerBase {
  public attach() {
    throw new Error('not implemented');
  }
}

export { SpellCheckHandlerBase, SpellCheckHandler };
