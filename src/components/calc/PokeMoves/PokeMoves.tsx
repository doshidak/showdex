import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type AbilityName, type MoveName } from '@smogon/calc';
import { PokeMoveOptionTooltip } from '@showdex/components/app';
import {
  createAliasFilter,
  Dropdown,
  MoveCategoryField,
  PokeTypeField,
  ValueField,
} from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import {
  type BadgeInstance,
  Badge,
  Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonToggleMoves } from '@showdex/consts/dex';
import { type CalcdexMoveOverride, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useColorScheme, useGlassyTerrain, useHonkdexSettings } from '@showdex/redux/store';
import { detectToggledMove } from '@showdex/utils/battle';
import { getMoveOverrideDefaults, hasMoveOverrides } from '@showdex/utils/calc';
import {
  clamp,
  formatId,
  nonEmptyObject,
  upsizeArray,
  writeClipboardText,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { legalLockedFormat } from '@showdex/utils/dex';
import { useRandomUuid } from '@showdex/utils/hooks';
import { buildMoveOptions, formatDamageAmounts } from '@showdex/utils/ui';
import { useCalcdexPokeContext } from '../CalcdexPokeContext';
import styles from './PokeMoves.module.scss';

export interface PokeMovesProps {
  className?: string;
  style?: React.CSSProperties;
}

const l = logger('@showdex/components/calc/PokeMoves');

export const PokeMoves = ({
  className,
  style,
}: PokeMovesProps): JSX.Element => {
  const { t } = useTranslation('calcdex');

  const {
    state,
    settings,
    player,
    playerPokemon: pokemon,
    opponentPokemon,
    usage,
    moveUsageFinder,
    moveUsageSorter,
    matchups,
    updatePokemon,
  } = useCalcdexPokeContext();

  const {
    operatingMode,
    containerSize,
    active: battleActive,
    gen,
    format,
    rules,
    field,
  } = state;

  const honkdexSettings = useHonkdexSettings();
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const randomUuid = useRandomUuid();
  const copiedRefs = React.useRef<BadgeInstance[]>([]);

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || randomUuid || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const moveOptions = React.useMemo(() => buildMoveOptions(
    format,
    pokemon,
    {
      usageAlts: usage?.altMoves,
      usageFinder: moveUsageFinder,
      usageSorter: moveUsageSorter,
      field,
      include: (settings?.showAllOptions && 'all')
        || (operatingMode === 'standalone' && 'hidden-power')
        || null,
      translate: (v) => t(`pokedex:moves.${formatId(v)}`, v),
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  ), [
    field,
    format,
    moveUsageFinder,
    moveUsageSorter,
    operatingMode,
    pokemon,
    settings?.showAllOptions,
    t,
    usage?.altMoves,
  ]);

  const moveOptionsFilter = React.useMemo(
    () => createAliasFilter(t('pokedex:moveAliases', { returnObjects: true })),
    [t],
  );

  const nationalDexFormat = !!format && [
    'nationaldex',
    'natdex',
  ].some((f) => format.includes(f));

  const showTeraToggle = !!pokemon?.speciesForme
    && !rules?.tera
    && gen > 8;

  const disableTeraToggle = !pokemon?.speciesForme
    || (!pokemon.teraType && !pokemon.dirtyTeraType)
    || (pokemon.dirtyTeraType || pokemon.teraType) === '???'
    || (settings?.lockUsedTera && player?.usedTera && battleActive);

  const showZToggle = !!pokemon?.speciesForme
    && (gen === 7 || nationalDexFormat);

  const showMaxToggle = !!pokemon?.speciesForme
    && !rules?.dynamax
    && gen < 9
    && (nationalDexFormat || (gen === 8 && !format?.includes('bdsp')));

  const disableMaxToggle = !pokemon?.speciesForme;

  const showEditButton = !!pokemon?.speciesForme && (
    (operatingMode === 'standalone' && honkdexSettings?.alwaysEditMoves)
      || settings?.showMoveEditor === 'always'
      || (settings?.showMoveEditor === 'meta' && !legalLockedFormat(format))
  );

  // nice one me 10/10
  const showFaintCounter = !!pokemon?.speciesForme && (
    (pokemon.dirtyAbility || pokemon.ability) === 'Supreme Overlord' as AbilityName
      || pokemon.moves?.includes('Last Respects' as MoveName)
  );

  const handleMoveToggle = (
    name: MoveName,
  ) => {
    if (!name || !PokemonToggleMoves.includes(name)) {
      return;
    }

    const moveId = formatId(name);
    const toggled = detectToggledMove(pokemon, name);

    const payload: Partial<CalcdexPokemon> = {};

    switch (moveId) {
      case 'powertrick': {
        payload.volatiles = {
          ...pokemon?.volatiles,
        };

        if (toggled) {
          delete payload.volatiles.powertrick;
        } else {
          payload.volatiles.powertrick = ['powertrick'];
        }

        break;
      }

      default: {
        break;
      }
    }

    if (!nonEmptyObject(payload)) {
      return;
    }

    updatePokemon(payload, `${l.scope}:handleMoveToggle()`);
  };

  const handleMoveChange = (
    name: MoveName,
    index: number,
  ) => {
    const moves = upsizeArray(
      [...(pokemon?.moves || [])],
      matchups?.length,
      null,
    );

    if (!Array.isArray(moves) || (moves?.[index] && moves[index] === name)) {
      return;
    }

    // update (2023/07/27): if `name` already exists at a different index in moves[], just swap them
    // so that you don't have 2 Hydro Pumps at different indices, for example lol
    // e.g., moves = ['Hydro Pump', 'Ice Beam', 'U-Turn', 'Grass Knot'], name = 'Hydro Pump', index = 1
    // before this change: ['Hydro Pump', 'Hydro Pump', 'U-Turn', 'Grass Knot']
    // after: ['Ice Beam', 'Hydro Pump', 'U-Turn', 'Grass Knot']
    // also, the `!!m` check is to allow users to yeet all the moves if they wish
    // (otherwise, they'd only be able to yeet one move!)
    const existingMoveIndex = moves.findIndex((m) => !!m && m === name);

    if (existingMoveIndex > -1) {
      // this is the move that's currently parked at the user-requested `index`
      // e.g., 'Ice Beam' (from the example above)
      const moveAtIndex = moves[index];

      // e.g., existingMoveIndex = 0, moves = ['Ice Beam', 'Ice Beam', 'U-Turn', 'Grass Knot']
      moves[existingMoveIndex] = moveAtIndex;
    }

    // set the move at the `index` as normal
    // e.g., moves = ['Ice Beam', 'Hydro Pump', 'U-Turn', 'Grass Knot']
    moves[index] = name || null;

    updatePokemon({
      moves,
    }, `${l.scope}:handleMoveChange()`);
  };

  // copies the matchup result description to the user's clipboard when the damage range is clicked
  const handleDamagePress = (
    index: number,
    description: string,
  ) => {
    if (typeof navigator === 'undefined' || typeof index !== 'number' || index < 0 || !description) {
      return;
    }

    // wrapped in an unawaited async in order to handle any thrown errors
    void (async () => {
      try {
        // await navigator.clipboard.writeText(description);
        await writeClipboardText(description);

        copiedRefs.current?.[index]?.show();
      } catch (error) {
        // no-op when an error is thrown while writing to the user's clipboard
        (() => void 0)();
      }
    })();
  };

  return (
    <TableGrid
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        !!colorScheme && styles[colorScheme],
        glassyTerrain && styles.glassy,
        className,
      )}
      style={style}
    >
      {/* table headers */}
      <TableGridItem
        className={cx(styles.header, styles.movesHeader)}
        align="left"
        header
      >
        <div className={styles.headerTitle}>
          {t('poke.moves.label', 'Moves')}
        </div>

        {
          showTeraToggle &&
          <ToggleButton
            className={cx(styles.toggleButton, styles.ultButton)}
            labelClassName={cx(
              styles.teraButtonLabel,
              (battleActive && !player?.usedTera && !pokemon?.terastallized) && styles.available,
            )}
            label={t('poke.moves.tera.label', 'TERA')}
            tooltip={(
              <div className={styles.descTooltip}>
                {
                  settings?.showUiTooltips &&
                  <Trans
                    t={t}
                    i18nKey={`poke.moves.tera.${pokemon?.terastallized ? '' : 'in'}activeTooltip`}
                    parent="div"
                    style={battleActive ? { marginBottom: 2 } : undefined}
                    shouldUnescape
                    values={{
                      types: (
                        pokemon?.types
                          ?.map((tp) => t(`pokedex:types.${formatId(tp)}.0`))
                          .join('/')
                      ) || t('pokedex:types.unknown.0'),
                      teraType: (
                        (!!pokemon?.dirtyTeraType && t(`pokedex:types.${formatId(pokemon.dirtyTeraType)}.0`))
                          || (!!pokemon?.teraType && t(`pokedex:types.${formatId(pokemon.teraType)}.0`))
                          || t('pokedex:types.unknown.0')
                      ),
                    }}
                  />
                }

                {
                  battleActive &&
                  <Trans
                    t={t}
                    i18nKey={`poke.moves.tera.${player?.usedTera ? 'un' : ''}availableTooltip`}
                    parent="div"
                    className={cx(
                      styles.ultUsage,
                      !player?.usedTera && styles.available,
                      player?.usedTera && styles.consumed,
                    )}
                    shouldUnescape
                  />
                }
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips && !battleActive}
            primary={!battleActive || !player?.usedTera || pokemon?.terastallized}
            active={pokemon?.terastallized}
            disabled={disableTeraToggle}
            onPress={() => updatePokemon({
              terastallized: !pokemon?.terastallized,
              useZ: false,
              useMax: false,
            }, `${l.scope}:ToggleButton~Tera:onPress()`)}
          />
        }

        {
          showZToggle &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.ultButton,
              showTeraToggle && styles.lessSpacing,
            )}
            label={t('poke.moves.z.label', 'Z')}
            tooltip={(
              <Trans
                t={t}
                i18nKey={`poke.moves.z.${pokemon?.useZ ? '' : 'in'}activeTooltip`}
                parent="div"
                className={styles.descTooltip}
                shouldUnescape
              />
            )}
            tooltipDisabled={!settings?.showUiTooltips}
            primary
            active={pokemon?.useZ}
            disabled={!pokemon?.speciesForme}
            onPress={() => updatePokemon({
              terastallized: false,
              useZ: !pokemon?.useZ,
              useMax: false,
            }, `${l.scope}:ToggleButton~Z:onPress()`)}
          />
        }

        {
          showMaxToggle &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.ultButton,
              (showTeraToggle || showZToggle) && styles.lessSpacing,
            )}
            label={t('poke.moves.dmax.label', {
              ultimate: `$t(pokedex:ultimates.${pokemon?.gmaxable ? 'g' : 'd'}max.2)`,
              defaultValue: pokemon?.gmaxable ? 'GMAX' : 'MAX',
            })}
            tooltip={(
              <div className={styles.descTooltip}>
                {
                  settings?.showUiTooltips &&
                  <Trans
                    t={t}
                    i18nKey={`poke.moves.dmax.${pokemon?.useMax ? '' : 'in'}activeTooltip`}
                    parent="div"
                    style={battleActive ? { marginBottom: 2 } : undefined}
                    shouldUnescape
                    values={{ ultimate: `$t(pokedex:ultimates.${pokemon?.gmaxable ? 'g' : 'd'}max.0)` }}
                  />
                }

                {
                  battleActive &&
                  <Trans
                    t={t}
                    i18nKey={`poke.moves.dmax.${player?.usedMax ? 'un' : ''}availableTooltip`}
                    parent="div"
                    className={cx(
                      styles.ultUsage,
                      !player?.usedMax && styles.available,
                      player?.usedMax && styles.consumed,
                    )}
                    shouldUnescape
                    values={{ ultimate: `$t(pokedex:ultimates.${pokemon?.gmaxable ? 'g' : 'd'}max.0)` }}
                  />
                }
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips && !battleActive}
            primary={!battleActive || !player?.usedMax || pokemon?.useMax}
            active={pokemon?.useMax}
            disabled={disableMaxToggle}
            onPress={() => updatePokemon({
              terastallized: false,
              useZ: false,
              useMax: !pokemon?.useMax,
            }, `${l.scope}:ToggleButton~Max:onPress()`)}
          />
        }

        {
          showEditButton &&
          <ToggleButton
            className={cx(styles.toggleButton, styles.editButton)}
            label={t(
              `poke.moves.editor.${pokemon?.showMoveOverrides ? '' : 'in'}activeLabel`,
              pokemon?.showMoveOverrides ? 'Hide' : 'Edit',
            )}
            tooltip={(
              <Trans
                t={t}
                i18nKey={`poke.moves.editor.${pokemon?.showMoveOverrides ? '' : 'in'}activeTooltip`}
                parent="div"
                className={styles.descTooltip}
                shouldUnescape
              />
            )}
            tooltipDisabled={!settings?.showUiTooltips}
            primary={pokemon?.showMoveOverrides}
            disabled={!pokemon?.speciesForme}
            onPress={() => updatePokemon({
              showMoveOverrides: !pokemon?.showMoveOverrides,
            }, `${l.scope}:ToggleButton~Edit:onPress()`)}
          />
        }
      </TableGridItem>

      {pokemon?.showMoveOverrides ? (
        <TableGridItem
          className={cx(
            styles.header,
            styles.editorHeader,
            showFaintCounter && styles.editorItem,
          )}
          header
          align="left"
        >
          {
            showFaintCounter &&
            <>
              <div className={styles.moveProperty}>
                <ValueField
                  className={styles.valueField}
                  label={t('poke.moves.editor.faintCounter.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
                  hideLabel
                  hint={pokemon.dirtyFaintCounter ?? (pokemon.faintCounter || 0)}
                  fallbackValue={pokemon.faintCounter || 0}
                  min={0}
                  max={(
                    formatId(pokemon.dirtyAbility || pokemon.ability) === 'supremeoverlord'
                      && !pokemon.moves.includes('Last Respects' as MoveName)
                      ? Math.max(player.maxPokemon - 1, 0)
                      : 100 // Last Respects is capped at 100 LOL
                  )}
                  step={1}
                  shiftStep={2}
                  clearOnFocus
                  absoluteHover
                  input={{
                    name: `${l.scope}:${pokemonKey}:FaintCounter`,
                    value: pokemon.dirtyFaintCounter ?? (pokemon.faintCounter || 0),
                    onChange: (value: number) => updatePokemon({
                      dirtyFaintCounter: value === pokemon.faintCounter
                        ? null
                        : value,
                    }, `${l.scope}:ValueField~FaintCounter:input.onChange()`),
                  }}
                />

                <div className={styles.propertyName}>
                  {t('poke.moves.editor.faintCounter.label')}
                </div>
              </div>

              <ToggleButton
                className={styles.editorButton}
                style={typeof pokemon.dirtyFaintCounter === 'number' ? undefined : { opacity: 0 }}
                label={t('poke.moves.editor.faintCounter.resetLabel')}
                tooltip={(
                  <Trans
                    t={t}
                    i18nKey="poke.moves.editor.faintCounter.resetTooltip"
                    parent="div"
                    className={styles.descTooltip}
                    shouldUnescape
                    values={{ count: pokemon.faintCounter }}
                  />
                )}
                tooltipDisabled={!settings?.showUiTooltips}
                primary={typeof pokemon.dirtyFaintCounter === 'number'}
                disabled={typeof pokemon.dirtyFaintCounter !== 'number'}
                onPress={() => updatePokemon({
                  dirtyFaintCounter: null,
                }, `${l.scope}:ToggleButton~ResetFaintCounter:onPress()`)}
              />
            </>
          }
        </TableGridItem>
      ) : (
        <>
          <TableGridItem
            className={cx(styles.header, styles.dmgHeader)}
            header
          >
            <div className={styles.headerTitle}>
              {t('poke.moves.dmg', 'DMG')}
            </div>

            <ToggleButton
              className={styles.toggleButton}
              label={t('poke.moves.criticalHit.label', 'CRIT')}
              tooltip={(
                <Trans
                  t={t}
                  i18nKey={`poke.moves.criticalHit.${pokemon?.criticalHit ? '' : 'in'}activeTooltip`}
                  parent="div"
                  className={styles.descTooltip}
                  shouldUnescape
                />
              )}
              tooltipDisabled={!settings?.showUiTooltips}
              primary
              active={pokemon?.criticalHit}
              disabled={!pokemon?.speciesForme}
              onPress={() => updatePokemon({
                criticalHit: !pokemon?.criticalHit,
              }, `${l.scope}:ToggleButton~Crit:onPress()`)}
            />
          </TableGridItem>

          <TableGridItem
            className={styles.header}
            header
          >
            <div className={styles.headerTitle}>
              {t('poke.moves.nhko', 'KO %')}
            </div>
          </TableGridItem>
        </>
      )}

      {/* (actual) moves */}
      {Array(matchups.length).fill(null).map((_, i) => {
        // const moveName = pokemon?.moves?.[i];
        // const move = moveName ? dex?.moves.get(moveName) : null;
        // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
        // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

        const {
          defender,
          move: calcMove,
          description,
          damageRange,
          koChance,
          koColor,
        } = matchups[i] || {};

        // const moveName = calcMove?.name;
        const moveName = pokemon?.moves?.[i] || calcMove?.name;
        const moveToggled = detectToggledMove(pokemon, moveName);

        // getMoveOverrideDefaults() could return null, so spreading here to avoid a "Cannot read properties of null" error
        // (could make it not return null, but too lazy atm lol)
        const moveDefaults = { ...getMoveOverrideDefaults(format, pokemon, moveName, opponentPokemon, field) };
        const moveOverrides = { ...moveDefaults, ...pokemon?.moveOverrides?.[moveName] };
        const damagingMove = ['Physical', 'Special'].includes(moveOverrides.category);

        const hasOverrides = pokemon?.showMoveOverrides
          && hasMoveOverrides(format, pokemon, moveName, opponentPokemon, field);

        const showStellarToggle = (pokemon?.dirtyTeraType || pokemon?.teraType) === 'Stellar'
          && pokemon.terastallized
          && damagingMove;

        const stellarToggled = showStellarToggle && (
          moveOverrides.stellar
            ?? (!!moveOverrides.type && !pokemon?.stellarMoveMap?.[moveOverrides.type])
        );

        // update (2023/12/30): for moves like Triple Axel with no minHits/maxHits defined, since you could theoretically
        // miss, the fallback minHits will be 1 & maxHits the current `hits` value from the `moveDefaults`
        const showHitsField = (!pokemon?.useZ && !pokemon?.useMax)
          && !!moveDefaults.hits
          && !!moveDefaults.minHits
          && !!moveDefaults.maxHits;
          // && (moveDefaults.hits !== moveDefaults.minHits || moveDefaults.hits !== moveDefaults.maxHits);

        const basePowerKey: keyof CalcdexMoveOverride = (pokemon?.useZ && 'zBasePower')
          || (pokemon?.useMax && 'maxBasePower')
          || 'basePower';

        const fallbackBasePower = (pokemon?.useZ && moveDefaults.zBasePower)
          || (pokemon?.useMax && moveDefaults.maxBasePower)
          || calcMove?.bp
          || 0;

        const showDamageAmounts = !pokemon?.showMoveOverrides
          && !!description?.damageAmounts
          && (
            settings?.showMatchupDamageAmounts === 'always'
              || (settings?.showMatchupDamageAmounts === 'nfe' && defender?.species.nfe)
          );

        const showMatchupTooltip = !pokemon?.showMoveOverrides
          && settings?.showMatchupTooltip
          && !!description?.raw;

        const matchupTooltip = showMatchupTooltip ? (
          <div className={styles.descTooltip}>
            {settings?.prettifyMatchupDescription ? (
              <>
                {description?.attacker}
                {
                  !!description?.defender &&
                  <>
                    {
                      !!description.attacker &&
                      <>
                        <br />
                        vs
                        <br />
                      </>
                    }
                    {description.defender}
                  </>
                }
                {(!!description?.damageRange || !!description?.koChance) && ':'}
                {
                  !!description?.damageRange &&
                  <>
                    <br />
                    {description.damageRange}
                  </>
                }
                {
                  !!description?.koChance &&
                  <>
                    <br />
                    {description.koChance}
                  </>
                }
              </>
            ) : description.raw}

            {
              showDamageAmounts &&
              <>
                <br />
                <br />
                {settings?.formatMatchupDamageAmounts ? (
                  <>({formatDamageAmounts(description.damageAmounts)})</>
                ) : (
                  <>({description.damageAmounts})</>
                )}
              </>
            }
          </div>
        ) : null;

        // checking if a damaging move has non-0 BP (would be 'N/A' for status moves)
        // e.g., move dex reports 0 BP for Mirror Coat, a Special move ('IMMUNE' wouldn't be correct here)
        const parsedDamageRange = moveName
          ? damageRange
            || (moveOverrides[basePowerKey] || fallbackBasePower ? 'IMMUNE' : '???')
          : null;

        const hasDamageRange = !!parsedDamageRange
          && !['IMMUNE', 'N/A', '???'].includes(parsedDamageRange);

        return (
          <React.Fragment key={`${l.scope}:${pokemonKey}:MoveRow:Moves:${i}`}>
            <TableGridItem align="left">
              <Dropdown
                aria-label={t('poke.moves.slot.aria', {
                  count: i + 1,
                  pokemon: friendlyPokemonName,
                }) as React.ReactNode}
                hint={t('poke.moves.slot.hint') as React.ReactNode}
                optionTooltip={PokeMoveOptionTooltip}
                optionTooltipProps={{
                  format,
                  pokemon,
                  opponentPokemon,
                  field,
                  hidden: !settings?.showMoveTooltip,
                }}
                input={{
                  name: `${l.scope}:${pokemonKey}:Moves:${i}`,
                  value: moveName,
                  onChange: (name: MoveName) => handleMoveChange(name, i),
                }}
                options={moveOptions}
                noOptionsMessage={t('poke.moves.slot.empty') as React.ReactNode}
                filterOption={moveOptionsFilter}
                disabled={!pokemon?.speciesForme}
              />
            </TableGridItem>

            {pokemon?.showMoveOverrides ? (
              <TableGridItem className={styles.editorItem}>
                <div className={styles.editorLeft}>
                  <PokeTypeField
                    input={{
                      name: `${l.scope}:${pokemonKey}:MoveOverrides:${moveName}:Type`,
                      value: moveOverrides.type,
                      onChange: (value: Showdown.TypeName) => updatePokemon({
                        moveOverrides: {
                          [moveName]: { type: value },
                        },
                      }, `${l.scope}:PokeTypeField:input.onChange()`),
                    }}
                  />

                  <MoveCategoryField
                    ariaLabel={t('poke.moves.editor.category.aria', {
                      move: moveName,
                      pokemon: friendlyPokemonName,
                    }) as React.ReactNode}
                    format={format}
                    input={{
                      name: `${l.scope}:${pokemonKey}:MoveOverrides:${moveName}:Category`,
                      value: moveOverrides,
                      onChange: (value: Partial<CalcdexMoveOverride>) => updatePokemon({
                        moveOverrides: { [moveName]: value },
                      }, `${l.scope}:MoveCategoryField:input.onChange()`),
                    }}
                    readOnly={moveOverrides.category === 'Status'}
                  />

                  {
                    PokemonToggleMoves.includes(moveName) &&
                    <ToggleButton
                      className={styles.editorButton}
                      label={t('poke.moves.editor.active.label')}
                      tooltip={(
                        <Trans
                          t={t}
                          i18nKey={`poke.moves.editor.active.${moveToggled ? '' : 'in'}activeTooltip`}
                          parent="div"
                          className={styles.descTooltip}
                          shouldUnescape
                          values={{ move: moveName }}
                        />
                      )}
                      tooltipDisabled={!settings?.showUiTooltips}
                      active={moveToggled}
                      onPress={() => handleMoveToggle(moveName)}
                    />
                  }

                  {
                    showStellarToggle &&
                    <ToggleButton
                      className={styles.editorButton}
                      label={t('poke.moves.editor.stellar.label')}
                      tooltip={(
                        <Trans
                          t={t}
                          i18nKey={`poke.moves.editor.stellar.${stellarToggled ? '' : 'in'}activeTooltip`}
                          parent="div"
                          className={styles.descTooltip}
                          shouldUnescape
                        />
                      )}
                      tooltipDisabled={!settings?.showUiTooltips}
                      active={stellarToggled}
                      disabled={pokemon.speciesForme === 'Terapagos-Stellar'} // always on
                      onPress={() => updatePokemon({
                        moveOverrides: {
                          [moveName]: { stellar: !stellarToggled },
                        },
                      }, `${l.scope}:ToggleButton~Stellar:onPress()`)}
                    />
                  }

                  {
                    showHitsField &&
                    <div className={styles.moveProperty}>
                      <ValueField
                        className={styles.valueField}
                        label={t('poke.moves.editor.hits.aria', {
                          move: moveName,
                          pokemon: friendlyPokemonName,
                        }) as React.ReactNode}
                        hideLabel
                        hint={moveOverrides.hits}
                        fallbackValue={moveDefaults.hits}
                        min={moveDefaults.minHits === moveDefaults.hits ? 1 : moveDefaults.minHits}
                        max={moveDefaults.maxHits}
                        step={1}
                        clearOnFocus
                        absoluteHover
                        input={{
                          name: `${l.scope}:${pokemonKey}:MoveOverrides:${moveName}:Hits`,
                          value: moveOverrides.hits,
                          onChange: (value: number) => updatePokemon({
                            moveOverrides: {
                              [moveName]: {
                                hits: clamp(
                                  moveDefaults.minHits === moveDefaults.hits ? 1 : moveDefaults.minHits,
                                  value,
                                  moveDefaults.maxHits,
                                ),
                              },
                            },
                          }, `${l.scope}:ValueField~Hits:input.onChange()`),
                        }}
                      />

                      <div className={styles.propertyName}>
                        {t('poke.moves.editor.hits.label', { count: moveOverrides.hits })}
                      </div>
                    </div>
                  }

                  {
                    damagingMove &&
                    <div className={styles.moveProperty}>
                      <ValueField
                        className={styles.valueField}
                        label={t('poke.moves.editor.bp.aria', {
                          move: moveName,
                          pokemon: friendlyPokemonName,
                        }) as React.ReactNode}
                        hideLabel
                        hint={moveOverrides[basePowerKey]?.toString() || 0}
                        fallbackValue={fallbackBasePower}
                        min={0}
                        max={999} // hmm...
                        step={1}
                        shiftStep={10}
                        clearOnFocus
                        absoluteHover
                        input={{
                          name: `${l.scope}:${pokemonKey}:MoveOverrides:${moveName}:BasePower`,
                          value: moveOverrides[basePowerKey],
                          onChange: (value: number) => updatePokemon({
                            moveOverrides: {
                              [moveName]: { [basePowerKey]: clamp(0, value, 999) },
                            },
                          }, `${l.scope}:ValueField~BasePower:input.onChange()`),
                        }}
                      />

                      <div className={styles.propertyName}>
                        {pokemon?.useZ && !pokemon?.useMax && `${t('pokedex:ultimates.z.2')} `}
                        {pokemon?.useMax && `${t('pokedex:ultimates.dmax.2')} `}
                        {t('poke.moves.editor.bp.label')}
                      </div>
                    </div>
                  }
                </div>

                <div className={styles.editorRight}>
                  <ToggleButton
                    className={styles.editorButton}
                    style={hasOverrides ? undefined : { opacity: 0 }}
                    label={t('poke.moves.editor.resetLabel')}
                    tooltip={(
                      <Trans
                        t={t}
                        i18nKey="poke.moves.editor.resetTooltip"
                        parent="div"
                        className={styles.descTooltip}
                        shouldUnescape
                        values={{ move: moveName }}
                      />
                    )}
                    tooltipDisabled={!settings?.showUiTooltips}
                    primary={hasOverrides}
                    disabled={!hasOverrides}
                    onPress={() => updatePokemon({
                      moveOverrides: {
                        [moveName]: null,
                      },
                    }, `${l.scope}:ToggleButton~ResetMoveOverrides:onPress()`)}
                  />
                </div>
              </TableGridItem>
            ) : (
              <>
                <TableGridItem className={styles.quickEditor}>
                  {
                    (settings?.enableQuickEditor && showHitsField) &&
                    <div className={styles.moveProperty}>
                      <ValueField
                        className={styles.valueField}
                        label={t('poke.moves.editor.hits.aria', {
                          move: moveName,
                          pokemon: friendlyPokemonName,
                        }) as React.ReactNode}
                        hideLabel
                        hint={moveOverrides.hits}
                        fallbackValue={moveDefaults.hits}
                        min={moveDefaults.minHits === moveDefaults.hits ? 1 : moveDefaults.minHits}
                        max={moveDefaults.maxHits}
                        step={1}
                        clearOnFocus
                        absoluteHover
                        input={{
                          name: `${l.scope}:${pokemonKey}:MoveOverrides:${moveName}:Hits`,
                          value: moveOverrides.hits,
                          onChange: (value: number) => updatePokemon({
                            moveOverrides: {
                              [moveName]: {
                                hits: clamp(
                                  moveDefaults.minHits === moveDefaults.hits ? 1 : moveDefaults.minHits,
                                  value,
                                  moveDefaults.maxHits,
                                ),
                              },
                            },
                          }, `${l.scope}:ValueField~Hits:input.onChange()`),
                        }}
                      />

                      <div className={styles.propertyName}>
                        <i className="fa fa-close" />
                      </div>
                    </div>
                  }

                  {/* [XXX.X% &ndash;] XXX.X% */}
                  {/* (note: '0 - 0%' damageRange will be reported as 'N/A') */}
                  {opponentPokemon?.speciesForme && (settings?.showNonDamageRanges || hasDamageRange) ? (
                    settings?.showMatchupTooltip && settings.copyMatchupDescription ? (
                      <Button
                        className={cx(
                          styles.damageButton,
                          (!showMatchupTooltip || !hasDamageRange) && styles.disabled,
                        )}
                        labelClassName={cx(
                          styles.damageButtonLabel,
                          !hasDamageRange && styles.noDamage,
                        )}
                        tabIndex={-1} // not ADA compliant, obviously lol
                        label={parsedDamageRange}
                        tooltip={matchupTooltip}
                        tooltipTrigger="mouseenter"
                        tooltipTouch={['hold', 500]}
                        tooltipDisabled={!showMatchupTooltip || !hasDamageRange}
                        hoverScale={1}
                        absoluteHover
                        disabled={!showMatchupTooltip || !hasDamageRange}
                        onPress={() => handleDamagePress(i, [
                          description.raw,
                          showDamageAmounts && `(${description.damageAmounts})`,
                        ].filter(Boolean).join(' '))}
                      >
                        <Badge
                          ref={(ref) => { copiedRefs.current[i] = ref; }}
                          className={styles.copiedBadge}
                          label={t('poke.moves.copiedBadge')}
                          color="green"
                        />
                      </Button>
                    ) : (
                      <Tooltip
                        content={matchupTooltip}
                        offset={[0, 10]}
                        delay={[1000, 50]}
                        trigger="mouseenter"
                        touch={['hold', 500]}
                        disabled={!showMatchupTooltip || !hasDamageRange}
                      >
                        <div
                          className={cx(
                            styles.damageButtonLabel,
                            styles.noCopy,
                            !hasDamageRange && styles.noDamage,
                          )}
                        >
                          {(
                            (parsedDamageRange === 'IMMUNE' && t('poke.moves.immune'))
                              || (parsedDamageRange === 'N/A' && t('poke.moves.na'))
                              || parsedDamageRange
                          )}
                        </div>
                      </Tooltip>
                    )
                  ) : null}
                </TableGridItem>

                <TableGridItem
                  style={{
                    ...(!koChance ? { opacity: 0.3 } : null),
                    ...(koColor ? { color: koColor } : null),
                  }}
                >
                  {/* XXX% XHKO */}
                  {koChance}
                </TableGridItem>
              </>
            )}
          </React.Fragment>
        );
      })}
    </TableGrid>
  );
};
