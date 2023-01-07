<p align="center">
  <img alt="showdex-icon" width="250px" src="./src/assets/favicons/showdex-1024.png">
</p>

<h1 align="center">
  <code>showdex</code>
</h1>

<table align="center">
  <thead>
    <tr>
      <th align="center">&nbsp;Current <a href="https://github.com/doshidak/showdex/releases/tag/v1.1.2">v1.1.2</a>&nbsp;</th>
      <th align="center">&nbsp;Install on <a href="https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai">Chrome · Opera · Edge · Brave</a> · <a href="https://addons.mozilla.org/en-US/firefox/addon/showdex">Firefox</a> · <a href="https://apps.apple.com/us/app/enhanced-tooltips-for-showdown/id1612964050">Safari</a>&nbsp;</th>
      <th align="center">&nbsp;Discuss on <a href="https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265">Smogon</a></th>
    </tr>
  </thead>
</table>

<br>

**Showdex** is a browser extension for [Pokémon Showdown](https://pokemonshowdown.com) that brings the [Damage Calculator](https://calc.pokemonshowdown.com) you know & love right into your battle! Automatically syncs all Pokémon & field conditions as you play, so you can spend *less time* shitting brix & *more time* [hitting kicks](https://www.smogon.com/dex/sv/moves/high-jump-kick).

<br>

Fully supported on [**Chrome**](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) (+ any native [**Chromium**](https://www.chromium.org/Home) browser, like **Opera**, **Edge** & **Brave**) & [**Firefox**](https://addons.mozilla.org/en-US/firefox/addon/showdex).

<details>
  <summary>
    <strong>
      &nbsp;&nbsp;༼ つ ಥ_ಥ ༽つ&nbsp;&nbsp;Safari
    </strong>
    &nbsp;...?
  </summary>

  ---
  Unfortunately, we don't ~~ever~~ plan on *officially* supporting **Safari** since [Apple requires us to shell out $100/year for the Apple Developer Program](https://developer.apple.com/documentation/safariservices/safari_web_extensions) just to distribute a singular *free* extension on the App Store.

  Thanks Tim!

  Not all hope is lost, fortunately! [**Enhanced Tooltips for Showdown**](https://apps.apple.com/us/app/enhanced-tooltips-for-showdown/id1612964050) ([Source on GitHub](https://github.com/cbruegg/Enhanced-Tooltips-for-Showdown)), currently available on the App Store, bundles Showdex along with the [Enhanced Tooltips](https://github.com/rowin1/Pokemon-Showdown-Enhanced-Tooltips) & [Randbats Tooltip](https://github.com/pkmn/randbats) extensions. Note that the bundled Showdex is not officially supported, so questions regarding Showdex running on Safari should be directed towards the maintainer of the aforementioned App Store app, [Christian Brüggemann](https://cbruegg.com/enhanced-tooltips-for-showdown-support) ([Smogon](https://www.smogon.com/forums/members/cbruegg.585763) · [GitHub](https://github.com/cbruegg)).  

  [Would you like to know more?](https://smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/post-9368925)
  | --- |
  ---
</details>

<br>

<h3 align="center">
  Navigation
</h3>

<table align="center">
  <thead>
    <tr>
      <th>&nbsp;<a href="https://github.com/users/doshidak/projects/1">Planned Features</a>&nbsp;</th>
      <th>&nbsp;<a href="https://github.com/users/doshidak/projects/2">Known Bugs</a>&nbsp;</th>
    </tr>
  </thead>
</table>

<table align="center">
  <thead>
    <tr>
      <th>&nbsp;<a href="#issues">Suggest a Feature</a>&nbsp;</th>
      <th>&nbsp;<a href="#issues">Report a Bug</a>&nbsp;</th>
      <th>&nbsp;<a href="#prs">Contribute Code</a>&nbsp;</th>
    </tr>
  </thead>
</table>

<br>
<br>

<h1 align="center">
  Developer Zone
</h1>

> **Warning**  
> You are about to get in the zone, the developer zone.  
> If you do not wish to get in the zone, the developer zone, please visit the [**Smogon Forums post**](https://smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/) instead.

<br>

## Developer SparkNotes™

> **Note**  
> This section is a work-in-progress.

This extension is written in **TypeScript**, which is essentially JavaScript on crack, using:

* **React** for the UI frontend (e.g., [Hellodex](./src/pages/Hellodex/Hellodex.tsx), [Calcdex](./src/pages/Calcdex/Calcdex.tsx)),
* **Redux** for global state management (e.g., [Calcdex state](./src/redux/store/calcdexSlice.ts)),
* [**RTK Query**](https://redux-toolkit.js.org) for global data management (e.g., [downloaded Smogon sets](./src/redux/services/presetApi.ts)),
* **Babel** for TypeScript transpilation (in lieu of [`tsc`](https://typescriptlang.org/docs/handbook/compiler-options.html)),
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
  > More information coming soon!

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

<details>
  <summary>
    &nbsp;<strong>Mozilla Firefox for Android</strong>
  </summary>

  ---

  > **Note**  
  > More information coming soon!  
  > Though instructions aren't currently provided, this project supports [developing on **Firefox for Android Nightly**](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android).

  For now, see [these instructions from Mozilla](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/#set-up-your-computer-and-android-emulator-or-device) for setting up your Android device and **Firefox for Android Nightly** installation for extension development.

  ---
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
  > [Patch for `@smogon/calc`](./patches/%40smogon%2Bcalc%2B0.7.0.patch) incorporates all the changes up to the [`77334fa`](https://github.com/smogon/damage-calc/commit/77334fa0babdfb8cd49076d8c5ee7eff8d2bede8) commit, which adds support for Gen 9 & implements some Gen 9-specific mechanics, such as [*Supreme Overlord*](https://smogon.com/dex/sv/abilities/supreme-overlord). These changes are unpublished on [npm](https://npmjs.com/package/@smogon/calc) as Gen 9 support in `@smogon/calc` is considered experimental (at the time of writing on 2023/01/06). Not all Gen 9 mechanics are supported however, such as [*Rage Fist*](https://smogon.com/dex/sv/moves/rage-fist), [*Glaive Rush*](https://www.smogon.com/dex/sv/moves/glaive-rush) & [*Electromorphosis*](https://smogon.com/dex/sv/abilities/electromorphosis), so the Calcdex will handle these mechanics until native support for them are added. Additionally, the patch adds support for independently toggling the [*Protosynthesis*](https://smogon.com/dex/sv/abilities/protosynthesis) & [*Quark Drive*](https://smogon.com/dex/sv/abilities/quark-drive) abilities without the need for the [*Booster Energy*](https://smogon.com/dex/sv/items/booster-energy) item or updating field conditions, which can affect damage calculations (e.g., [*Knock Off*](https://smogon.com/dex/sv/moves/knock-off), [*Acrobatics*](https://smogon.com/dex/sv/moves/acrobatics), [Fire/Water-type moves from the Sun](https://smogon.com/dex/sv/moves/sunny-day)).
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

<details>
  <summary>
    &nbsp;<strong>Mozilla Firefox for Android</strong>
  </summary>

  ---

  > **Note**  
  > More information coming soon!  
  > Though instructions aren't currently provided, this project supports [developing on **Firefox for Android Nightly**](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android).

  For now, see [these instructions from Mozilla](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/#install-and-run-your-extension-in-firefox-for-android) for running the extension on your Android's **Firefox for Android Nightly** installation.

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

<details>
  <summary>
    <table>
      <thead>
        <tr>
          <th>&nbsp;Environment Variables&nbsp;</th>
        </tr>
      </thead>
    </table>
  </summary>

  ---

  > **Note**  
  > More information coming soon!

  uhhhhhh for now, check the [`.env`](./.env)

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

<h1 align="center">
  Contributing
</h1>

<p align="center">
  <strong>
    (ﾉ◕ヮ◕)ﾉ* :･ﾟ✧&nbsp;&nbsp;Issues & PRs (Pull Requests) are <em>very</em> welcome!&nbsp;&nbsp;✧ﾟ･: *ヽ(◕ヮ◕ヽ)
  </strong>
</p>

<br>

## Issues

**Found a bug? · Got a cool idea? · Have suggestions? · Hate these questions & demand answers?**

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](.github/CODE_OF_CONDUCT.md)

> Thanks for your help in making Showdex better for everyone!
>
> I'm not a stickler for how these should be formatted; just make sure you provide enough info for me to work off of. If you're having trouble running Showdex, please make sure you first try **turning off your other extensions** before opening an issue. This will help me narrow down the problem (e.g., your ad-blocker could potentially block Showdex from downloading sets!).
>
> If possible, including the following would be **immensely** helpful!
>
> * **OS** (e.g., Windows, macOS, Android, etc.)
> * **Browser** (e.g., Chrome, Firefox, etc.)
> * **Showdex Version** (e.g., v1.1.2)
> * **Format**, if applicable (e.g., Gen 9 National Dex AG)
>
> If you would like to be [credited for your contribution](#contributors), please also include your username on [**Smogon Forums**](https://smogon.com/forums). Otherwise, your **GitHub** username will be used, unless you don't want to be credited.

&nbsp;[Create a GitHub Issue](https://github.com/doshidak/showdex/issues/new)&nbsp;
--- |

<br>

> **No GitHub?** No problem!
>
> We're also listening for feedback & bug reports on our Showdex thread on Smogon Forums.

&nbsp;[Post on Smogon Forums](https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265)&nbsp;
--- |

<br>

> **Not on Smogon Forums?** Still, no problem!
>
> Feel free to contact me directly via email.

&nbsp;[Slide Into My Inbox](mailto:keith@tize.io)&nbsp;
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

&nbsp;[Fork Me on GitHub](https://github.com/doshidak/showdex/fork)&nbsp;
--- |

<br>

<h1 align="center">
  Credits
</h1>

big thank to:

* [**camdawgboi**](https://smogon.com/forums/members/camboi.435338) for the idea & UI/UX design,
* [**ttoki**](https://smogon.com/forums/members/ttoki.606212) for being our first tester,
* [**Smogon Dev Team**](https://github.com/smogon) & the [**`@smogon/calc` Maintainers & Contributors**](https://github.com/smogon/damage-calc) for the sauce,
* [**pre**](https://smogon.com/forums/members/pre.10544) & [**pkmn.cc**](https://pkmn.cc) for keeping the Smogon sets hot, fresh & downloadable,
* [**Austin**](https://smogon.com/forums/members/austin.231659) for the endorsement & support,
* [**Honko**](https://smogon.com/forums/members/honko.42413) for the O.G damage calculator,
* [**Zarel**](https://smogon.com/forums/members/zarel.102803) & the [**Showdown Staff & Contributors**](https://pokemonshowdown.com/credits) for this would literally be nothing without them,
* **Game Freak** & **Nintendo** for good game (plz don't sue us lol), and
* [**sumfuk**](https://smogon.com/forums/members/bot-keith.580065) ???

<br>

## Donators

big <strong>･ﾟ✧&nbsp;&nbsp;sparkly thank&nbsp;&nbsp;✧ﾟ･</strong> to these fine individuals for their generous support!

<table>
  <tbody>
    <tr>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Angie L.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Max B.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Michael L.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Jonathan M.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
    </tr>
    <tr>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Leman T.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Sunny B.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Connor M.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
      <td width="210px" align="center">&nbsp;･ﾟ✧&nbsp;&nbsp;<strong>Nate M.</strong>&nbsp;&nbsp;✧ﾟ･&nbsp;</td>
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
      <td width="220px" align="center"><a href="https://github.com/SpiffyTheSpaceman"><strong>SpiffyTheSpaceman</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/malaow3.507739"><strong>malaow3</strong></a> · <a href="https://github.com/malaow3">GitHub</a></td>
    </tr>
  </tbody>
</table>

...and finally, big thank to these fine people who helped improve **Showdex**!

<table>
  <tbody>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/85percent.457453"><strong>85percent</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/a_wild_noob_appeared.297668"><strong>A_Wild_Noob_Appeared!</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/aim.53807"><strong>aim</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/andviet.70213"><strong>AndViet</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/baloor.342365"><strong>Baloor</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/cbruegg.585763"><strong>cbruegg</strong></a> · <a href="https://github.com/cbruegg">GitHub</a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/chrispbacon.544502"><strong>ChrisPBacon</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/clastia.545372"><strong>Clastia</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/coral-fan.566409"><strong>coral fan</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/darkphoenix911.247845"><strong>DarkPhoenix911</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/dex.277988"><strong>dex</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/ducky.525446"><strong>Ducky</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in0yafl"><strong>Fitah_</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/furret4ssb.518775"><strong>Furret4ssb</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/ihatepasswords.611420"><strong>IHatePasswords</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/iodyne.567157"><strong>Iodyne</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/ketchuppainting.610401"><strong>ketchuppainting</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/kibo.552274"><strong>Kibo</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/kirigon.349282"><strong>Kirigon</strong></a></td>
      <td width="220px" align="center"><a href="https://reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in7624p"><strong>kirito_1707</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/lighthouse64.322009"><strong>lighthouse64</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/machjacob.555741"><strong>MachJacob</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/maxouille.390049"><strong>Maxouille</strong></a> · <a href="https://github.com/Maxouille64">GitHub</a></td>
      <td width="220px" align="center"><a href="https://reddit.com/r/pokemonshowdown/comments/x5bi27/showdex_an_autoupdating_damage_calculator_built/in0zpcd"><strong>mdragon13</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/mia.425427"><strong>Mia</strong></a> · <a href="https://github.com/mia-pi-git">GitHub</a></td>
      <td width="220px" align="center"><a href="https://github.com/mpique"><strong>mpique</strong></a></td>
      <td width="220px" align="center"><a href="https://github.com/mnittsch"><strong>mnittsch</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/nails.51373"><strong>Nails</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/orangelego21.315566"><strong>orangelego21</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/paolode99.568718"><strong>paolode99</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/runoisch.568189"><strong>Runoisch</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/ry4242.551466"><strong>ry4242</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/sabelette.583793"><strong>Sabelette</strong></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/shiox.495116"><strong>Shiox</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/shock3600.312963"><strong>Shock3600</strong></a> · <a href="https://github.com/Shock3600">GitHub</a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/sh0shin.557719"><strong>sh0shin</strong></a>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/singiamtel.382208"><strong>Singiamtel</strong></a> · <a href="https://github.com/singiamtel">GitHub</a></td>
      <td width="220px" align="center"><a href="https://github.com/TheDebatingOne"><strong>TheDebatingOne</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/throhking.94778"><strong>ThrohKing</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/tj.331538"><strong>TJ</strong></a></td>
    </tr>
    <tr>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/trainerx493.121411"><strong>TrainerX493</strong></a></td>
      <td width="220px" align="center"><a href="https://github.com/zooki2006"><strong>zooki2006</strong></a></td>
      <td width="220px" align="center"><a href="https://smogon.com/forums/members/zuils.596051"><strong>zuils</strong></a> · <a href="https://github.com/zuils">GitHub</a></td>
    </tr>
  </tbody>
</table>

&nbsp;&nbsp;**\ (•◡•) \/**
