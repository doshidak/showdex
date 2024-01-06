import { type CalcdexPlayerKey, type CalcdexRenderMode } from '@showdex/interfaces/calc';
import { type CalcdexMatchupNhkoColors, type CalcdexMatchupNhkoLabels } from '@showdex/utils/calc';

/**
 * Calcdex-specific settings.
 *
 * @since 1.0.3
 */
export interface ShowdexCalcdexSettings {
  /**
   * How the Calcdex should automatically open once a battle starts.
   *
   * * `'always'` (default) will open the Calcdex for battles where the user is `'playing'` or `'spectating'`.
   * * `'playing'` will only open the Calcdex if the logged-in user is also a player in the battle.
   * * `'spectating'` will only open the Calcdex if the user is spectating a battle.
   * * `'never'` will completely disable the Calcdex, making this extension kinda useless.
   *
   * @default 'always'
   * @since 1.0.3
   */
  openOnStart: 'always' | 'playing' | 'spectating' | 'never';

  /**
   * How the Calcdex should open when opened.
   *
   * * `'showdown'` (default) will open the Calcdex based on the panel layout in Showdown's graphic settings.
   *   - Left-right panels will use `'overlay'`.
   *   - Single panel will use `'panel'`.
   *   - Similar functionality to `forcedColorScheme` in the `ShowdexSettings`.
   * * `'panel'` will open the Calcdex in its own panel.
   * * `'overlay'` will open the Calcdex as an overlay over the battle chat.
   *   - Useful for single-panel mode users or those who are annoyed by the accumulating tabs when set to `'panel'`.
   *   - In this mode, a button will be added next to the battle timer to open the Calcdex.
   *
   * @default 'showdown'
   * @since 1.0.3
   */
  openAs: 'showdown' | CalcdexRenderMode;

  /**
   * Which panel the Calcdex panel tab should open on in Left-Right panel mode.
   *
   * * `'showdown'` (default) will open the Calcdex panel tab depending on Showdown's battle settings.
   *   - Battles opening on the left (default Showdown behavior) will use `'right'`.
   *   - Battles opening on the right will use `'right'`.
   * * `'left'` will always open the Calcdex panel tab on the left.
   *   - Calcdex room will become the page URL, which will load an uninitialized Calcdex when the page is refreshed
   *     with a battle on the right side.
   * * `'right'` will always open the Calcdex panel tab on the right.
   * * Has no effect if `openAs` is `'overlay'`.
   *
   * @default 'showdown'
   * @since 1.1.1
   */
  openOnPanel: 'showdown' | 'left' | 'right';

  /**
   * How the Calcdex panel tab automatically closes.
   *
   * * `'battle-end'` will close the Calcdex panel tab when the battle ends.
   * * `'battle-tab'` will close the Calcdex panel tab when the user closes the battle tab.
   *   - More specifically, we'll be hooking into the `BattleRoom`'s `onRequestLeave()`
   *     (invoked by `app.leaveRoom()`, which is invoked by the user clicking the "X" button)
   *     to detect when the user closes the battle tab (as opposed to switching to another tab).
   *   - This is probably more safe than directly hooking into the globally used `app.leaveRoom()`.
   * * `'never'` refers to the automatic closing mechanism.
   *   - Users will still be able to close the tab *manually*!
   * * Has no effect if `openAs` is `'overlay'`.
   *
   * @default 'battle-tab'
   * @since 1.0.4
   */
  closeOn: 'battle-end' | 'battle-tab' | 'never';

  /**
   * Whether the Calcdex should be destroyed from the Redux state when the panel tab is closed.
   *
   * * If `true`, Calcdex won't be able to be reopened once closed.
   * * Enabling this may help with performance, especially with multiple Calcdexes in a single Showdown session.
   * * This also applies if `closeOnEnd` is `true`.
   * * Has no effect if `openAs` is `'overlay'`.
   *
   * @default true
   * @since 1.0.3
   */
  destroyOnClose: boolean;

  /**
   * Default auto-select settings per side.
   *
   * * `auth` pertains to whichever side the logged-in user is playing as.
   *   - Will override the side's setting that `auth` pertains to with the value of `auth`.
   * * Though `p3` and `p4` are defined, they currently aren't being used.
   *
   * @default
   * ```ts
   * {
   *   auth: true,
   *   p1: true,
   *   p2: true,
   *   p3: true,
   *   p4: true,
   * }
   * ```
   * @since 1.0.3
   */
  defaultAutoSelect: Record<'auth' | CalcdexPlayerKey, boolean>;

