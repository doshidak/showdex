import * as React from 'react';
import cx from 'classnames';
import {
  PiconButton,
  PokeHpBar,
  PokeStatus,
  PokeType,
} from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
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
  exportPokePaste,
  flattenAlts,
  // formatDexDescription,
  // getDexForFormat,
  // hasMegaForme,
  hasNickname,
  mergeRevealedMoves,
} from '@showdex/utils/battle';
import { calcPokemonHp } from '@showdex/utils/calc';
// import { logger } from '@showdex/utils/debug';
import { capitalize } from '@showdex/utils/humanize';
import type { GenerationNum } from '@smogon/calc';
import type { AbilityName, ItemName } from '@smogon/calc/dist/data/interface';
// import type { DropdownOption } from '@showdex/components/form';
import type { BadgeInstance } from '@showdex/components/ui';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { PokeAbilityOptionTooltip } from './PokeAbilityOptionTooltip';
import { PokeItemOptionTooltip } from './PokeItemOptionTooltip';
import { usePresets } from './usePresets';
import styles from './PokeInfo.module.scss';

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  pokemon: CalcdexPokemon;
  containerSize?: ElementSizeLabel;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

// const l = logger('@showdex/pages/Calcdex/PokeInfo');

export const PokeInfo = ({
  className,
  style,
  gen,
  format,
  pokemon,
  containerSize,
  onPokemonChange,
}: PokeInfoProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const {
    presets,
    presetsLoading,
  } = usePresets({
    format,
    pokemon,
  });

  const applyPreset = React.useCallback((preset: CalcdexPokemonPreset) => {
    const mutation: DeepPartial<CalcdexPokemon> = {
      preset: preset.calcdexId,
      moves: preset.moves,
      nature: preset.nature,
      dirtyAbility: preset.ability,
      // item: !pokemon.item || pokemon.item === '(exists)' ? preset.item : pokemon.item,
      // dirtyItem: pokemon.item && pokemon.item !== '(exists)' && pokemon.item !== preset.item ? preset.item : null,
      dirtyItem: preset.item,
      ivs: {
        hp: preset?.ivs?.hp ?? 31,
        atk: preset?.ivs?.atk ?? 31,
        def: preset?.ivs?.def ?? 31,
        spa: preset?.ivs?.spa ?? 31,
        spd: preset?.ivs?.spd ?? 31,
        spe: preset?.ivs?.spe ?? 31,
      },
      evs: { // not specifying the 0's may cause any unspecified EVs to remain!
        hp: preset.evs?.hp || 0,
        atk: preset.evs?.atk || 0,
        def: preset.evs?.def || 0,
        spa: preset.evs?.spa || 0,
        spd: preset.evs?.spd || 0,
        spe: preset.evs?.spe || 0,
      },
    };

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
    }

    if (preset.altItems?.length) {
      mutation.altItems = [...preset.altItems];
    }

    if (preset.altMoves?.length) {
      mutation.altMoves = [...preset.altMoves];
    }

    // check if we already have revealed moves (typical of spectating or replaying a battle)
    mutation.moves = pokemon.transformedForme && pokemon.transformedMoves?.length
      ? [...pokemon.transformedMoves]
      : mergeRevealedMoves({
        ...pokemon,
        moves: mutation.moves,
      });

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
    if (pokemon.serverSourced) {
      mutation.showGenetics = settings?.defaultShowGenetics?.auth;
    }

    // spreadStats will be recalculated in `onPokemonChange()` from `PokeCalc`
    onPokemonChange?.(mutation);
  }, [
    onPokemonChange,
    pokemon,
    settings,
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
          || formatId(p.name) !== 'yours'
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
      const usagePreset = presets.find((p) => (
        (p.format === format?.replace(/^gen\d/, '') && formatId(p.name) === 'showdownusage')
      ));

      // only update if we found a Showdown Usage preset for the format
      // (otherwise, no set would apply, despite the Pokemon having sets, albeit from other formats, potentially)
      if (usagePreset) {
        initialPreset = usagePreset;
      }
    }

    if (!initialPreset) {
      // it's likely that the Pokemon has no EVs/IVs set, so show the EVs/IVs if they're hidden
      const forceShowGenetics = !pokemon.showGenetics
        && (
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

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
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
    () => buildPresetOptions(presets),
    [presets],
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
    settings?.showAllOptions,
  )), [
    format,
    legacy,
    pokemon,
    settings,
  ]);

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

  const itemOptions = React.useMemo(() => (legacy ? [] : buildItemOptions(
    format,
    pokemon,
    // settings?.showAllOptions,
    true, // fuck it w/e lol
  )), [
    format,
    legacy,
    pokemon,
    // settings,
  ]);

  const showResetItem = !!pokemon?.dirtyItem
    && (!!pokemon?.item || !!pokemon?.prevItem)
    && (pokemon?.item || pokemon?.prevItem) !== pokemon?.dirtyItem;

  // handle cycling through the Pokemon's available alternative formes, if any
  // (disabled for legacy gens -- this is enough since nextForme will be null if legacy)
  const formeIndex = !legacy && pokemon?.altFormes?.length
    ? pokemon.altFormes.findIndex((f) => [
      pokemon.speciesForme,
      pokemon.transformedForme,
    ].filter(Boolean).includes(f))
    : -1;

  const nextFormeIndex = formeIndex > -1
    ? formeIndex + 1 > pokemon.altFormes.length - 1
      ? 0
      : formeIndex + 1
    : -1;

  const nextForme = nextFormeIndex > -1
    ? pokemon.altFormes[nextFormeIndex]
    : null;

  const switchToNextForme = React.useCallback(() => {
    if (!nextForme) {
      return;
    }

    onPokemonChange?.({
      [pokemon?.transformedForme ? 'transformedForme' : 'speciesForme']: nextForme,
    });
  }, [
    nextForme,
    onPokemonChange,
    pokemon,
  ]);

  const nextFormeTooltip = nextForme ? (
    <div className={styles.tooltipContent}>
      <div>
        Switch to{' '}
        <em>{nextForme}</em>
      </div>
      <div>
        <strong>{pokemon.speciesForme}</strong>
      </div>
    </div>
  ) : null;

  const smogonPageTooltip = (
    <div className={styles.tooltipContent}>
      Open Smogon Page
      {
        !!pokemon?.speciesForme &&
        <>
          {' '}For
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

  const copiedRef = React.useRef<BadgeInstance>(null);

  const pokePaste = React.useMemo(
    () => exportPokePaste(pokemon, format),
    [format, pokemon],
  );

  const handlePokePasteCopy = () => {
    if (typeof navigator === 'undefined' || !pokePaste) {
      return;
    }

    void (async () => {
      try {
        await navigator.clipboard.writeText(pokePaste);

        copiedRef.current?.show();
      } catch (error) {
        // no-op when an error is thrown while writing to the user's clipboard
        (() => {})();
      }
    })();
  };

  return (
    <div
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.row}>
        <div className={styles.piconContainer}>
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
            tooltip={settings?.reverseIconName ? nextFormeTooltip : smogonPageTooltip}
            tooltipDelay={[settings?.reverseIconName ? 500 : 1000, 50]}
            tooltipDisabled={settings?.reverseIconName ? !nextForme : !settings?.showUiTooltips}
            shadow
            disabled={settings?.reverseIconName ? !nextForme : !pokemon?.speciesForme}
            onPress={settings?.reverseIconName ? switchToNextForme : openSmogonPage}
          />
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.firstLine}>
            {/* no nicknames, as requested by camdawgboi lol */}
            <Button
              className={cx(
                styles.nameButton,
                !pokemon?.speciesForme && styles.missingForme,
                !nextForme && styles.disabled,
              )}
              labelClassName={styles.nameLabel}
              label={nickname || pokemon?.speciesForme || 'MissingNo.'}
              tooltip={settings?.reverseIconName ? smogonPageTooltip : nextFormeTooltip}
              tooltipDelay={[settings?.reverseIconName ? 1000 : 500, 50]}
              tooltipDisabled={settings?.reverseIconName ? !settings?.showUiTooltips : !nextForme}
              hoverScale={1}
              // absoluteHover
              disabled={settings?.reverseIconName ? !pokemon?.speciesForme : !nextForme}
              onPress={settings?.reverseIconName ? openSmogonPage : switchToNextForme}
            />

            {
              (typeof pokemon?.level === 'number' && pokemon.level !== 100) &&
              <div className={styles.level}>
                L{pokemon.level}
              </div>
            }

            {
              !!pokemon?.types?.length &&
              <div className={styles.types}>
                {pokemon.types.map((type, i) => (
                  <PokeType
                    key={`PokeInfo:Types:${pokemonKey}:PokeType:${i}`}
                    style={pokemon.types.length > 1 && i === 0 ? { marginRight: 2 } : null}
                    type={type}
                  />
                ))}
              </div>
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

            <ToggleButton
              className={styles.toggleButton}
              label="Copy"
              tooltip={pokePaste ? (
                <div className={styles.pokePasteTooltip}>
                  <Badge
                    ref={copiedRef}
                    className={styles.copiedBadge}
                    label="Copied!"
                    color="green"
                  />

                  {pokePaste}
                </div>
              ) : null}
              absoluteHover
              disabled={!pokePaste}
              onPress={handlePokePasteCopy}
            />
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
                pokemon?.abilityToggleable &&
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
