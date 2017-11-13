[![Build Status](https://travis-ci.org/kwonoj/electron-hunspell.svg?branch=feat-interfaces)](https://travis-ci.org/kwonoj/electron-hunspell)
[![Build status](https://ci.appveyor.com/api/projects/status/2gof7lckercaa37f?svg=true)](https://ci.appveyor.com/project/kwonoj/electron-hunspell)
[![codecov](https://codecov.io/gh/kwonoj/electron-hunspell/branch/master/graph/badge.svg)](https://codecov.io/gh/kwonoj/electron-hunspell)
[![npm](https://img.shields.io/npm/v/electron-hunspell.svg)](https://www.npmjs.com/package/electron-hunspell)
[![node](https://img.shields.io/badge/node-=>4.0-blue.svg?style=flat)](https://www.npmjs.com/package/electron-hunspell)
[![Greenkeeper badge](https://badges.greenkeeper.io/kwonoj/electron-hunspell.svg)](https://greenkeeper.io/)

# Electron-hunspell

`electron-hunspell` provides [`hunspell`](https://github.com/hunspell/hunspell) based spell checker to [`Electron`](https://electron.atom.io/) based applications with minimal, simple api. This module aims specific design goals compare to other spellchecker implementations

- No native module dependencies
- No platform specific, consistent behavior via hunspell
- Low level explicit api surface

There are couple of modules to improve spell checking experiences via `electron-hunspell` to check out if you're interested

- [`cld3-asm`](https://github.com/kwonoj/cld3-asm): Javascript bindings for google compact language detector v3
- [`hunspell-dict-downloader`](https://github.com/kwonoj/hunspell-dict-downloader): Downloader for hunspell dict around several available locales

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

Once you have provider instance, you can manage each dictionary based on locale key.

```typescript
await provider.loadDictionary('en', './en-US.dic', './en-US.aff');
```

`loadDictionary` creates spellchecker instance to corresponding locale key.

```typescript
public loadDictionary(key: string, dicPath: string, affPath: string): Promise<void>;
public loadDictionary(key: string, dicBuffer: ArrayBufferView, affBuffer: ArrayBufferView): Promise<void>;
```

It also accepts overload of supplying `ArrayBufferView` for cases you're under environment download dictionary via `fetch` or similar manner and have object in memory.

Once dictionary is loaded in provider instance, you can specify which dictionary to check spells.

```typescript
public switchDictionary(key: string): void
```

Note switching dictionary doesn't occur automatically, it should be called explicitly as needed.

When dictionary is no longer needed it should be manually disposed via `unloadDictionary` interface.

```typescript
public unloadDictionary(key: string): void
```

If given key is currently selected spellchecker instance, unload will dispose dictionary as well as clear currently selected spellchecker instance. Otherwise it'll simply dispose dictionary from provider.

To get suggested text for misspelled text use `getSuggestion`

```typescript
public getSuggestion(text: string): Readonly<Array<string>>
```

It'll ask currently selected spellchecker to get suggestion for misspelling.

Few other convenient interfaces are available as well.

```typescript
//Returns array of key for currently loaded dictionaries
//in desecending order of how long it has been used.
public availableDictionaries: Readonly<Array<string>>;

//Returns key of currently selected dictionary.
public selectedDictionary: string | null;

//Writes bit more verbosed log. Setter only.
public verboseLog: boolean;
```

[`Example`](https://github.com/kwonoj/electron-hunspell/tree/master/example) provides simple code how to use SpellCheckerProvider in general. `npm run browserwindow` will executes example for general browserWindow, `npm run browserview` provides example for loading external page via `browserView` with preload scripts.

# Building / Testing

Few npm scripts are supported for build / test code.

- `build`: Transpiles code to ES5 commonjs to `dist`.
- `test`: Run test cases.
- `lint`: Run lint over all codebases
- `lint:staged`: Run lint only for staged changes. This'll be executed automatically with precommit hook.
- `commit`: Commit wizard to write commit message

# License

[MIT](https://github.com/kwonoj/electron-hunspell/blob/master/LICENSE)