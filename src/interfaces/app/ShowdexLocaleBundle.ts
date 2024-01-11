import { type ShowdexAssetBundle } from './ShowdexAssetBundle';

/**
 * Particular extended metadata about a particular loadable file containing translated strings bundled with this particular
 * build of Showdex in order to allow our non-English speaking friends get in on the Elo extraction action.
 *
 * @since 1.2.1
 */
export interface ShowdexLocaleBundle extends ShowdexAssetBundle {
  tag: 'locale';

  /**
   * Bundled locale's human-readable `locale`.
   *
   * @example 'US English'
   * @since 1.2.1
   */
  name: string;

  /**
   * Bundled locale's actual locale/language code.
   *
   * @example 'en-US'
   * @see https://docs.mojolicious.org/I18N/LangTags/List
   * @since 1.2.1
   */
  locale: string;
}
