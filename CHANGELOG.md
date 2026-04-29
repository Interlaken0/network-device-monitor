# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0](https://github.com/Interlaken0/network-device-monitor/compare/v0.1.3...v0.2.0) (2026-04-29)

### Features

* **database:** add advanced status queries with IPC exposure ([cf981ef](https://github.com/Interlaken0/network-device-monitor/commit/cf981ef855fd08b3e66d6931b7a7bfa83f3549c4))
* **database:** add device status summary query ([5cd7c47](https://github.com/Interlaken0/network-device-monitor/commit/5cd7c47ab5c581fcbeb23913b57c699d23a7e04d))
* **ui:** add device edit functionality ([84c4775](https://github.com/Interlaken0/network-device-monitor/commit/84c4775706d6abfcd0edce16793280ab12132460))

### Bug Fixes

* correct README inaccuracies - filename case, missing test file, build output notes ([2641757](https://github.com/Interlaken0/network-device-monitor/commit/26417570edf714f95d3fd4a183ff3809ec5d8b73))
* remove unused variables to resolve lint warnings ([#9](https://github.com/Interlaken0/network-device-monitor/issues/9)) ([7abbb9a](https://github.com/Interlaken0/network-device-monitor/commit/7abbb9ad5a3d0a0eda132968cf48e6a7526d385a))
* **test:** update IPC lifecycle tests to match current handler implementation ([#5](https://github.com/Interlaken0/network-device-monitor/issues/5)) ([a42a8ef](https://github.com/Interlaken0/network-device-monitor/commit/a42a8ef9c86212fd546e24b8c0e8390974ec0407))
* **ui:** replace native confirm with custom modal to prevent focus loss after delete ([37590a6](https://github.com/Interlaken0/network-device-monitor/commit/37590a6df9e8f508120c2fd5f0aa31dac781b916))

### [0.1.2](https://github.com/Interlaken0/network-device-monitor/compare/v0.1.1...v0.1.2) (2026-04-10)


### Features

* **ipc:** add ping monitoring handlers for start/stop control ([9a75874](https://github.com/Interlaken0/network-device-monitor/commit/9a75874143ed02822efbebb6df66d0908d62a60a))
* **ping:** implement ICMP ping service and multi-device scheduler ([85f8865](https://github.com/Interlaken0/network-device-monitor/commit/85f8865e2638760c042b1c5ba4a957450d88d9b3))
* **ui:** implement MVP single-device monitoring interface ([1538355](https://github.com/Interlaken0/network-device-monitor/commit/1538355df875cf8074adca2a6a6e4e0384ad604d))


### Bug Fixes

* **build:** correct electron-vite output paths for dev server ([8fb7c61](https://github.com/Interlaken0/network-device-monitor/commit/8fb7c615c3e0613eea4667fcbad7147975de4757))
* **database:** await all async getDatabase() calls for better-sqlite3 ([105ad11](https://github.com/Interlaken0/network-device-monitor/commit/105ad11ede2557cfd8828728c646cd62afb5f50c))
* **database:** dynamic import of better-sqlite3 for Electron compatibility ([4700ef3](https://github.com/Interlaken0/network-device-monitor/commit/4700ef30f6a8feb12bd67adb0dd9dae74aa83356))
* **deps:** add ping library for ICMP monitoring ([4512239](https://github.com/Interlaken0/network-device-monitor/commit/4512239ccd73cc759017b5f5f86d0779ba036ae7))
* **handlers:** remove outage restriction from device delete for MVP ([785947a](https://github.com/Interlaken0/network-device-monitor/commit/785947a851684fc2d5a1f1232e1ccec3deda3e0f))
* **main:** add fallback dev server URL for electron-vite ([8933d4e](https://github.com/Interlaken0/network-device-monitor/commit/8933d4edcc6f41d95d44726cb50d179312021657))
* **main:** make database optional for MVP - dynamic import of ipc-handlers ([c4e0c69](https://github.com/Interlaken0/network-device-monitor/commit/c4e0c69938d454e4c6a898c3365ddbf8ce695023))
* **reporter:** correct duration calculation in test summary ([e289ced](https://github.com/Interlaken0/network-device-monitor/commit/e289ced6138561643482e3322bd659cf92b508b1))

### 0.1.1 (2026-04-08)


### Features

* **database:** implement SQLite schema with better-sqlite3 ([012c660](https://github.com/Interlaken0/network-device-monitor/commit/012c660ab46700cac2cd1438ad6c27ea68e280d2))
* **main:** initialise Electron with Vite and security configuration ([9dd3f0d](https://github.com/Interlaken0/network-device-monitor/commit/9dd3f0dbd0a0b1ffe4683e1141fb48dc69eb26c7))
* **tests:** add automatic test summary and changelog generation ([8cf8c3f](https://github.com/Interlaken0/network-device-monitor/commit/8cf8c3f75b916375e35bdd71c8b7aa9963e0110c))
* **tests:** add Jest testing infrastructure with 65 tests ([317eeef](https://github.com/Interlaken0/network-device-monitor/commit/317eeef542af2fdb4bec226022f5ad9b1c6c8a92))
* **tests:** merge testing infrastructure with 65 tests ([931c87b](https://github.com/Interlaken0/network-device-monitor/commit/931c87be3865e0f154e5f3de8fae3a0ca222aed8))


### Bug Fixes

* **scripts:** use npx --yes for standard-version ([5e99bad](https://github.com/Interlaken0/network-device-monitor/commit/5e99badec8013e63a97ddf0eb9742d7c4833464c))