  /**
   * Whether to show player ratings if they're available.
   *
   * @default true
   * @since 1.0.3
   */
  showPlayerRatings: boolean;

  /**
   * Position that the logged-in player should always be at.
   *
   * * `'auto'` will use the side that the logged-in player is in the battle.
   *   - If the logged-in player is `p1`, they will be on the `'top'`.
   *   - If the logged-in player is `p2`, they will be on the `'bottom'`.
   * * Has no effect if the logged-in user is spectating a battle, obviously.
   *
   * @default 'top'
   * @since 1.0.3
   */
  authPosition: 'top' | 'bottom' | 'auto';

  /**
   * Whether to show Pokemon nicknames.
   *
   * * If `false` (default), the Pokemon's current `speciesForme` will be shown instead.
   * * Note that if this is `true`, the only way to see the Pokemon's current `speciesForme` is through the tooltip.
   *   - Mostly pertains to Pokemon with switchable `altFormes`.
   *
   * @default false
   * @since 1.0.3
   */
  showNicknames: boolean;

  /**
   * Whether to open the Pokemon's *Smogon Univeristy* page when the configured button is clicked on.
   *
   * * Configured button depends on `reverseIconName`.
   *
   * @default true
   * @since 1.0.6
   */
  openSmogonPage: boolean;

  /**
   * Whether to show all possible abilities/items/moves in legal-locked formats.
   *
   * @default false
   * @since 1.0.3
   */
  showAllOptions: boolean;

  /**
   * Whether to initially show the spreads (instead of natures) dropdown whenever spreads are available.
   *
   * * Spreads are typically derived from the applied preset & usage stats.
   *   - See `buildSpreadOptions()` in `@showdex/utils/ui` for how they're actually derived.
   * * If spreads are available, a toggle will be shown to allow the user to switch between spreads & natures.
   *   - In this case, this option will show spreads first.
   * * Has no effect if there aren't any spreads available for the given Pokemon.
   *   - In this case, only the natures dropdown will be shown without the toggle visible.
   *
   * @default false
   * @since 1.1.8
   */
  showSpreadsFirst: boolean;

  /**
   * Whether to show "N/A" damage ranges, which are typically from status moves.
   *
   * * Disabling this will prevent the matchup tooltip from appearing,
   *   even though it'll say 0 damage lol.
   *
   * @default true
   * @since 1.0.3
   */
  showNonDamageRanges: boolean;

  /**
   * Whether to download Smogon sets.
   *
   * * Does not include Smogon sets for Randoms.
   *   - Actually a separate setting: `downloadRandomsPresets`.
   * * Disabling this may improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadSmogonPresets: boolean;

  /**
   * Whether to download Randoms sets.
   *
   * * Disabling this may *slightly* improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadRandomsPresets: boolean;

  /**
   * Whether to download Showdown usage stats.
   *
   * * Disabling this may *slightly* improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadUsageStats: boolean;

  /**
   * Maximum age of cached presets in *days*.
   *
   * @default
   * ```ts
   * 7 // a week
   * ```
   * @since 1.1.6
   */
  maxPresetAge: number;

  /**
   * Whether the first preset applied to the Pokemon should be from the Showdown usage stats.
   *
   * * Has no effect if `downloadUsageStats` is `false`.
   *
   * @default false
   * @since 1.0.3
   */
  prioritizeUsageStats: boolean;

  /**
   * Whether local Teambuilder presets should be included.
   *
   * * `'always'` will include **both** Teambuilder teams and boxes.
   * * `'teams'` will only include Teambuilder teams, ignoring boxes.
   * * `'boxes'` will only include Teambuilder boxes, ignoring teams.
   *   - Teambuilder preset detection for `Showdown.ServerPokemon` (in `guessTeambuilderPreset()`) will still
   *     look for teams, but won't show them as dropdown options.
   * * `'never'` will never include Teambuilder presets.
   *   - Pokemon's `serverSpread` will be guessed, which may lead to Chinese EVs/IVs and an incorrect nature.
   * * Has no effect in Randoms formats, obviously!
   * * Fun fact: this setting, though introduced in v1.0.3, has been implemented in v1.1.2.
   *   - ...At least we got to it finally!
   *
   * @default 'always'
   * @since 1.0.3
   */
  includeTeambuilder: 'always' | 'teams' | 'boxes' | 'never';

