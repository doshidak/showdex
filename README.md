<p align="center">
  <img alt="showdex-icon" width="275px" src="./src/assets/favicons/showdex-1024.png">
</p>

<h1 align="center">
  <code>showdex</code>
</h1>

Current [v1.0.5](https://github.com/doshidak/showdex/releases/tag/v1.0.5) | Install on [Chrome · Opera · Edge](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) · [Firefox](https://addons.mozilla.org/en-US/firefox/addon/showdex/) | Discuss on [Smogon](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/) · [Reddit](https://www.reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/)
--- | --- | ---

<br>

**Showdex** is a browser extension for [Pokémon Showdown](https://pokemonshowdown.com) that brings the [Damage Calculator](https://calc.pokemonshowdown.com) you know & love right into your battle! Automatically syncs all Pokémon & field conditions as you play, so you can spend *less time* shitting brix & *more time* [hitting kicks](https://www.smogon.com/dex/ss/moves/high-jump-kick).

<br>

Fully supported on [**Chrome**](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) (+ any native [**Chromium**](https://www.chromium.org/Home) browser, like **Opera**, **Edge** & **Brave**) & [**Firefox**](https://addons.mozilla.org/en-US/firefox/addon/showdex/).

<details>
  <summary>
    <strong>
      &nbsp;&nbsp;༼ つ ಥ_ಥ ༽つ&nbsp;&nbsp;Safari
    </strong>
    &nbsp;...?
  </summary>

  ---
  Unfortunately, we don't ~~ever~~ plan on supporting **Safari** since [Apple requires us to shell out $100/year for the Apple Developer Program](https://developer.apple.com/documentation/safariservices/safari_web_extensions) just to distribute a singular *free* extension on the App Store.
  
  Alternative would be to manually distribute the extension, but there's the potential issue of codesigning, making for a very unpleasant installation process.
  
  Thanks Tim!

  [Would you like to know more?](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/post-9368925)
  | --- |
  ---
</details>

<br>

### Navigation

[Report a Bug](#issues) | [Known Bugs](https://github.com/users/doshidak/projects/2) | [Planned Features](https://github.com/users/doshidak/projects/1) | [Submit a PR](#prs)
--- | --- | --- | ---

<br>

# Developer Zone

> **Warning**  
> You are about to get in the zone, the developer zone.  
> If you do not wish to get in the zone, the developer zone, please visit the [**Smogon Forums post**](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/) instead.

<br>

## Developer SparkNotes™

> **Note**  
> This section is a work-in-progress.

This extension is written in **TypeScript**, which is essentially JavaScript on crack, using:

* **React** for the UI frontend (e.g., [Hellodex](./src/pages/Hellodex/Hellodex.tsx), [Calcdex](./src/pages/Calcdex/Calcdex.tsx)),
* **Redux** for global state management (e.g., [Calcdex state](./src/redux/store/calcdexSlice.ts)),
* [**RTK Query**](https://redux-toolkit.js.org) for global data management (e.g., [downloaded Smogon sets](./src/redux/services/presetApi.ts)),
* **Babel** for TypeScript transpilation (in lieu of [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html)),
* **ESLint** for *suggestive* code linting, and
* **webpack** for chunking & bundling.

<details>
  <summary>
    <table>
      <thead>
        <tr>
          <th>&nbsp;How It's Made™&nbsp;</tm>
        </tr>
      </thead>
    </table>
  </summary>

  ---

  > **Note**  
  > This section is a work-in-progress.

  [uhhhhhhhhh](https://youtube.com/watch?v=GcSfbaac9eg&t=29s)

  ---
  <br>
</details>

### Requirements

* **`node`** v18.0.0+
* **`yarn`** (Classic) v1.22.0+
* **`bash`** ([Windows WSL](https://docs.microsoft.com/en-us/windows/wsl/install), macOS, or Linux)

<br>

## ①&nbsp;&nbsp;Setup

> **Note**  
> If your browser is already configured for extension development, you can skip this part.

You'll need to apply some slight tweaks to your browser in order to directly install extensions from your local disk.

<details>
  <summary>
    &nbsp;<strong>Google Chrome</strong>
  </summary>

  1. Navigate to the **Chrome extensions** page (`chrome://extensions`).
  2. Enable **Developer mode** in the top-right corner.
  3. Verify that the **Load unpacked** option is available.
</details>

<details>
  <summary>
    &nbsp;<strong>Mozilla Firefox</strong>
  </summary>

  1. Navigate to the **Advanced Preferences** page (`about:config`).
  2. Search for the preference `xpinstall.signatures.required`.
  3. Set the preference's value to `false` (typically `true` by default).
  4. Navigate to the **Debugging** page (`about:debugging`).
  5. Select **This Firefox** on the left-hand panel.
  6. Verify that the **Temporary Extensions** section and the **Load Temporary Add-on...** option are available.
</details>

<br>

## ②&nbsp;&nbsp;Installation

> **Note**  
> These instructions are for building the extension from **source**.  

1. `cd` into your favorite directory.
2. `git clone git@github.com:doshidak/showdex.git`
3. `cd showdex`
4. `yarn`

<details>
  <summary>
    <table>
      <thead>
        <tr>
          <th>&nbsp;Post-Installation Scripts&nbsp;</th>
        </tr>
      </thead>
    </table>
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

<br>

## ③&nbsp;&nbsp;Development

> **Note**  
> `yarn dev` is an alias of `yarn dev:chrome`.

1. `cd showdex`
2. `yarn dev:chrome` or `yarn dev:firefox`

<br>

> **Warning**  
> Although this project makes use of TypeScript & ESLint, they are only used *suggestively*. In other words, your code will still compile even if you have errors!

Built contents will be dumped into a **`build` directory** in the project root (will be created if it doesn't exist).

<details>
  <summary>
    &nbsp;<strong>Google Chrome</strong>
  </summary>

  ---

  1. Navigate to `chrome://extensions`.
  2. Select **Load unpacked**.
  3. Point to the `chrome` sub-directory in `build`.
  4. Verify the extension appears in the list.
  5. Navigate to [Pokémon Showdown](https://play.pokemonshowdown.com).
  6. Play or spectate a battle.

  ---
</details>

<details>
  <summary>
    &nbsp;<strong>Mozilla Firefox</strong>
  </summary>

  ---

  1. Navigate to `about:debugging`.
  2. Select **Load Temporary Add-on**.
  3. Point to the `showdex-...-dev.firefox.xpi` in `build`.
  4. Verify the extension appears under **Temporary Extensions**.
  5. Navigate to [Pokémon Showdown](https://play.pokemonshowdown.com).
  6. Play or spectate a battle.

  ---
</details>

<br>

<details>
  <summary>
    <table>
      <thead>
        <tr>
          <th>&nbsp;"Hot" Reloading&nbsp;</th>
        </tr>
      </thead>
    </table>
  </summary>

  ---

  > **Warning**  
  > Hot-reloading is a bit of a mess right now since it requires you to reload the extension and refresh Pokémon Showdown. Will figure out a better system in the future.

  While `yarn dev:chrome` or `yarn dev:firefox` is running, Webpack will trigger a re-compilation of the bundle when files are changed in the [`src`](./src) directory.

  * For **Chrome**, you'll need to select the **reload icon** button in the **Chrome extensions** page (`chrome://extensions`). Once reloaded, **refresh** Pokémon Showdown to see your changes.
  * For **Firefox**, you'll need to **Reload** the extension in the **Debugging** page (`about:debugging`). Once reloaded, **refresh** Pokémon Showdown to see your changes.

  ---
</details>

<br>

## ④&nbsp;&nbsp;Building

> **Note**  
> `yarn build` is an alias of `yarn build:chrome && yarn build:firefox`.

1. `cd showdex`
2. `yarn build:chrome` or `yarn build:firefox`

<br>

> **Warning**  
> As mentioned in the [**Development**](#development) section, TypeScript & ESLint are configured to be *suggestive*, so your code will still compile even if you have errors!

Built contents will be dumped into a **`dist` directory** in the project root (will be created if it doesn't exist).

There will be an un-zipped directory named after the `BUILD_TARGET` env (e.g., `chrome`, `firefox`) containing all the bundled files, as well as:

* For **Chrome**, a packaged extension under `showdex-...chrome.zip` in `dist`, and
* For **Firefox**, a packaged extension under `showdex-...firefox.xpi` in `dist`.

<details>
  <summary>
    <table>
      <thead>
        <tr>
          <th>&nbsp;What's the HTML file?&nbsp;</th>
        </tr>
      </thead>
    </table>
  </summary>

  ---
  Builds for each target come with their very own bundle size pie chart, showing you exactly which modules in the bundle are too **thicc**. Particularly useful for finding modules to [chunk](https://webpack.js.org/guides/code-splitting), especially since [AMO](https://addons.mozilla.org) enforces a 5 MB size limit per file.

  * Bundle size analysis is written to `showdex-...[BUILD_TARGET].html` in `dist`.
  ---
</details>

<br>

# Contributing

<p align="center">
  <strong>
    (ﾉ◕ヮ◕)ﾉ* :･ﾟ✧&nbsp;&nbsp;Issues & PRs (Pull Requests) are <em>very</em> welcome!&nbsp;&nbsp;✧ﾟ･: *ヽ(◕ヮ◕ヽ)
  </strong>
</p>

<br>

## Issues

**Found a bug? · Got a cool idea? · Have suggestions? · Hate these questions & demand answers?**

> I'm not a stickler for how these should be formatted; just make sure you provide enough info for me to work off of.
>
> If possible, including the following would be **immensely** helpful!
>
> * **Browser** (e.g., Chrome, Firefox, etc.)
> * **Showdex Version** (e.g., v1.0.4)
> * **Format**, if applicable (e.g., Gen 8 National Dex)

<br>

&nbsp;[Create a New Issue](https://github.com/doshidak/showdex/issues/new)&nbsp;
--- |

<br>

## PRs

**Fixed a bug? · Added something cool?**

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli)

> Not a stickler with these either, but at the very least, please:
>
> * **Fork** this repo & **commit** changes to your fork,
> * **Style** your code according to the [**ESLint rules**](./.eslintrc.json),
> * **Create** a PR from your fork to this repo, and
> * **Provide** a brief description of your changes in your PR.
>
> Although this project makes use of [**Commitizen**](http://commitizen.github.io/cz-cli), you don't need to format your commit messages this way. Use whatever you're comfortable with!
>
> Additionally, I don't make use of any fancy automations like CI (Continuous Integration), so each PR will be manually reviewed. Your patience is greatly appreciated!

<br>

&nbsp;[Fork Me on GitHub](https://github.com/doshidak/showdex/fork)&nbsp;
--- |

<br>

# Credits

big thank to:

* [**camdawgboi**](https://smogon.com/forums/members/camboi.435338) for the idea & UI/UX design,
* [**ttoki**](https://smogon.com/forums/members/ttoki.606212) for being our first tester,
* [**Smogon Dev Team**](https://github.com/smogon) & the [**`@smogon/calc` Maintainers & Contributors**](https://github.com/smogon/damage-calc) for the sauce,
* [**pre**](https://smogon.com/forums/members/pre.10544) & [**pkmn.cc**](https://pkmn.cc) for keeping the Smogon sets hot, fresh & downloadable,
* [**Austin**](https://smogon.com/forums/members/austin.231659) for the endorsement & support,
* [**Honko**](https://smogon.com/forums/members/honko.42413) for the original damage calculator,
* [**Zarel**](https://smogon.com/forums/members/zarel.102803) & the [**Showdown Staff & Contributors**](https://pokemonshowdown.com/credits) for this would literally be nothing without them,
* **Game Freak** & **Nintendo** for good game (plz don't sue us lol), and
* [**sumfuk**](https://smogon.com/forums/members/bot-keith.580065) ???

<br>

## Donators

big sparkly thank to this fine individual for their generous support!

<table>
  <tbody>
    <tr>
      <td align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Nate M.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
    </tr>
  </tbody>
</table>

&nbsp;&nbsp;**(づ￣ ³￣)づ**

<br>

## Contributors

another big thank to these fine people for helping with development!

<table>
  <tbody>
    <tr>
      <td align="center">&nbsp;<a href="https://github.com/SpiffyTheSpaceman"><strong>SpiffyTheSpaceman</strong></a>&nbsp;</td>
      <td align="center">&nbsp;<a href="https://smogon.com/forums/members/malaow3.507739"><strong>malaow3</strong></a> · <a href="https://github.com/malaow3">GitHub</a>&nbsp;</td>
    </tr>
  </tbody>
</table>

...and finally, big thank to these fine people who helped improve **Showdex**!

<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://smogon.com/forums/members/85percent.457453"><strong>85percent</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/aim.53807"><strong>aim</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/baloor.342365"><strong>Baloor</strong></a></td>
      <td align="center"><a href="https://www.smogon.com/forums/members/chrispbacon.544502"><strong>ChrisPBacon</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/clastia.545372"><strong>Clastia</strong></a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://smogon.com/forums/members/darkphoenix911.247845"><strong>DarkPhoenix911</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/dex.277988"><strong>dex</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/ducky.525446"><strong>Ducky</strong></a></td>
      <td align="center"><a href="https://www.reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in0yafl"><strong>Fitah_</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/furret4ssb.518775"><strong>Furret4ssb</strong></a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://www.smogon.com/forums/members/ketchuppainting.610401"><strong>ketchuppainting</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/kibo.552274"><strong>Kibo</strong></a></td>
      <td align="center"><a href="https://www.reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in7624p"><strong>kirito_1707</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/lighthouse64.322009"><strong>lighthouse64</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/machjacob.555741"><strong>MachJacob</strong></a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://smogon.com/forums/members/maxouille.390049"><strong>Maxouille</strong></a> · <a href="https://github.com/Maxouille64">GH</a></td>
      <td align="center"><a href="https://www.reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in0zpcd"><strong>mdragon13</strong></a></td>
      <td align="center"><a href="https://github.com/mpique"><strong>mpique</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/nails.51373"><strong>Nails</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/paolode99.568718"><strong>paolode99</strong></a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://smogon.com/forums/members/runoisch.568189"><strong>Runoisch</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/shiox.495116"><strong>Shiox</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/shock3600.312963"><strong>Shock3600</strong></a> · <a href="https://github.com/Shock3600">GH</a></td>
      <td align="center"><a href="https://github.com/TheDebatingOne"><strong>TheDebatingOne</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/throhking.94778"><strong>ThrohKing</strong></a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://smogon.com/forums/members/tj.331538"><strong>TJ</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/trainerx493.121411"><strong>TrainerX493</strong></a></td>
      <td align="center"><a href="https://smogon.com/forums/members/zuils.596051"><strong>zuils</strong></a> · <a href="https://github.com/zuils">GH</a></td>
    </tr>
  </tbody>
</table>

&nbsp;&nbsp;**\ (•◡•) \/**
