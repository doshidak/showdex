/**
 * @file `window.d.ts`
 *
 * Declarations extending the `window` browser global.
 *
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.1
 */

declare interface Window {
  /**
   * Showdex will populate this with its `BUILD_NAME` env once initialization starts to prevent other Showdexes from
   * potentially loading in.
   *
   * @example 'showdex-v1.2.1-b18CF1B54BEF.chrome'
   * @since 1.2.1
   */
  __SHOWDEX_INIT?: string;
}