  /**
   * Whether to include OM (Other Metagame) presets, like AAA (Almost Any Ability), in legal-locked formats, like OU.
   *
   * * Affects presets of any source, including `'storage'`/`'storage-box'` (i.e., Teambuilder) & `'smogon'`.
   *   - `'server'`, `'sheet'` & `'import'` sources will always be of the current format, so this won't have any effect.
   * * Has no effect if the current format is an OM (otherwise we'd have no presets, duh!).
   * * When disabled (default), any preset with a non-legal-locked format as determined by `legalLockedFormat()` will
   *   be omitted from the auto-preset & preset options.
   *
   * @default false
   * @since 1.2.1
   */
  includeOtherMetaPresets: boolean;

  /**
   * Additional bundled presets to load, if any.
   *
   * * These can only be selected from if the metadata for each bundled preset is defined in `ShowdexPresetsBundles[]`
   *   from `@showdex/consts/app`.
   * * Each value refers to the bundle's `id`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.2.1
   */
  includePresetsBundles: string[];

  /**
   * Whether to auto-import and apply presets derived from open team sheets or the `!showteam` chat command.
   *
   * @default true
   * @since 1.1.3
   */
  autoImportTeamSheets: boolean;

  /**
   * Whether to auto-export the opponent's team to the Teambuilder once the battle ends.
   *
   * * If `true`, will be exported to its own Teambuilder folder called "Showdex".
   *
   * @deprecated As of v1.0.3, this currently does nothing.
   * @default false
   * @since 1.0.3
   */
  autoExportOpponent: boolean;

  /**
   * Default auto-move selection per side.
   *
   * * Despite the `autoMoves` setting pertaining to each Pokemon, the determined setting will be set for
   *   every Pokemon in the side, functioning more as the initial value.
   *   - User should be able to tweak the `autoMoves` setting for each individual Pokemon afterwards.
   * * `auth` pertains to whichever side the logged-in user is playing as.
   *   - Will override the side's setting that `auth` pertains to with the value of `auth`.
   * * Though `p3` and `p4` are defined, they currently aren't being used.
   *
   * @default
   * ```ts
   * {
   *   auth: false,
   *   p1: true,
   *   p2: true,
   *   p3: true,
   *   p4: true,
   * }
   * ```
   * @since 1.0.3
   */
  defaultAutoMoves: Record<'auth' | CalcdexPlayerKey, boolean>;

  /**
   * Whether to always show the Pokemon's non-volatile status, even if it has none.
   *
   * * Which in that case, "OK" will be shown for the abbreviation shown in the `PokeStatus` component.
   *
   * @default true
   * @since 1.1.6
   */
  forceNonVolatile: boolean;

  /**
   * When to allow the Pokemon's types to be edited when clicked on.
   *
   * * `'always'` will always allow the types to be edited.
   * * `'meta'` will only show the *Edit* button in nonstandard metagame formats.
   *   - Essentially, this applies to any format that's not included in `LegalLockedFormats`.
   * * `'never'` will never allow the types to be edited.
   *   - Types cannot be clicked on when this is selected.
   *
   * @default 'meta'
   * @since 1.0.6
   */
  editPokemonTypes: 'always' | 'meta' | 'never';

  /**
   * Whether to lock the *Tera* toggle button in the moves table once used by the player.
   *
   * * This may be useful for remembering if a player can Terastallize still.
   *   - Note that this information will also be shown when hovering over the toggle button
   *     while the battle is active, regardless of the value of `showUiTooltips`.
   * * Once the battle ends, the toggle button will be re-enabled.
   * * This is off by default (i.e., `false`) to make this setting opt-in based on user feedback.
   * * Only applies to Gen 9, obviously.
   *
   * @default false
   * @since 1.1.5
   */
  lockUsedTera: boolean;

  /**
   * When to show the *Edit* button in the moves table.
   *
   * * `'always'` will always show the *Edit* button.
   * * `'meta'` will only show the *Edit* button in nonstandard metagame formats.
   *   - Essentially, this applies to any format that's not included in `LegalLockedFormats`.
   * * `'never'` will never show the *Edit* button.
   *
   * @default 'meta'
   * @since 1.0.6
   */
  showMoveEditor: 'always' | 'meta' | 'never';

