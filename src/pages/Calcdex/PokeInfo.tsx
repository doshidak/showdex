import * as React from 'react';
import cx from 'classnames';
import {
  PiconButton,
  PokeFormeTooltip,
  PokeHpBar,
  PokeStatus,
} from '@showdex/components/app';
import { Dropdown, PokeTypeField } from '@showdex/components/form';
import {
  Badge,
  Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonCommonNatures, PokemonNatureBoosts } from '@showdex/consts/pokemon';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import { formatId, openSmogonUniversity } from '@showdex/utils/app';
import {
  buildAbilityOptions,
  buildItemOptions,
  buildPresetOptions,
  detectLegacyGen,
  detectToggledAbility,
  detectUsageAlt,
  exportPokePaste,
  flattenAlt,
  flattenAlts,
  hasNickname,
  importPokePaste,
  legalLockedFormat,
  mergeRevealedMoves,
} from '@showdex/utils/battle';
import { calcPokemonHp } from '@showdex/utils/calc';
import { readClipboardText, writeClipboardText } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { capitalize } from '@showdex/utils/humanize';
import { sortUsageAlts } from '@showdex/utils/redux';
import type { GenerationNum } from '@smogon/calc';
import type { AbilityName, ItemName } from '@smogon/calc/dist/data/interface';
import type { BadgeInstance } from '@showdex/components/ui';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPlayerSide,
  CalcdexPokemon,
  CalcdexPokemonPreset,
  CalcdexPokemonUsageAlt,
} from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { PokeAbilityOptionTooltip } from './PokeAbilityOptionTooltip';
import { PokeItemOptionTooltip } from './PokeItemOptionTooltip';
import { useUsageAltSorter } from './useUsageAltSorter';
import styles from './PokeInfo.module.scss';

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  playerKey?: CalcdexPlayerKey;
  pokemon: CalcdexPokemon;
  presets?: CalcdexPokemonPreset[];
  usage?: CalcdexPokemonPreset;
  usages?: CalcdexPokemonPreset[];
  presetsLoading?: boolean;
  // active?: boolean;
  field?: CalcdexBattleField;
  containerSize?: ElementSizeLabel;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

// const l = logger('@showdex/pages/Calcdex/PokeInfo');

