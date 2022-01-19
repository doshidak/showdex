/**
 * ps-prefs.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license APGLv3
 */

declare namespace Showdown {
  interface PSPrefs extends PSStreamModel<string> {
    /**
     * @default false
     */
    dark: boolean;

    /**
     * Disables animated GIFs, but keeps other animations enabled.
     *
     * * `true` = disables GIFs, will be automatically re-enabled if you switch away from Chrome 64.
     * * `false` = enable GIFs all the time.
     * * `null` = enable GIFs only on Chrome 64.
     */
    nogif?: boolean;

    /**
     * Show "User joined" and "User left" messages.
     *
     * * `serverid:roomid` table.
     * * Uses `1` and `0` instead of `true` and `false` for JSON packing reasons.
     */
    showjoins?: {
      [serverid: string]: {
        [roomid: string]: 1 | 0;
      };
    };

    /**
     * * `true` = one panel
     * * `false` = two panels, left and right
     *
     * @default false
     */
    onepanel: boolean;

    /**
     * @default false
     */
    mute: boolean;

    /**
     * @default 50
     */
    effectvolume: number;

    /**
     * @default 50
     */
    musicvolume: number;

    /**
     * @default 50
     */
    notifvolume: number;

    /**
     * @default ''
     */
    storageEngine: 'localStorage' | 'iframeLocalStorage' | '';

    /**
     * @default {}
     */
    storage: Record<string, unknown>;

    /**
     * @default `${Config.routes.client}`
     */
    readonly origin: string;

    (): this;

    /**
     * Change a preference.
     */
    set<T extends keyof PSPrefs>(key: T, value: PSPrefs[T]): void;
    load<T extends keyof PSPrefs>(newPrefs: T, noSave?: boolean): void;
    save(): void;
    fixPrefs<T extends Record<string, unknown>>(prefs: T): void;
  }
}
