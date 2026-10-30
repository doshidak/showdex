import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/dex/getDexDescription()');

/**
 * Returns the `desc` & `shortDesc` of the passed-in `effect` (i.e., an ability, item or move).
 *
 * * Newer Showdown clients no longer populate `desc` & `shortDesc` on the `Effect` itself, but instead serve them
 *   from separate per-language text tables (via `data/text/{lang}.js`), accessible through `dex.text.get()`.
 *   - This also applies any gen- & mod-specific overrides, as well as the user's selected Showdown language.
 * * Falls back to the `desc` & `shortDesc` on the `effect` for older clients that don't provide `dex.text`, or if
 *   the text tables haven't loaded yet (in which case `dex.text.get()` will throw).
 * * Both `desc` & `shortDesc` will fall back to each other if only one is available.
 * * Returns `null` for both if no `effect` was provided or no description could be found.
 * * Optionally specify the `lang` (e.g., `'en'`) when the description will be parsed rather than displayed,
 *   otherwise defaults to the user's Showdown language.
 *
 * @since 1.4.3
 */
export const getDexDescription = (
  dex: Showdown.ModdedDex,
  effect: Showdown.Ability | Showdown.Item | Showdown.Move,
  lang?: string,
): { desc: string; shortDesc: string; } => {
  if (!effect?.exists) {
    return { desc: null, shortDesc: null };
  }

  let text: ReturnType<NonNullable<Showdown.ModdedDex['text']>['get']> = null;

  if (typeof dex?.text?.get === 'function') {
    try {
      text = lang ? dex.text.get(effect, lang) : dex.text.get(effect);
    } catch (error) {
      if (__DEV__) {
        l.warn(
          'Failed to get text for', effect.effectType, effect.id,
          '\n', 'error', error,
          '\n', '(You will only see this warning on development.)',
        );
      }
    }
  }

  const desc = text?.desc || effect.desc || null;
  const shortDesc = text?.shortDesc || effect.shortDesc || null;

  return {
    desc: desc || shortDesc,
    shortDesc: shortDesc || desc,
  };
};