export const PokeInfo = ({
  className,
  style,
  gen,
  format,
  playerKey,
  pokemon,
  presets,
  usage,
  usages,
  presetsLoading,
  // active,
  field,
  containerSize,
  onPokemonChange,
}: PokeInfoProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  // not sorted in usePresets() since the usage stats may not be available there
  const abilityUsageSorter = useUsageAltSorter(usage?.altAbilities);
  const itemUsageSorter = useUsageAltSorter(usage?.altItems);
  const moveUsageSorter = useUsageAltSorter(usage?.altMoves);

  const applyPreset = React.useCallback((
    preset: CalcdexPokemonPreset,
    additionalMutations?: DeepPartial<CalcdexPokemon>,
  ) => {
    const mutation: DeepPartial<CalcdexPokemon> = {
      ...additionalMutations,

      preset: preset.calcdexId,

      moves: preset.moves,
      nature: preset.nature,
      dirtyAbility: preset.ability,
      dirtyItem: preset.item,

      ivs: {
        hp: preset?.ivs?.hp ?? 31,
        atk: preset?.ivs?.atk ?? 31,
        def: preset?.ivs?.def ?? 31,
        spa: preset?.ivs?.spa ?? 31,
        spd: preset?.ivs?.spd ?? 31,
        spe: preset?.ivs?.spe ?? 31,
      },

      // not specifying the 0's may cause any unspecified EVs to remain!
      evs: {
        hp: preset.evs?.hp || 0,
        atk: preset.evs?.atk || 0,
        def: preset.evs?.def || 0,
        spa: preset.evs?.spa || 0,
        spd: preset.evs?.spd || 0,
        spe: preset.evs?.spe || 0,
      },
    };

    const altTeraTypes = preset.teraTypes?.filter((t) => !!t && flattenAlt(t) !== '???');

    // check if we have Tera typing usage data
    const detectedUsage = (usages?.length === 1 && usages[0])
      || (!!preset.name && usages?.find((u) => u?.source === 'usage' && u.name?.includes(preset.name)))
      || usage;

    const teraTypesUsage = detectedUsage?.teraTypes?.filter(detectUsageAlt);

    if (teraTypesUsage?.length) {
      // mutation.altTeraTypes = flatAltTeraTypes
      //   .map((t) => [t, teraTypesUsage.find((u) => u[0] === t)?.[1] || 0] as CalcdexPokemonUsageAlt<Showdown.TypeName>)
      //   .sort(sortUsageAlts);
      mutation.altTeraTypes = teraTypesUsage.sort(sortUsageAlts);

      // update the teraType to the most likely one after sorting
      [mutation.teraType] = mutation.altTeraTypes[0] as CalcdexPokemonUsageAlt<Showdown.TypeName>;
    } else if (altTeraTypes?.[0]) {
      // apply the first teraType from the preset's teraTypes
      [mutation.teraType] = flattenAlts(altTeraTypes);
      mutation.altTeraTypes = altTeraTypes;
    }

    // don't apply the dirtyAbility/dirtyItem if we're applying the Pokemon's first preset and
    // their abilility/item was already revealed or it matches the Pokemon's revealed ability/item
    // const clearDirtyAbility = (!pokemon.preset && pokemon.ability)
    //   || pokemon.ability === preset.ability;

    // update (2022/10/07): don't apply the dirtyAbility/dirtyItem at all if their non-dirty
    // counterparts are revealed already
    const clearDirtyAbility = !!pokemon.ability && !pokemon.transformedForme;

    if (clearDirtyAbility) {
      mutation.dirtyAbility = null;
    }

    // const clearDirtyItem = (!pokemon.preset && pokemon.item && pokemon.item !== '(exists)')
    //   || pokemon.item === preset.item
    //   || (!pokemon.item && pokemon.prevItem && pokemon.prevItemEffect);
    const clearDirtyItem = (pokemon.item && pokemon.item !== '(exists)')
      || (pokemon.prevItem && pokemon.prevItemEffect);

    if (clearDirtyItem) {
      mutation.dirtyItem = null;
    }

    if (preset.altAbilities?.length) {
      mutation.altAbilities = [...preset.altAbilities];

      // apply the top usage ability (if available)
      if (typeof abilityUsageSorter === 'function' && mutation.altAbilities.length > 1 && !clearDirtyAbility) {
        const sortedAbilities = flattenAlts(mutation.altAbilities).sort(abilityUsageSorter);
        const [topAbility] = sortedAbilities;

        if (sortedAbilities.length === mutation.altAbilities.length) {
          mutation.altAbilities = sortedAbilities;
        }

        if (topAbility && mutation.dirtyAbility !== topAbility) {
          mutation.dirtyAbility = topAbility;
        }
      }
    }

    if (preset.altItems?.length) {
      mutation.altItems = [...preset.altItems];

      // apply the top usage item (if available)
      if (typeof itemUsageSorter === 'function' && mutation.altItems.length > 1 && !clearDirtyItem) {
        const sortedItems = flattenAlts(mutation.altItems).sort(itemUsageSorter);
        const [topItem] = sortedItems;

        if (sortedItems.length === mutation.altItems.length) {
          mutation.altItems = sortedItems;
        }

        if (topItem && mutation.dirtyItem !== topItem) {
          mutation.dirtyItem = topItem;
        }
      }
    }

    if (preset.altMoves?.length) {
      mutation.altMoves = [...preset.altMoves];

      // sort the moves by their usage stats (if available) and apply the top 4 moves
      // (otherwise, just apply the moves from the preset)
      if (typeof moveUsageSorter === 'function' && mutation.altMoves.length > 1) {
        const sortedMoves = flattenAlts(mutation.altMoves).sort(moveUsageSorter);

        if (sortedMoves.length) {
          mutation.altMoves = sortedMoves;

          /**
           * @todo Needs to be updated once we support more than 4 moves.
           */
          mutation.moves = sortedMoves.slice(0, 4);
        }
      }
    }

    // check if we already have revealed moves (typical of spectating or replaying a battle)
    mutation.moves = pokemon.transformedForme && pokemon.transformedMoves?.length
      ? [...pokemon.transformedMoves]
      : mergeRevealedMoves({ ...pokemon, moves: mutation.moves });

    // only apply the ability/item (and remove their dirty counterparts) if there's only
    // 1 possible ability/item in the pool (and their actual ability/item hasn't been revealed)
    // update (2022/10/06): nvm on the setting the actual ability/item cause it's screwy when switching formes,
    // so opting to use their dirty counterparts instead lol
    if (preset.format?.includes('random')) {
      // apply the Gmax forme if that's all we have random sets for (cause they're most likely Gmax)
      if (preset.speciesForme.endsWith('-Gmax')) {
        mutation.speciesForme = preset.speciesForme;
      }

      if (!clearDirtyAbility && mutation.altAbilities?.length === 1) {
        [mutation.dirtyAbility] = flattenAlts(mutation.altAbilities);
        // mutation.dirtyAbility = null;
      }

      if (!pokemon.item && !pokemon.prevItem && mutation.altItems?.length === 1) {
        [mutation.dirtyItem] = flattenAlts(mutation.altItems);
        // mutation.dirtyItem = null;
      }
    }

    // carefully apply the spread if Pokemon is transformed and a spread was already present prior
    const shouldTransformSpread = !!pokemon.transformedForme
      && !!pokemon.nature
      && !!Object.values({ ...pokemon.ivs, ...pokemon.evs }).filter(Boolean).length;

    if (shouldTransformSpread) {
      // since transforms inherit the exact stats of the target Pokemon (except for HP),
      // we actually need to copy the nature from the preset
      // delete mutation.nature;

      // we'll keep the original HP EVs/IVs (even if possibly illegal) since the max HP
      // of a transformed Pokemon is preserved, which is based off of the HP's base, IV & EV
      mutation.ivs.hp = pokemon.ivs.hp;
      mutation.evs.hp = pokemon.evs.hp;

      // if the Pokemon has an item set by a previous preset, ignore this preset's item
      if (pokemon.dirtyItem || pokemon.item) {
        delete mutation.dirtyItem;
      }
    }

    // only remove the dirtyAbility/dirtyItem from the mutation if they're undefined (but not null)
    // (means that the preset didn't define the ability/item, hence the undefined)
    if (mutation.dirtyAbility === undefined) {
      delete mutation.dirtyAbility;
    }

    if (mutation.dirtyItem === undefined) {
      delete mutation.dirtyItem;
    }

    // apply the defaultShowGenetics setting if the Pokemon is serverSourced
    // update (2022/11/15): defaultShowGenetics is deprecated in favor of lockGeneticsVisibility;
    // showGenetics's initial value is set in syncBattle() when the Pokemon is first init'd into Redux
    // if (pokemon.serverSourced) {
    //   mutation.showGenetics = settings?.defaultShowGenetics?.auth;
    // }

    // spreadStats will be recalculated in `onPokemonChange()` from `PokeCalc`
    onPokemonChange?.(mutation);
  }, [
    abilityUsageSorter,
    itemUsageSorter,
    moveUsageSorter,
    onPokemonChange,
    pokemon,
    // settings,
    usage,
    usages,
  ]);

  // this will allow the user to switch back to the "Yours" preset for a transformed Pokemon
  // (using a ref instead of state since we don't want to cause an unnecessary re-render)
  const appliedTransformedPreset = React.useRef<boolean>(false);

  // automatically apply the first preset if the Pokemon has no/invalid preset
  // (invalid presets could be due to the forme changing, so new presets are loaded in)
  React.useEffect(() => {
    // if (!pokemon?.calcdexId || !pokemon.autoPreset || presetsLoading) {
    if (!pokemon?.calcdexId || presetsLoading) {
      return;
    }

    if (!pokemon.transformedForme && appliedTransformedPreset.current) {
      appliedTransformedPreset.current = false;
    }

    const existingPreset = pokemon.preset && presets?.length
      ? presets.find((p) => p?.calcdexId === pokemon.preset && (
        !pokemon.transformedForme
          // || formatId(p.name) !== 'yours'
          || p.source !== 'server' // i.e., the 'Yours' preset
          || appliedTransformedPreset.current
      ))
      : null;

    if (existingPreset) {
      return;
    }

    const {
      downloadUsageStats,
      prioritizeUsageStats,
    } = settings || {};

    // Setup the initial preset.
    // If we are playing random battles, grab the appropriate randombattles set.
    let initialPreset: CalcdexPokemonPreset = presets[0]; // presets[0] as the default case

    // update (2022/10/27): will always be first preset in randoms
    // if (format.includes('random')) {
    //   initialPreset = presets.find((p) => (
    //     (p.format === format)
    //   ));
    // } else if (downloadUsageStats && prioritizeUsageStats) {

    // if the Pokemon is transformed (very special case), we'll check if the "Yours" preset is applied,
    // which only occurs for serverSourced CalcdexPokemon, in which case we need to apply the second preset... lol
    // kinda looks like: [{ name: 'Yours', ... }, { name: 'Some Set of a Transformed Pokemon', ... }, ...]
    if (pokemon.transformedForme && presets[1]) {
      [, initialPreset] = presets; // readability 100
      appliedTransformedPreset.current = true;
    }

    if (downloadUsageStats && prioritizeUsageStats) {
      // If we aren't in a random battle, check if we should prioritize
      // the showdown usage stats.
      // note: 'usage'-sourced sets won't exist in `presets` for Randoms formats
      const usagePreset = presets.find((p) => (
        // (p.format === format?.replace(/^gen\d/, '') && formatId(p.name) === 'showdownusage')
        p?.source === 'usage' && (!format || format.includes(p.format))
      ));

      // only update if we found a Showdown Usage preset for the format
      // (otherwise, no set would apply, despite the Pokemon having sets, albeit from other formats, potentially)
      if (usagePreset) {
        initialPreset = usagePreset;
      }
    }

    if (!initialPreset) {
      // it's likely that the Pokemon has no EVs/IVs set, so show the EVs/IVs if they're hidden
      const forceShowGenetics = !pokemon.showGenetics && (
        !Object.values(pokemon.ivs || {}).reduce((sum, val) => sum + (val || 0), 0)
          || !Object.values(pokemon.evs || {}).reduce((sum, val) => sum + (val || 0), 0)
      );

      if (forceShowGenetics) {
        onPokemonChange?.({ showGenetics: true });
      }

      return;
    }

    // l.debug(
    //   'Applying preset to', pokemon.speciesForme,
    //   '\n', 'initialPreset', initialPreset,
    //   '\n', 'presets', presets,
    //   '\n', 'settings.prioritizeUsageStats', prioritizeUsageStats,
    // );

    applyPreset(initialPreset);
  }, [
    applyPreset,
    format,
    pokemon,
    onPokemonChange,
    presets,
    presetsLoading,
    settings,
  ]);

  // const dex = getDexForFormat(format);
  const legacy = detectLegacyGen(gen);

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '?';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const nickname = hasNickname(pokemon) && settings?.showNicknames
    ? pokemon.name
    : null;

  const hpPercentage = calcPokemonHp(pokemon);

  // whether we should multiply the current & max HPs by 2 if useMax is enabled
  // and is NOT from the server or isn't currently Dynamaxed
  // (server HP will be doubled when Dynamaxed, but not beforehand; client HP will never be doubled,
  // since it's a percentage)
  /**
   * @todo Make this into `calcPokemonHp()` (and rename `calcPokemonHp()` to `calcPokemonHpPercentage()`).
   *   Also check if the HP Percentage mod is enabled, via the `CalcdexBattleRules`, since we wouldn't
   *   want to double the client HP if the mod is disabled (as it wouldn't be a percentage, duh).
   */
  const shouldDmaxHp = pokemon?.useMax
    && (!pokemon.serverSourced || !('dynamax' in pokemon.volatiles));

  const currentHp = (
    pokemon?.serverSourced
      ? pokemon.hp
      : Math.floor((pokemon?.spreadStats?.hp ?? 0) * hpPercentage)
  ) * (shouldDmaxHp ? 2 : 1);

  const maxHp = (
    (pokemon?.serverSourced && pokemon.maxhp)
      || pokemon?.spreadStats?.hp
      || 0
  ) * (shouldDmaxHp ? 2 : 1);

  const abilityName = pokemon?.dirtyAbility ?? pokemon?.ability;
  const itemName = pokemon?.dirtyItem ?? pokemon?.item;

  const presetOptions = React.useMemo(
    () => buildPresetOptions(presets, usages),
    [presets, usages],
  );

  const handlePresetChange = (calcdexId: string) => {
    const preset = presets.find((p) => p?.calcdexId === calcdexId);

    if (!preset) {
      return;
    }

    applyPreset(preset);
  };

  const abilityOptions = React.useMemo(() => (legacy ? [] : buildAbilityOptions(
    format,
    pokemon,
    usage,
    settings?.showAllOptions,
  )), [
    format,
    legacy,
    pokemon,
    settings,
    usage,
  ]);

  // for Ruin abilities (gen 9), only show the ability toggle in Doubles
  const showAbilityToggle = pokemon?.abilityToggleable
    && (
      !formatId(abilityName)?.endsWith('ofruin')
        || field?.gameType === 'Doubles'
    );

  const fieldKey: keyof CalcdexBattleField = playerKey === 'p2'
    ? 'defenderSide'
    : 'attackerSide';

  // ability toggle would only be disabled for inactive Pokemon w/ Ruin abilities (gen 9) in Doubles
  const disableAbilityToggle = pokemon?.abilityToggleable
    && formatId(abilityName)?.endsWith('ofruin')
    && field?.gameType === 'Doubles'
    // && !active
    && !pokemon.abilityToggled
    // && (
    //   (abilityName === 'beadsofruin' && field?.[fieldKey]?.ruinBeadsCount)
    //     || (abilityName === 'swordofruin' && field?.[fieldKey]?.ruinSwordCount)
    //     || (abilityName === 'tabletsofruin' && field?.[fieldKey]?.ruinTabletsCount)
    //     || (abilityName === 'vesselofruin' && field?.[fieldKey]?.ruinVesselCount)
    //     || 0
    // ) >= 2;
    && ([
      'ruinBeadsCount',
      'ruinSwordCount',
      'ruinTabletsCount',
      'ruinVesselCount',
    ] as (keyof CalcdexPlayerSide)[])
      .reduce((sum, key) => sum + ((field[fieldKey]?.[key] as number) || 0), 0) >= 2;

  const showResetAbility = !!pokemon?.dirtyAbility
    && !pokemon.transformedForme
    && !!pokemon.ability
    && pokemon.ability !== pokemon.dirtyAbility;

  const handleAbilityChange = (name: AbilityName) => onPokemonChange?.({
    dirtyAbility: name,
    abilityToggled: detectToggledAbility({
      ...pokemon,
      ability: name,
    }),
  });

  const handleAbilityReset = () => onPokemonChange?.({
    dirtyAbility: null,
    abilityToggled: detectToggledAbility({
      ...pokemon,
      dirtyAbility: null,
    }),
  });

  const itemOptions = React.useMemo(() => (gen === 1 ? [] : buildItemOptions(
    format,
    pokemon,
    usage,
    // settings?.showAllOptions,
    true, // fuck it w/e lol (instead of using settings.showAllOptions)
  )), [
    format,
    gen,
    // legacy,
    pokemon,
    // settings,
    usage,
  ]);

  const showResetItem = !!pokemon?.dirtyItem
    && (!!pokemon?.item || !!pokemon?.prevItem)
    && (pokemon?.item || pokemon?.prevItem) !== pokemon?.dirtyItem;

  const [formesVisible, setFormesVisible] = React.useState(false);
  const toggleFormesTooltip = () => setFormesVisible(!formesVisible);
  const closeFormesTooltip = () => setFormesVisible(false);

  const smogonPageTooltip = (
    <div className={styles.tooltipContent}>
      Open Smogon Page
      {
        !!pokemon?.speciesForme &&
        <>
          {' '}for
          <br />
          <strong>{pokemon.speciesForme}</strong>
        </>
      }
    </div>
  );

  const openSmogonPage = () => openSmogonUniversity(
    gen,
    'pokemon',
    pokemon?.speciesForme,
    format,
  );

  // const formeDisabled = !nextForme;
  const formeDisabled = !pokemon?.altFormes?.length;
  const smogonDisabled = !settings?.openSmogonPage || !pokemon?.speciesForme;
  const piconDisabled = settings?.reverseIconName ? formeDisabled : smogonDisabled;
  const nameDisabled = settings?.reverseIconName ? smogonDisabled : formeDisabled;

  const editableTypes = settings?.editPokemonTypes === 'always'
    || (settings?.editPokemonTypes === 'meta' && !legalLockedFormat(format));

  const importBadgeRef = React.useRef<BadgeInstance>(null);
  const importFailedBadgeRef = React.useRef<BadgeInstance>(null);
  const [importFailedReason, setImportFailedReason] = React.useState('Failed');

  const handlePokePasteImport = () => void (async () => {
    if (typeof onPokemonChange !== 'function') {
      return;
    }

    try {
      const data = await readClipboardText();
      const preset = importPokePaste(data, format);

      const importFailed = !preset?.calcdexId || ![
        pokemon?.speciesForme,
        ...(pokemon?.altFormes || []),
      ].filter(Boolean).includes(preset.speciesForme);

      if (importFailed) {
        setImportFailedReason(!preset?.calcdexId ? 'Bad Syntax' : 'Mismatch');
        importFailedBadgeRef.current?.show();

        return;
      }

      const currentPresets = [...pokemon.presets];
      const existingImportIndex = currentPresets.findIndex((p) => p.source === 'import');

      if (existingImportIndex > -1) {
        currentPresets.splice(existingImportIndex, 1, preset);
      } else {
        currentPresets.push(preset);
      }

      // onPokemonChange({ presets: currentPresets });
      applyPreset(preset, {
        presets: currentPresets,
      });

      importBadgeRef.current?.show();
    } catch (error) {
      // if (__DEV__) {
      //   l.error(
      //     'Failed to import the set for', pokemon.speciesForme, 'from clipboard:',
      //     '\n', error,
      //     '\n', '(You will only see this error on development.)',
      //   );
      // }

      setImportFailedReason('Failed');
      importFailedBadgeRef.current?.show();
    }
  })();

  const exportBadgeRef = React.useRef<BadgeInstance>(null);
  const exportFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const pokePaste = React.useMemo(
    () => exportPokePaste(pokemon, format),
    [format, pokemon],
  );

  const handlePokePasteExport = () => void (async () => {
    if (!pokePaste) {
      return;
    }

    try {
      // await navigator.clipboard.writeText(pokePaste);
      await writeClipboardText(pokePaste);

      exportBadgeRef.current?.show();
    } catch (error) {
      // if (__DEV__) {
      //   l.error(
      //     'Failed to export the set for', pokemon.speciesForme, 'to clipboard:',
      //     '\n', error,
      //     '\n', '(You will only see this error on development.)',
      //   );
      // }

      exportFailedBadgeRef.current?.show();
    }
  })();

  return (
    <div
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        // ['xs', 'sm'].includes(containerSize) && styles.smol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.row}>
        <div className={styles.piconContainer}>
          <PokeFormeTooltip
            pokemon={pokemon}
            visible={formesVisible}
            disabled={!settings?.reverseIconName}
            onPokemonChange={onPokemonChange}
            onRequestClose={closeFormesTooltip}
          >
            <PiconButton
              piconStyle={pokemon?.name ? { transform: 'scaleX(-1)' } : undefined}
              pokemon={{
                ...pokemon,
                speciesForme: (
                  pokemon?.transformedForme
                    || pokemon?.speciesForme
                )?.replace(pokemon?.useMax ? '' : '-Gmax', ''), // replace('', '') does nothing btw
                item: itemName,
              }}
              // tooltip={settings?.reverseIconName ? nextFormeTooltip : smogonPageTooltip}
              tooltip={settings?.reverseIconName ? undefined : smogonPageTooltip}
              // tooltipDelay={[settings?.reverseIconName ? 500 : 1000, 50]}
              tooltipDelay={[1000, 50]}
              // tooltipDisabled={settings?.reverseIconName ? !nextForme : !settings?.showUiTooltips}
              tooltipDisabled={settings?.reverseIconName || !settings?.showUiTooltips}
              shadow
              disabled={piconDisabled}
              // onPress={settings?.reverseIconName ? switchToNextForme : openSmogonPage}
              onPress={settings?.reverseIconName ? toggleFormesTooltip : openSmogonPage}
            />
          </PokeFormeTooltip>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.firstLine}>
            <PokeFormeTooltip
              pokemon={pokemon}
              visible={formesVisible}
              disabled={settings?.reverseIconName}
              onPokemonChange={onPokemonChange}
              onRequestClose={closeFormesTooltip}
            >
              <Button
                className={cx(
                  styles.nameButton,
                  !pokemon?.speciesForme && styles.missingForme,
                  nameDisabled && styles.disabled,
                )}
                labelClassName={styles.nameLabel}
                label={nickname || pokemon?.speciesForme || 'MissingNo.'}
                // tooltip={settings?.reverseIconName ? smogonPageTooltip : nextFormeTooltip}
                tooltip={settings?.reverseIconName ? smogonPageTooltip : undefined}
                // tooltipDelay={[settings?.reverseIconName ? 1000 : 500, 50]}
                tooltipDelay={[1000, 50]}
                // tooltipDisabled={settings?.reverseIconName ? !settings?.showUiTooltips : !nextForme}
                tooltipDisabled={settings?.reverseIconName && !settings?.showUiTooltips}
                hoverScale={1}
                // absoluteHover
                disabled={nameDisabled}
                // onPress={settings?.reverseIconName ? openSmogonPage : switchToNextForme}
                onPress={settings?.reverseIconName ? openSmogonPage : toggleFormesTooltip}
              />
            </PokeFormeTooltip>

            {
              (typeof pokemon?.level === 'number' && pokemon.level !== 100) &&
              <div className={styles.level}>
                L{pokemon.level}
              </div>
            }

            <PokeTypeField
              className={styles.typesField}
              label={`Types for Pokemon ${friendlyPokemonName}`}
              // tooltip={(
              //   <div className={styles.tooltipContent}>
              //     Change{' '}
              //     {
              //       !!pokemon?.speciesForme &&
              //       <>
              //         <strong>
              //           {pokemon.speciesForme}
              //         </strong>'s
              //         {' '}
              //       </>
              //     }
              //     Types
              //   </div>
              // )}
              // tooltipDisabled={!settings?.showUiTooltips}
              multi
              input={{
                name: `PokeInfo:Types:${pokemonKey}`,
                value: [...(pokemon?.types || [])],
                onChange: (types: Showdown.TypeName[]) => onPokemonChange?.({
                  types: [...(types || [])],
                }),
              }}
              tooltipPlacement="bottom-start"
              shorterAbbreviations={gen > 8 && ['xs', 'sm'].includes(containerSize)}
              highlight={gen < 9 || !pokemon?.terastallized}
              readOnly={!editableTypes}
              disabled={!pokemon?.speciesForme}
            />

            {
              gen > 8 &&
              <PokeTypeField
                className={cx(styles.typesField, styles.teraTypeField)}
                label={`Tera Type for Pokemon ${friendlyPokemonName}`}
                title="Tera Type"
                input={{
                  name: `PokeInfo:TeraType:${pokemonKey}`,
                  value: pokemon?.teraType || '???',
                  onChange: (type: Showdown.TypeName) => onPokemonChange?.({
                    teraType: type,
                    terastallized: !!type && type !== '???' && pokemon?.terastallized,
                  }),
                }}
                tooltipPlacement="bottom-start"
                defaultTypeLabel="Tera"
                // teraTyping
                shorterAbbreviations={['xs', 'sm'].includes(containerSize)}
                highlight={pokemon?.terastallized}
                highlightTypes={flattenAlts(pokemon?.altTeraTypes)}
                typeUsages={pokemon?.altTeraTypes?.filter(detectUsageAlt)}
                disabled={!pokemon?.speciesForme}
              />
            }
          </div>

          <div className={styles.secondLine}>
            <PokeHpBar
              // className={styles.hpBar}
              hp={hpPercentage}
              width={100}
            />

            {
              !!hpPercentage &&
              <Tooltip
                content={(
                  <div className={styles.tooltipContent}>
                    {
                      (!pokemon.serverSourced && hpPercentage !== 1) &&
                      <>
                        <em>approx.</em>
                        <br />
                      </>
                    }

                    {currentHp} / {maxHp}
                  </div>
                )}
                offset={[0, 10]}
                delay={[250, 50]}
                trigger="mouseenter"
                touch={['hold', 500]}
                disabled={!maxHp}
              >
                <div className={styles.hpPercentage}>
                  {`${(hpPercentage * 100).toFixed(0)}%`}
                </div>
              </Tooltip>
            }

            {
              (!!pokemon && (!!pokemon.status || !hpPercentage)) &&
              <div className={styles.statuses}>
                <PokeStatus
                  className={styles.status}
                  status={pokemon?.status}
                  fainted={!hpPercentage}
                />
              </div>
            }
          </div>
        </div>

        <div className={styles.presetContainer}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            <div className={styles.presetHeader}>
              <div className={styles.presetHeaderPart}>
                Set

                <ToggleButton
                  className={styles.toggleButton}
                  label="Auto"
                  absoluteHover
                  // active={pokemon?.autoPreset}
                  disabled /** @todo remove after implementing auto-presets */
                  onPress={() => onPokemonChange?.({
                    autoPreset: !pokemon?.autoPreset,
                  })}
                />
              </div>

              <div className={cx(styles.presetHeaderPart, styles.presetHeaderRight)}>
                <ToggleButton
                  className={cx(
                    styles.toggleButton,
                    styles.importButton,
                    // !settings?.showUiTooltips && styles.floatingBadges,
                  )}
                  label="Import"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      {/* <Badge
                        ref={importBadgeRef}
                        className={styles.importBadge}
                        label="Imported"
                        color="blue"
                      />

                      <Badge
                        ref={importFailedBadgeRef}
                        className={styles.importBadge}
                        label={importFailedReason}
                        color="red"
                      /> */}

                      Import Pok&eacute;Paste from Clipboard
                    </div>
                  )}
                  tooltipPlacement="bottom"
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  disabled={!pokemon?.speciesForme || typeof onPokemonChange !== 'function'}
                  onPress={handlePokePasteImport}
                >
                  <Badge
                    ref={importBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label="Imported"
                    color="blue"
                  />

                  <Badge
                    ref={importFailedBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label={importFailedReason}
                    color="red"
                  />
                </ToggleButton>

                <ToggleButton
                  className={cx(styles.toggleButton, styles.importButton)}
                  label="Export"
                  tooltip={pokePaste ? (
                    <div className={styles.pokePasteTooltip}>
                      {/* <Badge
                        ref={exportBadgeRef}
                        className={styles.importBadge}
                        label="Copied!"
                        color="green"
                      />

                      <Badge
                        ref={exportFailedBadgeRef}
                        className={styles.importBadge}
                        label="Failed"
                        color="red"
                      /> */}

                      {pokePaste}
                    </div>
                  ) : null}
                  tooltipPlacement="bottom"
                  absoluteHover
                  disabled={!pokePaste}
                  onPress={handlePokePasteExport}
                >
                  <Badge
                    ref={exportBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label="Copied!"
                    color="green"
                  />

                  <Badge
                    ref={exportFailedBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label="Failed"
                    color="red"
                  />
                </ToggleButton>
              </div>
            </div>
          </div>

          <Dropdown
            aria-label={`Available Sets for Pokemon ${friendlyPokemonName}`}
            hint="None"
            input={{
              name: `PokeInfo:Preset:${pokemonKey}:Dropdown`,
              value: pokemon?.preset,
              onChange: handlePresetChange,
            }}
            options={presetOptions}
            noOptionsMessage="No Sets"
            clearable={false}
            loading={presetsLoading}
            loadingMessage="Downloading..."
            disabled={!pokemon?.speciesForme || presetsLoading || !presets.length}
          />
        </div>
      </div>

      {
        gen > 1 &&
        <div
          className={styles.row}
          style={{ alignItems: 'flex-start' }}
        >
          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Ability

              {
                showAbilityToggle &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Active"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      {pokemon.abilityToggled ? 'Deactivate' : 'Activate'}{' '}
                      {abilityName ? (
                        <strong>{abilityName}</strong>
                      ) : 'Ability'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active={pokemon.abilityToggled}
                  disabled={disableAbilityToggle}
                  onPress={() => onPokemonChange?.({
                    abilityToggled: !pokemon.abilityToggled,
                  })}
                />
              }

              {
                showResetAbility &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Reset"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Reset to Revealed
                      {' '}
                      {pokemon?.ability ? (
                        <strong>{pokemon.ability}</strong>
                      ) : 'Ability'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active
                  onPress={handleAbilityReset}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Abilities for Pokemon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
              // tooltip={abilityDescription ? (
              //   <div className={cx(styles.tooltipContent, styles.descTooltip)}>
              //     {abilityDescription}
              //   </div>
              // ) : null}
              // optionTooltip={abilityOptionTooltip}
              optionTooltip={PokeAbilityOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showAbilityTooltip,
              }}
              input={{
                name: `PokeInfo:Ability:${pokemonKey}:Dropdown`,
                value: abilityName,
                onChange: handleAbilityChange,
              }}
              options={abilityOptions}
              noOptionsMessage="No Abilities"
              clearable={false}
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Nature
            </div>

            <Dropdown
              aria-label={`Available Natures for Pokemon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
              input={{
                name: `PokeInfo:Nature:${pokemonKey}:Dropdown`,
                value: pokemon?.nature,
                onChange: (name: Showdown.PokemonNature) => onPokemonChange?.({
                  nature: name,
                }),
              }}
              options={PokemonCommonNatures.map((name) => ({
                label: name,
                rightLabel: PokemonNatureBoosts[name]?.length ? [
                  !!PokemonNatureBoosts[name][0] && `+${PokemonNatureBoosts[name][0].toUpperCase()}`,
                  !!PokemonNatureBoosts[name][1] && `-${PokemonNatureBoosts[name][1].toUpperCase()}`,
                ].filter(Boolean).join(' ') : 'Neutral',
                value: name,
              }))}
              noOptionsMessage="No Natures"
              clearable={false}
              // hideSelections
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Item

              {
                showResetItem &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Reset"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Reset to
                      {' '}
                      {(
                        pokemon?.prevItemEffect
                          || pokemon?.itemEffect
                      )?.split(' ').map((w) => capitalize(w)).join('-') || 'Revealed'}
                      {' '}
                      {pokemon?.prevItem || pokemon?.item ? (
                        <>
                          <br />
                          <strong>{pokemon.prevItem || pokemon.item}</strong>
                        </>
                      ) : 'Item'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active
                  onPress={() => onPokemonChange?.({
                    dirtyItem: null,
                  })}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Items for Pokemon ${friendlyPokemonName}`}
              hint={gen === 1 ? 'N/A' : 'None'}
              tooltip={pokemon?.itemEffect || pokemon?.prevItem ? (
                <div
                  className={cx(
                    styles.tooltipContent,
                    styles.descTooltip,
                    styles.itemTooltip,
                  )}
                >
                  {
                    !!pokemon?.itemEffect &&
                    <div className={styles.itemEffect}>
                      {pokemon.itemEffect}
                    </div>
                  }
                  {
                    !!pokemon?.prevItem &&
                    <>
                      <div className={styles.itemEffect}>
                        {pokemon.prevItemEffect || 'Previous'}
                      </div>
                      <div className={styles.itemName}>
                        {pokemon.prevItem}
                      </div>
                    </>
                  }
                </div>
              ) : null}
              // optionTooltip={itemOptionTooltip}
              optionTooltip={PokeItemOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showItemTooltip,
              }}
              input={{
                name: `PokeInfo:Item:${pokemonKey}:Dropdown`,
                value: itemName,
                onChange: (name: ItemName) => onPokemonChange?.({
                  dirtyItem: name ?? ('' as ItemName),
                }),
              }}
              options={itemOptions}
              noOptionsMessage="No Items"
              disabled={gen === 1 || !pokemon?.speciesForme}
            />
          </div>
        </div>
      }
    </div>
  );
};
