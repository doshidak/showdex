<p align="center">
  <img alt="showdex-icon" width="275px" src="./src/assets/favicons/showdex-1024.png">
</p>

<h1 align="center">
  <code>showdex</code>
</h1>

Current [v1.0.3](https://github.com/doshidak/showdex/releases/tag/v1.0.3) | Install on [Chrome](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) · [Firefox](https://addons.mozilla.org/en-US/firefox/addon/showdex/) · [Opera](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) | Discuss on [Smogon](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/) · [Reddit](https://www.reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/) | [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli)
--- | --- | --- | ---

<br>

**Showdex** is a browser extension for [Pokémon Showdown](https://pokemonshowdown.com) that brings the [Damage Calculator](https://calc.pokemonshowdown.com) you know and love right into your battle! Automatically syncs all Pokémon and field conditions as you play, so you can spend *less time* shitting brix and *more time* [hitting kicks](https://www.smogon.com/dex/ss/moves/high-jump-kick).

Fully supported and installable on [**Chrome**](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai), [**Firefox**](https://addons.mozilla.org/en-US/firefox/addon/showdex/) & [**Opera**](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) (including GX & Crypto).

> **Note**  
> Unfortunately, we don't ever plan on supporting **Safari** since [Apple requires us to shell out $100/year for the Apple Developer Program](https://developer.apple.com/documentation/safariservices/safari_web_extensions) just to distribute a singular *free* extension on the App Store. Alternative would be to manually distribute the extension, but there's the potential issue of codesigning, making for a very unpleasant installation process. Thanks Tim!

<br>

## What's Cookin'

* [**Planned Features**](https://github.com/users/doshidak/projects/1)
* [**Known Issues**](https://github.com/users/doshidak/projects/2)

<br>

## Developer Zone

> **Warning**  
> You are about to get in the zone, the developer zone.  
> If you do not wish to get in the zone, the developer zone, please visit the [**Smogon Forums post**](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/) instead.

<br>

### Developer SparkNotes™

> **Note**  
> This section is a work-in-progress.

This extension is written in **TypeScript**, which is essentially JavaScript on crack, using:

* **React** for the UI frontend (e.g., [Hellodex](./src/pages/Hellodex/Hellodex.tsx), [Calcdex](./src/pages/Calcdex/Calcdex.tsx)),
* **Redux** for global state management (e.g., [Calcdex state](./src/redux/store/calcdexSlice.ts)),
* [**RTK Query**](https://redux-toolkit.js.org) for global data management (e.g., [downloaded Smogon sets](./src/redux/services/presetApi.ts)),
* **Babel** for TypeScript transpilation (in lieu of [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html)),
* **ESLint** for *suggestive* code linting, and
* **webpack** for chunking & bundling.

### Requirements

* **`node`** v18.0.0+
* **`yarn`** (Classic) v1.22.0+
* **`bash`** ([Windows WSL](https://docs.microsoft.com/en-us/windows/wsl/install), macOS, or Linux)

### Setup

> **Note**  
> If your browser is already configured for extension development, you can skip this part.

You'll need to apply some slight tweaks to your browser in order to directly install extensions from your local disk.

<details>
  <summary>
    <strong>Google Chrome</strong>
  </summary>

  1. Navigate to the **Chrome extensions** page (`chrome://extensions`).
  2. Enable **Developer mode** in the top-right corner.
  3. Verify that the **Load unpacked** option is available.
</details>

<details>
  <summary>
    <strong>Mozilla Firefox</strong>
  </summary>

  1. Navigate to the **Advanced Preferences** page (`about:config`).
  2. Search for the preference `xpinstall.signatures.required`.
  3. Set the preference's value to `false` (typically `true` by default).
  4. Navigate to the **Debugging** page (`about:debugging`).
  5. Select **This Firefox** on the left-hand panel.
  6. Verify that the **Temporary Extensions** section and the **Load Temporary Add-on...** option are available.
</details>

### Installation

> **Note**  
> These instructions are for building the extension from **source**.  

1. `cd` into your favorite directory.
2. `git clone git@github.com:doshidak/showdex.git`
3. `cd showdex`
4. `yarn`

<details>
  <summary>
    <strong>Info</strong> &mdash; Post-Installation Scripts
  </summary>

  ---

  Each time you run `yarn` (including `yarn add` & `yarn remove`), the [**`postinstall`**](./package.json#L26) script will **automatically** run afterwards, which itself runs the following:

  * **`yarn patch-ghooks`** → [**`./scripts/patch-ghooks.sh`**](./scripts/patch-ghooks.sh)

  > This project is configured for **ES Modules** (as opposed to ye olde **CommonJS**), while also making use of [`cz-customizable`](https://github.com/leoforfree/cz-customizable), which requires [`cz-customizable-ghooks`](https://github.com/uglow/cz-customizable-ghooks), which requires [**`ghooks`**](https://github.com/ghooks-org/ghooks).
  >
  > Node v18 doesn't allow you to run extensionless files (such as `.git/hooks/commit-msg`), which `ghooks` poops out, so [**`patch-ghooks`**](./scripts/patch-ghooks.sh) adds `.js` at the end of each pooped out file (e.g., `.git/hooks/commit-msg.js`).
  >
  > Otherwise, Node will complain about running an extensionless file and critically fail when you attempt to make a `git commit`.

  * **`yarn patch-package`**

  > This runs [**`patch-package`**](https://github.com/ds300/patch-package), which reads from the [**`patches`**](./patches) directory and applies the `diff` to the corresponding package in *your* `node_modules`.
  >
  > [Patch for `@smogon/calc`](./patches/%40smogon%2Bcalc%2B0.6.0.patch), which is the library responsible for performing the monster mathematics to produce the displayed damage ranges (and also the same library used in the [O.G. Damage Calculator](https://calc.pokemonshowdown.com)), brings the [outdated v0.6.0 release on npm](https://www.npmjs.com/package/@smogon/calc/v/0.6.0) (published on October 2020) up-to-speed by applying 2 years worth of updates from the [latest `efa6fe7` commit](https://github.com/smogon/damage-calc/tree/efa6fe7c9d9f8415ea0d1bab17f95d7bcfbf617f/calc) (as of September 2022).
  >
  > Most notable change is the fix for conditionally-defensive moves like *Psyshock* and *Photon Geyser*. Using v0.6.0 from npm would produce incorrect damage ranges as it considers the wrong defensive stat of the opposing Pokémon (e.g., *Psyshock*, a Special move, should calculate against the opposing Pokémon's DEF stat [cause that's [what it does](https://www.smogon.com/dex/ss/moves/psyshock)], but in v0.6.0, calculates against the SPD stat).
  >
  > [Patch for `react-select`](./patches/react-select%2B5.4.0.patch) wraps the [`scrollIntoView()` call in the `componentDidUpdate()` of the `Select` component](https://github.com/JedWatson/react-select/blob/4b8468636bcfadf0cfe45f9a7a6c1db5dca08d9a/packages/react-select/src/Select.tsx#L735-L743) in a `setTimeout()` so that the internal [`menuListRef`](https://github.com/JedWatson/react-select/blob/4b8468636bcfadf0cfe45f9a7a6c1db5dca08d9a/packages/react-select/src/Select.tsx#L1928-L1931) is available when the menu first opens.
  >
  > [`scrollIntoView()`](https://github.com/JedWatson/react-select/blob/4b8468636bcfadf0cfe45f9a7a6c1db5dca08d9a/packages/react-select/src/utils.ts#L234-L259) is responsible for auto-scrolling the `MenuList` to the focused option that is overflowed (i.e., out of view). It's also responsible for auto-scrolling to the selected option when the `MenuList` first opens. When used in conjunction with [`simplebar`](https://github.com/Grsmto/simplebar) (via [`Scrollable`](./src/components/ui/Scrollable/Scrollable.tsx)), the `scrollRef` of `Scrollable` may not be available as soon as it mounts, so the `setTimeout()` gives the `menuListRef` time to set (by placing the `scrollIntoView()` call at the top of the call stack).
  >
  > [Patch for `simplebar`](./patches/simplebar%2B5.3.8.patch) adds typings for the untyped `scrollableNode` and `contentNode` options, which is actually [used inside `SimpleBar` class](https://github.com/Grsmto/simplebar/blob/5507296404f7e8f393ec48898a900068afaff5e5/packages/simplebar/src/simplebar.js#L179-L184), but [not typed](https://github.com/Grsmto/simplebar/blob/5507296404f7e8f393ec48898a900068afaff5e5/packages/simplebar/simplebar.d.ts#L27-L36).
  >
  > These two options are required if the internal `<div>`s are provided outside of `SimpleBar` (by default, it will create its own `<div>`s inside the provided container element). For use with React, we must provide these internal `<div>`s ourselves, as React doesn't like it when a vanilla JS library adds and removes DOM elements that React isn't aware of.

  ---
  <br>
</details>

### Development

> **Note**  
> `yarn dev` is an alias of `yarn dev:chrome`.

1. `cd showdex`
2. `yarn dev:chrome` or `yarn dev:firefox`

Built contents will be dumped into a **`build` directory** in the project root (will be created if it doesn't exist).

<details>
  <summary>
    <strong>Google Chrome</strong>
  </summary>

  ---

  1. Navigate to `chrome://extensions`.
  2. Select **Load unpacked**.
  3. Point to the `chrome` sub-directory in `build`.
  4. Verify the extension appears in the list.
  5. Navigate to [Pokémon Showdown](https://play.pokemonshowdown.com).
  6. Play or spectate a battle.

  ---
  <br>
</details>

<details>
  <summary>
    <strong>Mozilla Firefox</strong>
  </summary>

  ---

  1. Navigate to `about:debugging`.
  2. Select **Load Temporary Add-on**.
  3. Point to the `showdex-...-dev.firefox.xpi` in `build`.
  4. Verify the extension appears under **Temporary Extensions**.
  5. Navigate to [Pokémon Showdown](https://play.pokemonshowdown.com).
  6. Play or spectate a battle.

  ---
  <br>
</details>

<details>
  <summary>
    <strong>Info</strong> &mdash; Hot-Reloading
  </summary>

  ---

  > **Note**  
  > Recommended you develop on **Chrome** since the reloading process for other browsers such as **Firefox** may be very inconvenient.

  > **Warning**  
  > Hot-reloading is a bit of a mess right now since it requires you to reload the extension and refresh Pokémon Showdown. Will figure out a better system in the future.

  While `yarn dev:chrome` or `yarn dev:firefox` is running, Webpack will trigger a re-compilation of the bundle when files are changed in the [`src`](./src) directory.

  * For **Chrome**, you'll need to select the **reload icon** button in the **Chrome extensions** page (`chrome://extensions`). Once reloaded, **refresh** Pokémon Showdown to see your changes.
  * For **Firefox**, you'll need to **Remove** the extension in the **Debugging** page (`about:debugging`), then **Load Temporary Add-on...** to the newly packaged `xpi` file. Once re-added, **refresh** Pokémon Showdown to see your changes.
    - Note that you cannot simply **Reload** the extension since the packaged `xpi` file will have a different file name.

  ---
  <br>
</details>

### Building

1. `cd showdex`
2. `yarn build:chrome` or `yarn build:firefox`

Built contents will be dumped into a **`dist` directory** in the project root (will be created if it doesn't exist).

There will be an un-zipped directory named after the `BUILD_TARGET` env (e.g., `chrome`, `firefox`) containing all the bundled files, as well as:

* For **Chrome**, a packaged extension under `showdex-...chrome.zip` in `dist`, and
* For **Firefox**, a packaged extension under `showdex-...firefox.xpi` in `dist`.

Courtesy of [AMO by Mozilla](https://addons.mozilla.org), every build now comes with its very own bundle size pie chart, showing you exactly which unchunked packages in the bundle are too **thicc**.

* Bundle size analysis is written to `showdex-...[BUILD_TARGET].html` in `dist`.

### Contributing

**(ﾉ◕ヮ◕)ﾉ\*:･ﾟ✧ Issues & PRs (Pull Requests) are *very* welcome! ✧ﾟ･: \*ヽ(◕ヮ◕ヽ)**

#### Issues

I'm not a stickler for how these should be formatted; just make sure you provide enough info for me to work off of.

If possible, including the following would be **immensely** helpful!

* **Browser** (e.g., Chrome, Firefox, etc.)
* **Showdex Version** (e.g., v1.0.2)
* **Format**, if applicable (e.g., gen8nationaldex)

#### PRs

> **Note**  
> This repo doesn't have any fancy CI integrations at the moment. Additionally, since this project doesn't use `tsc`, your code will still compile even if you have TypeScript or ESLint errors.

* **Fork** this repo and **commit** changes to your fork,
* **Style** your code according to the [**ESLint rules**](./.eslintrc.json),
* **Create** a PR from your fork to this repo, and
* **Provide** a brief description of your changes in your PR.

Thanks! &hearts;

## How It's Made™

> **Note**  
> This section is a work-in-progress.

uhhhhhhhhh

## Credits

> **Note**  
> This work-in-progress is a section.

big thank to:

* [**camdawgboi**](https://pokemonshowdown.com/users/camdawgboi) for the idea and UI/UX design,
* [**ttoki**](https://pokemonshowdown.com/users/ttoki) for being our first tester,
* [**pkmn.cc**](https://pkmn.cc) for keeping the Smogon sets hot and fresh and downloadable,
* **Austin** for the endorsement and support,
* **Honko** for the original damage calculator,
* **Zarel** and the [**Showdown Staff & Contributors**](https://pokemonshowdown.com/credits) for this would literally be nothing without them,
* **Game Freak** and **Nintendo** for good game (plz don't sue us lol), and
* [**sumfuk**](https://pokemonshowdown.com/users/sumfuk) ???
