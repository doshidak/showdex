/**
 * @file `global.d.ts`
 *
 * Primary file that declares globals.
 *
 * * Note that other files in the `types` directory may also declare globals.
 *   - Though, they should be moved here lol.
 *
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.0
 */

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

// typings for importing SCSS Module files
declare module '*.module.scss' {
  const styles: { [className: string]: string; };

  export default styles;
}

// Showdown-specific globals (does not declare all of them!)
declare const app: Showdown.ClientApp;
declare const Config: Showdown.PSConfig;
declare const Dex: Showdown.Dex; /** @todo convert to declare class Dex in battle-dex.d.ts */
declare const BattleAbilities: Showdown.BattleAbilities;
declare const BattleFormats: Showdown.BattleFormats;
declare const BattleItems: Showdown.BattleItems;
declare const BattleMovedex: Showdown.BattleMovedex;
declare const BattleTeambuilderTable: Showdown.BattleTeambuilderTable;
declare class BattleStatGuesser extends Showdown.BattleStatGuesser {}
declare const UserPopup: Showdown.UserPopup;

/**
 * Showdown's custom `Storage` object.
 *
 * * Requires LOTS of type assertions since `Storage` is technically a built-in native Web API,
 *   specifically from the Web Storage API.
 * * Not recommended that you bind any function in here, since the referenced `Storage` is subject
 *   to change at any point during runtime!
 *   - Especially when the `data` object is asynchronously populated.
 *
 * @example
 * ```ts
 * // this will fail since TypeScript will think we're accessing the Web Storage API
 * Storage.prefs('theme');
 * //      ^~~ Property 'prefs' does not exist on type
 * //          `{ new (): Storage; prototype: Storage; }`.
 *
 * // hence the forceful type assertions here
 * (Storage as unknown as Showdown.ClientStorage).prefs('theme');
 * ```
 * @since 1.0.3
 */
declare const Storage: Showdown.ClientStorage;
