<a name="1.0.0-beta.11"></a>
# [1.0.0-beta.11](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.10...v1.0.0-beta.11) (2019-06-20)


### Bug Fixes

* **hunspell:** fix runtime behavior difference due to optimization ([204ccbb](https://github.com/kwonoj/electron-hunspell/commit/204ccbb))



<a name="1.0.0-beta.10"></a>
# [1.0.0-beta.10](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.9...v1.0.0-beta.10) (2019-06-13)


### Bug Fixes

* **hunspell:** fix dependencies ([704a480](https://github.com/kwonoj/electron-hunspell/commit/704a480))



<a name="1.0.0-beta.9"></a>
# [1.0.0-beta.9](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.8...v1.0.0-beta.9) (2019-06-13)


### Features

* **spellcheckerprovider:** do not accept environment override ([da8f87c](https://github.com/kwonoj/electron-hunspell/commit/da8f87c))


### BREAKING CHANGES

* **spellcheckerprovider:** do not allow environment override



<a name="1.0.0-beta.8"></a>
# [1.0.0-beta.8](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2019-06-10)


### Features

* **export:** export environment enum ([a274423](https://github.com/kwonoj/electron-hunspell/commit/a274423))



<a name="1.0.0-beta.7"></a>
# [1.0.0-beta.7](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.5...v1.0.0-beta.7) (2019-05-20)


### Bug Fixes

* **provider:** allow tree shake ([a567ae9](https://github.com/kwonoj/electron-hunspell/commit/a567ae9))


### Code Refactoring

* **loaddictionary:** only accept arraybuffer ([3041e2b](https://github.com/kwonoj/electron-hunspell/commit/3041e2b))
* **unloaddictoinary:** do not reset webframe provider ([5e6dcbf](https://github.com/kwonoj/electron-hunspell/commit/5e6dcbf))


### Features

* **attachspellcheckerprovider:** implement attachprovider ([eeea886](https://github.com/kwonoj/electron-hunspell/commit/eeea886))
* **providerproxy:** expose interfaces for attach ([88b3ed6](https://github.com/kwonoj/electron-hunspell/commit/88b3ed6))
* **providerproxy:** no longer explicitly requires languagekey ([198f7c6](https://github.com/kwonoj/electron-hunspell/commit/198f7c6))
* **spellcheckerprovider:** async interfaces ([6c3bf89](https://github.com/kwonoj/electron-hunspell/commit/6c3bf89))
* **spellcheckerprovider:** implement spell ([0b72398](https://github.com/kwonoj/electron-hunspell/commit/0b72398))
* **spellcheckerprovider:** switchdictionary do not autoattach ([b926902](https://github.com/kwonoj/electron-hunspell/commit/b926902))


### BREAKING CHANGES

* **spellcheckerprovider:** provider interface is now async
* **providerproxy:** switchDictionary deprecated
* **spellcheckerprovider:** spellchecker provider do not attach to
webframe.setSpellcheckProvider
* **unloaddictoinary:** unloadDictionary does not reset webframe spellchecker
* **loaddictionary:** loadDictionary does not read physical file from path
anymore



<a name="1.0.0-beta.5"></a>
# [1.0.0-beta.5](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2019-01-31)


### Bug Fixes

* **hunspell:** bump up hunspell-asm for leak ([6faa44a](https://github.com/kwonoj/electron-hunspell/commit/6faa44a))



<a name="1.0.0-beta.4"></a>
# [1.0.0-beta.4](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2019-01-30)


### Features

* **hunspell:** back to single file binary ([0df2356](https://github.com/kwonoj/electron-hunspell/commit/0df2356))



<a name="1.0.0-beta.3"></a>
# [1.0.0-beta.3](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2019-01-27)


### Features

* **createprovider:** deprecate provider factory ([80776e8](https://github.com/kwonoj/electron-hunspell/commit/80776e8))



<a name="1.0.0-beta.2"></a>
# [1.0.0-beta.2](https://github.com/kwonoj/electron-hunspell/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2019-01-26)


### Bug Fixes

* **hunspell:** enable tree shaking ([48fef98](https://github.com/kwonoj/electron-hunspell/commit/48fef98))



<a name="1.0.0-beta.1"></a>
# [1.0.0-beta.1](https://github.com/kwonoj/electron-hunspell/compare/v0.1.1...v1.0.0-beta.1) (2019-01-26)


### Bug Fixes

* **enablelogger:** do not propagate partial logger ([de3c5da](https://github.com/kwonoj/electron-hunspell/commit/de3c5da))
* **package:** update hunspell-asm to version 1.1.2 ([6f002d8](https://github.com/kwonoj/electron-hunspell/commit/6f002d8))


### Features

* **createprovider:** treeshakable provider factory ([2c221d4](https://github.com/kwonoj/electron-hunspell/commit/2c221d4))
* **hunspell:** bump up hunspell ([1595166](https://github.com/kwonoj/electron-hunspell/commit/1595166))


### BREAKING CHANGES

* **createprovider:** provider create moved to factory function
* **createprovider:** wasm binary is no longer bundled in js preamble



<a name="0.1.1"></a>
## [0.1.1](https://github.com/kwonoj/electron-hunspell/compare/v0.0.9...v0.1.1) (2018-10-11)


### Features

* **spellcheckprovider:** do not depends on lodash ([9f423df](https://github.com/kwonoj/electron-hunspell/commit/9f423df))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/kwonoj/electron-hunspell/compare/v0.0.9...v0.1.0) (2018-10-10)

* support esm build

<a name="0.0.9"></a>
## [0.0.9](https://github.com/kwonoj/electron-hunspell/compare/v0.0.8...v0.0.9) (2018-08-14)


### Bug Fixes

* **lodash:** update import path ([aa9125e](https://github.com/kwonoj/electron-hunspell/commit/aa9125e))
* **package:** update tslib to version 1.9.1 ([7ebeec6](https://github.com/kwonoj/electron-hunspell/commit/7ebeec6))
* **package:** update tslib to version 1.9.2 ([7f13fca](https://github.com/kwonoj/electron-hunspell/commit/7f13fca))
* **package:** update tslib to version 1.9.3 ([714a70c](https://github.com/kwonoj/electron-hunspell/commit/714a70c))



<a name="0.0.8"></a>
## [0.0.8](https://github.com/kwonoj/electron-hunspell/compare/v0.0.7...v0.0.8) (2018-03-07)


### Features

* **hunspell:** bump up hunspell-asm ([72e9437](https://github.com/kwonoj/electron-hunspell/commit/72e9437))



<a name="0.0.7"></a>
## [0.0.7](https://github.com/kwonoj/electron-hunspell/compare/v0.0.6...v0.0.7) (2018-02-04)



<a name="0.0.6"></a>
## [0.0.6](https://github.com/kwonoj/electron-hunspell/compare/v0.0.5...v0.0.6) (2017-11-30)


### Features

* **hunspell:** bump up hunspell-asm ([55562bc](https://github.com/kwonoj/electron-hunspell/commit/55562bc))



<a name="0.0.5"></a>
## [0.0.5](https://github.com/kwonoj/electron-hunspell/compare/v0.0.4...v0.0.5) (2017-11-13)


### Bug Fixes

* **package:** correct dependency ([e7b3076](https://github.com/kwonoj/electron-hunspell/commit/e7b3076))



<a name="0.0.4"></a>
## [0.0.4](https://github.com/kwonoj/electron-hunspell/compare/v0.0.3...v0.0.4) (2017-10-20)


### Bug Fixes

* **provider:** require explicit init ([2619dd4](https://github.com/kwonoj/electron-hunspell/commit/2619dd4))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/kwonoj/electron-hunspell/compare/v0.0.2...v0.0.3) (2017-10-10)


### Bug Fixes

* **package:** update hunspell-asm to version 0.0.17 ([e1d8bad](https://github.com/kwonoj/electron-hunspell/commit/e1d8bad))



<a name="0.0.2"></a>
## [0.0.2](https://github.com/kwonoj/electron-hunspell/compare/v0.0.1...v0.0.2) (2017-09-24)


### Bug Fixes

* **increaserefcount:** start refcount from 1 ([fd0e755](https://github.com/kwonoj/electron-hunspell/commit/fd0e755))


### Features

* **enablelogger:** propagate hunspell logger ([14be558](https://github.com/kwonoj/electron-hunspell/commit/14be558))
* **getsuggestion:** implement getsuggestion ([b78bc1d](https://github.com/kwonoj/electron-hunspell/commit/b78bc1d))
* **index:** export logger ([aad3f25](https://github.com/kwonoj/electron-hunspell/commit/aad3f25))
* **loaddictionary:** unload current dictionary ([a8c27b6](https://github.com/kwonoj/electron-hunspell/commit/a8c27b6))
* **logger:** allow partial logger ([ce5529e](https://github.com/kwonoj/electron-hunspell/commit/ce5529e))
* **logger:** implement logger ([bb24dc2](https://github.com/kwonoj/electron-hunspell/commit/bb24dc2))
* **spellcheckerprovider:** implement spellcheckerprovider ([d72eda8](https://github.com/kwonoj/electron-hunspell/commit/d72eda8))
* **spellcheckerprovider:** implements attach to webframe ([2910016](https://github.com/kwonoj/electron-hunspell/commit/2910016))
* **spellcheckerprovider:** initial mounting logic ([3208fcf](https://github.com/kwonoj/electron-hunspell/commit/3208fcf))
* **spellcheckerprovider:** switchDictionary now attaches provider ([ca95630](https://github.com/kwonoj/electron-hunspell/commit/ca95630))



<a name="0.0.1"></a>
## 0.0.1 (2017-09-08)


### Features

* **index:** setup exports ([1b4f7b9](https://github.com/kwonoj/electron-hunspell/commit/1b4f7b9))
* **root:** implement root ([1442e36](https://github.com/kwonoj/electron-hunspell/commit/1442e36))
* **spellcheckhandler:** implement barebone interfaces ([57791c4](https://github.com/kwonoj/electron-hunspell/commit/57791c4))