  /**
   * Whether to dynamically show quick editor fields in the moves table.
   *
   * * For now, this is only being used to allow quick setting of the `hits` property of a given `CalcdexMoveOverride`.
   *   - For example, when enabled, the move *Icicle Spear*, a multi-hitting move, will show a number input representing
   *     the number of hits, followed by the same 'ol damage range text.
   *   - Additionally, the `hits` property can be edited within the moves editor, enabled via `showMoveEditor`.
   *   - (If the move editor is disabled, then the quick editor fields are the only ways to change the values.)
   *
   * @default true
   * @since 1.2.0
   */
  enableQuickEditor: boolean;

  /**
   * Whether to allow the Pokemon's base stats to be edited in the stats table.
   *
   * * `'always'` will always show the base stats.
   * * `'meta'` will only show the base stats in nonstandard metagame formats.
   *   - Essentially, this applies to any format that's not included in `LegalLockedFormats`.
   * * `'never'` will never show the base stats.
   *
   * @default 'meta'
   * @since 1.0.6
   */
  showBaseStats: 'always' | 'meta' | 'never';

  /**
   * Whether to show EVs in legacy gens.
   *
   * * Note that while the EV system itself wasn't introduced until gen 3, some semblance of this system did technically exist
   *   in the legacy gens of 1 & 2.
   *   - In those gens, the EV system is colloquially referred to as *stat experience*, which has a maximum value of 65535.
   *   - (Fun fact: Nintendo officially called them *base stats*, but you can see how that'd be *really* confusing!)
   *   - Each time your Pokemon defeats another, their base stats values are awarded to your Pokemon's *stat experience*,
   *     which is mechanically similar to the modern EV system, except for the amount of "EVs" awarded.
   *   - Damage formula square roots the *stat experience* value when the Pokemon is level 100, which coincidentally, taking the
   *     square root of 65535 is 255.99, which is rounded down & divided by 4 when calculating damage (of which the resulting
   *     number is also rounded down).
   *     - Final resulting number of 255 ÷ 4 is 63.75, which is rounded down to 63.
   *     - 63 also happens to be the maximum value that EVs introduced in gens 3+ can produce in the stat formula.
   *     - Since 252 EVs are the max, 252 ÷ 4 is 63, which redundantly (to prove a point) rounds down to 63.
   *     - EVs, though not directly, influence the resulting values of the attack & defense variables used in the damage formula.
   * * For these reasons, this setting (now) exists.
   *   - Though, nobody actually requested for this setting to exist.
   *   - I just thought it might not be a bad idea to have this option available, just in case!
   * * Additionally, some Randoms presets in legacy gens include 0 EVs, so might be useful to be able to see that in the Calcdex.
   *   - Yes, this rabbit hole of research stemmed from a bug where `guessServerLegacySpread()` failed to guess the `serverStats`
   *     in legacy gen Randoms cause some presets explicitly set some stats to 0 EVs.
   *   - Guesser never considered EVs would be 0, so no possible combination could be found always assuming 252 EVs.
   *   - Then in my confused state, I learned EVs *technically* do exist in legacy gens.
   *   - So I went back & undid all of the hard EV omissions in the codebase if legacy lmao.
   *
   * @see https://bulbapedia.bulbagarden.net/wiki/Effort_values#Stat_experience
   * @default false
   * @since 1.1.6
   */
  showLegacyEvs: boolean;

  /**
   * Whether to always show the Pokemon's stats in the stats table, regardless of the `CalcdexPokemon`'s `showGenetics` value.
   *
   * * If included in the array for the specific player, the row should always be shown.
   *   - e.g., `{ auth: ['ev'] }` should always show the EVs row for the logged-in player (`auth`).
   * * All rows should be visible when the `CalcdexPokemon`'s `showGenetics` value is `true`.
   *
   * @default
   * ```ts
   * {
   *   auth: [],
   *   p1: ['iv', 'ev'],
   *   p2: ['iv', 'ev'],
   *   p3: ['iv', 'ev'],
   *   p4: ['iv', 'ev'],
   * }
   * ```
   */
  lockGeneticsVisibility: Record<'auth' | CalcdexPlayerKey, ('base' | 'iv' | 'ev')[]>;

