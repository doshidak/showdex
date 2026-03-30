/**
 * @file `global.d.ts` - Primary file that declares globals.
 *
 * * Note that other files in the `types` directory may also declare globals.
 *   - Though, they should be moved here lol.
 *
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.0
 */

/// <reference types="chrome" />
/// <reference types="firefox-webext-browser" />

/**
 * Convenient `isDevelopment` or `NODE_ENV === 'development'` global.
 *
 * * Can be safely used anywhere in the `src` directory.
 *   - Only in JavaScript/TypeScript files, obviously.
 * * Looking for where this is defined?
 *   - See `webpack.config.js`.
 *
 * @since 0.1.0
 */
declare const __DEV__: NodeJS.Global['__DEV__'];

// Firefox-exclusive WebExtension content script globals
declare const exportFunction: FirefoxBrowser.ExportFunction;
declare const cloneInto: FirefoxBrowser.CloneInto;

// jQuery global (from @types/jquery — with moduleResolution: "Bundler", the .mts export is used
// which only exports named module exports; the global $ needs an explicit declare var here)
declare var $: JQueryStatic;

// Pokémon Showdown window globals (declared on Window via Showdown.HostGlobals, but TS6 requires
// explicit declare var for bare access in module files — window.X doesn't auto-declare X)
declare var Dex: Showdown.HostGlobals['Dex'];
declare var BattleAbilities: Showdown.HostGlobals['BattleAbilities'];
declare var BattleFormats: Showdown.HostGlobals['BattleFormats'];
declare var BattleItems: Showdown.HostGlobals['BattleItems'];
declare var BattleMovedex: Showdown.HostGlobals['BattleMovedex'];
declare var BattleStatGuesser: Showdown.HostGlobals['BattleStatGuesser'];
declare var BattleTeambuilderTable: Showdown.HostGlobals['BattleTeambuilderTable'];

// DOM `window` globals
declare interface Window extends Window, Showdown.HostGlobals {
  /**
   * Showdex will populate this with its `BUILD_NAME` env once initialization starts to prevent other Showdexes from
   * potentially loading in.
   *
   * @example
   * ```ts
   * 'showdex-v1.2.1-b18CF1B54BEF.chrome'
   * ```
   * @since 1.2.1
   */
  __SHOWDEX_INIT?: string;

  /**
   * Showdex will populate this based on the Showdown client's detected MVC (i.e., Model-View-Controller) engine.
   *
   * * When in `'preact'` mode, Showdex will utilize the new exposed `PSModel` globals (e.g., `window.BattleRoom`) during
   *   the bootstrapping process.
   *   - For backwards compatibilty, Showdex will revert to using its traditional dodgy hooks (assuming the `window.app`
   *     is present) should this value be falsy (or `'classic'`).
   * * Preact detection works by looking for the `window.PS` global, regardless of `window.app`'s existence.
   *   - `'classic'` (Backbone.js-powered) client won't have that aforementioned `window.PS` global.
   *
   * @since 1.3.0
   */
  __SHOWDEX_HOST?: 'classic' | 'preact';
}
