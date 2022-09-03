<h1 align="center">
  <code>showdex</code>
</h1>

Current [v0.1.3](https://github.com/doshidak/showdex/releases/tag/v0.1.3) | [~~Forum Post~~](/) | [Chrome Store](https://chrome.google.com/webstore/detail/dabpnahpcemkfbgfbmegmncjllieilai) | [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli)
--- | --- | --- | ---

<p align="center">
  <img alt="showdex-cover-photo" width="75%" src="./src/assets/img/showdex-cover.png">
</p>

> **Note**  
> Currently only works on **Chrome**. Support for other browsers coming soon.

**Showdex** is a Chrome extension for [Pokémon Showdown](https://pokemonshowdown.com) that brings the [Damage Calculator](https://calc.pokemonshowdown.com) you know and love right into your battle! Automatically syncs all Pokémon and field conditions as you play, so you can spend *less time* shitting brix and *more time* [hitting kicks](https://www.smogon.com/dex/ss/moves/high-jump-kick).

* [**Planned Features**](https://github.com/users/doshidak/projects/1)
* [**Known Issues**](https://github.com/users/doshidak/projects/2)

## Developer SparkNotes™

> **Warning**  
> This technical document is of a technical nature.  
> For the non-technical document of a non-technical nature, please visit the [~~forum post~~](/).

> **Note**  
> This section is a work-in-progress.

This extension is written in **TypeScript**, which is essentially JavaScript on crack, using:

* **React** for the UI frontend (e.g., [Hellodex](./src/pages/Hellodex/Hellodex.tsx), [Calcdex](./src/pages/Calcdex/Calcdex.tsx)),
* **Redux** for global state management (e.g., [Calcdex state](./src/redux/store/calcdexSlice.ts)),
* [**RTK Query**](https://redux-toolkit.js.org) for global data management (e.g., [downloaded Smogon sets](./src/redux/services/presetApi.ts)),
* **Babel** for TypeScript transpilation, and
* **Webpack** for bundling.

### Setup

> **Note**  
> These instructions are for building the extension from **source**.  

1. `cd` into your favorite local directory.
1. `git clone git@github.com:doshidak/showdex.git`
1. `cd showdex`
1. `yarn`

#### Patching

> **Warning**  
> This part is critical if you want to `git commit`!

1. `cd showdex`
1. `yarn patch-ghooks`

> **Note**  
> This patch is local to your build only, so you'll need to do this **once** for each local repo (even if it's on the same machine!).

<details>
  <summary><strong>u w0t ?</strong></summary>

  > This project is configured for **ES Modules** (as opposed to ye olde **CommonJS**), but also makes use of [`cz-customizable`](https://github.com/leoforfree/cz-customizable), which requires [`cz-customizable-ghooks`](https://github.com/uglow/cz-customizable-ghooks), which requires [`ghooks`](https://github.com/ghooks-org/ghooks).
  >
  > Node v18 doesn't allow you to run extensionless files (such as `.git/hooks/commit-msg`), which `ghooks` poops out, so [`yarn patch-ghooks`](./scripts/patch-ghooks.sh) adds `.js` at the end of each pooped out file (e.g., `.git/hooks/commit-msg.js`).
  >
  > Otherwise, Node will complain about running an extensionless file and critically fail when you attempt to make a `git commit`.
</details>

### Development

1. `cd showdex`
1. `yarn dev`

Built contents will be dumped into a **`build` directory** in the project root (will be created if it doesn't exist).

1. Navigate to the **Chrome extensions page** (`chrome://extensions`).
1. Enable **Developer mode** in the top-right corner (if you haven't already).
1. Select **Load unpacked**.
1. Point to the `build` directory.
1. Verify the extension appears in the list.
1. Navigate to [Pokémon Showdown](https://play.pokemonshowdown.com).
1. Play or spectate a battle.

#### Hot-Reloading

While `yarn dev` is running, Webpack will trigger a re-compilation of the bundle when files are changed in the [`src`](./src) directory.

You will need to select the **reload button** in the **Chrome extensions page** (`chrome://extensions`) and refresh Pokémon Showdown to see your changes.

### Building

1. `cd showdex`
1. `yarn build`

Built contents will be dumped into a **`dist` directory** in the project root (will be created if it doesn't exist).

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
* **Austin** for the validation and support,
* **Honko** for the original damage calculator,
* **Zarel** and the [**Showdown Staff & Contributors**](https://pokemonshowdown.com/credits) for this would literally be nothing without them,
* **Game Freak** and **Nintendo** for good game (plz don't sue us lol), and
* [**sumfuk**](https://pokemonshowdown.com/users/sumfuk) ???