  /**
   * Whether to allow illegal EV/IV values.
   *
   * * `'always'` will always allow illegal EV/IV values, up to 999.
   *   - Note: 999 is arbitrarily set.
   * * `'meta'` will only allow illegal EV/IV values in nonstandard metagame formats.
   *   - Essentially, this applies to any format that's not included in `LegalLockedFormats`.
   * * `'never'` will never allow illegal EV/IV values.
   *
   * @default 'meta'
   * @since 1.0.6
   */
  allowIllegalSpreads: 'always' | 'meta' | 'never';

  /**
   * Whether to reset any `dirtyBoosts` when the battle syncs.
   *
   * @default true
   * @since 1.1.6
   */
  resetDirtyBoosts: boolean;

  /**
   * Whether to show UI tooltips.
   *
   * @default true
   * @since 1.0.4
   */
  showUiTooltips: boolean;

  /**
   * Whether to show the ability tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showAbilityTooltip: boolean;

  /**
   * Whether to show the item tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showItemTooltip: boolean;

  /**
   * Whether to show the move tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showMoveTooltip: boolean;

  /**
   * Whether to show the matchup tooltip containing the result description.
   *
   * @default true
   * @since 1.0.3
   */
  showMatchupTooltip: boolean;

  /**
   * Whether to format the matchup result description to be easier to read.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   *
   * @default true
   * @since 1.0.3
   */
  prettifyMatchupDescription: boolean;

  /**
   * When to show possible damage amounts in the matchup tooltip.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   * * `'nfe'` will only show the possible damage amounts against Pokemon who are NFE (Not Fully Evolved).
   *
   * @default 'nfe'
   * @since 1.0.3
   */
  showMatchupDamageAmounts: 'always' | 'nfe' | 'never';

  /**
   * Whether to format the damage amounts as percentages.
   *
   * * Percentages should only be shown if there are 5 or less unique damage amounts.
   *   - Otherwise, each amount would have some small percentage, making it really dense to quickly read!
   *   - Why 5? Completely arbitrary, but probably a safe bet to distinguish those of many repeats from uniques.
   *   - (If you find that exact number to be a bad idea, don't forget to update `formatDamageAmounts()`!)
   * * Has no effect if `showMatchupDamageAmounts` is `'never'`.
   *
   * @default true
   * @since 1.0.4
   */
  formatMatchupDamageAmounts: boolean;

  /**
   * Whether to allow the matchup result description to be copied to the clipboard when clicked.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   * * Copied matchup result description will be unformatted regardless of the value of `prettifyMatchupDescription`.
   * * If `showMatchupDamageAmounts` is `'always'` or `'nfe'` (default), the possible damage amounts will also be copied to the clipboard.
   *
   * @default true
   * @since 1.0.3
   */
  copyMatchupDescription: boolean;

  /**
   * Whether to show tooltips for field conditions in `FieldCalc`.
   *
   * * This one setting applies to all tooltips for screens, weather, and terrain.
   *
   * @default true
   * @since 1.0.3
   */
  showFieldTooltips: boolean;

  /**
   * Colors for the NHKO values, up to 4HKO.
   *
   * * Any value after 4HKO will use the last defined color in the array.
   * * Note that the first index at `0` pertains to the 1HKO color.
   * * Any valid CSS color representation (e.g., `rgba()`, `hsla()`, etc.) are acceptable values.
   *
   * @default
   * ```ts
   * [
   *   '#4CAF50', // 1HKO (green)
   *   '#FF9800', // 2HKO (orange)
   *   '#FF9800', // 3HKO (orange)
   *   '#F44336', // 4HKO (red)
   *   '#F44336', // 5+HKO (red)
   * ]
   * ```
   * @since 1.0.3
   */
  nhkoColors: CalcdexMatchupNhkoColors;

  /**
   * Labels for the NHKO values, up to 4HKO.
   *
   * * Any value after 4HKO will be displayed in the format `<n>HKO`, where `<n>` is the number of hits before KO.
   * * Maximum accepted length should be `8` characters, in order to discourage long NHKO names that overflow to the next line.
   *   - Essentially this enforcement will make sure each move takes up a single line, instead of two or more.
   *   - However, percentages may be shown (e.g., `'69.5% 1HKO'`), which may cause the text to overflow onto the next line.
   * * Note that the first index at `0` pertains to the 1HKO label.
   *
   * @default
   * ```ts
   * [
   *   '1HKO',
   *   '2HKO',
   *   '3HKO',
   *   '4HKO',
   * ]
   * ```
   * @since 1.0.3
   */
  nhkoLabels: CalcdexMatchupNhkoLabels;
}
