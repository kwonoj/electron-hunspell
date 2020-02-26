[![Build Status](https://travis-ci.org/kwonoj/electron-hunspell.svg?branch=feat-interfaces)](https://travis-ci.org/kwonoj/electron-hunspell)
[![Build status](https://ci.appveyor.com/api/projects/status/2gof7lckercaa37f?svg=true)](https://ci.appveyor.com/project/kwonoj/electron-hunspell)
[![codecov](https://codecov.io/gh/kwonoj/electron-hunspell/branch/master/graph/badge.svg)](https://codecov.io/gh/kwonoj/electron-hunspell)
[![npm](https://img.shields.io/npm/v/electron-hunspell.svg)](https://www.npmjs.com/package/electron-hunspell)
[![node](https://img.shields.io/badge/node-=>4.0-blue.svg?style=flat)](https://www.npmjs.com/package/electron-hunspell)

# Deprecated: Electron provides built in spellchecker now: https://github.com/electron/electron/pull/20897

# Electron-hunspell

`electron-hunspell` provides [`hunspell`](https://github.com/hunspell/hunspell) based spell checker to [`Electron`](https://electron.atom.io/) based applications with minimal, simple api. This module aims specific design goals compare to other spellchecker implementations

- No native module dependencies
- No platform specific code, consistent behavior via hunspell
- Low level explicit api surface

There are couple of modules to improve spell checking experiences via `electron-hunspell` to check out if you're interested

- [`cld3-asm`](https://github.com/kwonoj/cld3-asm): Javascript bindings for google compact language detector v3
- [`hunspell-dict-downloader`](https://github.com/kwonoj/hunspell-dict-downloader): Downloader for hunspell dict around several available locales

From 1.0, `electron-hunspell` only supports electron@5 and above supports async spellchecker interface. For previous version of electron, use 0.x version.

# Install

```sh
npm install electron-hunspell
```

# Usage

## Creating spellchecker provider

`electron-hunspell` exposes `SpellCheckerProvider`, class to manage spellchecker instance for several dictionaries.

```typescript
import { SpellCheckerProvider } from 'electron-hunspell';

const provider = new SpellCheckerProvider();
await provider.initialize();
```

`initialize` accepts options to pass into `hunspell-asm` binary if needed.

```typescript
initialize(initOptions?: Partial<{ timeout: number; }>): Promise<void>;
```

Once you have provider instance, you can manage each dictionary based on locale key.

```typescript
const aff = await (await fetch('https://unpkg.com/hunspell-dict-en-us@0.1.0/en-us.aff')).arrayBuffer();
const dic = await (await fetch('https://unpkg.com/hunspell-dict-en-us@0.1.0/en-us.dic')).arrayBuffer();

await provider.loadDictionary('en', new Uint8Array(dic), new Uint8Array(aff));
```

`loadDictionary` creates spellchecker instance to corresponding locale key.

```typescript
public loadDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView): Promise<void>;
```

When dictionary is no longer needed it should be manually disposed via `unloadDictionary` interface.

```typescript
public unloadDictionary(key: string): Promise<void>
```

To get suggested text for misspelled text use `getSuggestion`

```typescript
public getSuggestion(text: string): Promise<Readonly<Array<string>>>
```

It'll ask currently selected spellchecker to get suggestion for misspelling.

To add a word to the dictionary, use `addWord`.  This is *runtime* behavior, so it doesn't
persist over once instance is disposed.

```typescript
public addWord(languageKey: string, text: string): Promise<void>
```

Few other convenient interfaces are available as well.

```typescript
//Returns array of key for currently loaded dictionaries
//in desecending order of how long it has been used.
public getAvailableDictionaries: Promise<Readonly<Array<string>>>;

//Returns key of currently selected dictionary.
public getSelectedDictionary: Promise<string | null>;
```

## Attach provider to webFrame

Once provider instance is ready, `attachSpellCheckProvider` can actually attach those into current webFrame.

```typescript
const attached = attachSpellCheckProvider(provider);

//Change language for spellchecker attached to webFrame.
await attached.switchLanguage('en');
//Teardown webFrame's spellchecker based on current language.
await attached.unsubscribe();
```

`attachSpellCheckProvider` relies on `provider` to get current language's dictionary. If dictionary is not loaded via `loadDictionary`, spellcheck won't work.

## Put provider to another thread

`attachSpellCheckProvider` not only accepts instance of `SpellCheckerProvider` but also accepts any proxy object can commnuicate to actual provider instance. Since Electron's spellchecker is now async, it is possible to place provider instnace to other than main thread like web worker.

```typescript
//pseudo code

//provider.js
const provider = new SpellCheckerProvider();
self.onmessage = (event) => {
  switch (type) {
    ...
    case 'spell':
      postMessage('message', provider.spell(...));
  }
}

//renderer.js
const worker = new Worker('provider.js');
//proxy object implements necessary interfaces to attach spellchecker
const providerProxy = {
  spell: (text) => {
    worker.addEventListener('message', onSpell);
    worker.postMessage(...);
  },
  ...
};

// use proxy object to attach spellchecker to webframe
await attachSpellCheckProvider(providerProxy);
```

`attachSpellCheckProvider` does not aware where does provider placed - it can be other process communicates via IPC, or webworker, or something else and does not provide any proxy implementation by default. Also note using IPC for proxy need caution, as spellcheck can cause amount of IPC request based on user typings.

[`Example`](https://github.com/kwonoj/electron-hunspell/tree/master/example) provides simple code how to use SpellCheckerProvider in general. `npm run example:browserwindow` will executes example for general browserWindow, `npm run example:browserview` provides example for loading external page via `browserView` with preload scripts. `npm run example:worker` will load example running provider under web worker.

# Building / Testing

Few npm scripts are supported for build / test code.

- `build`: Transpiles code to ES5 commonjs to `dist`.
- `test`: Run test cases.
- `lint`: Run lint over all codebases
- `lint:staged`: Run lint only for staged changes. This'll be executed automatically with precommit hook.
- `commit`: Commit wizard to write commit message

# License

[MIT](https://github.com/kwonoj/electron-hunspell/blob/master/LICENSE)