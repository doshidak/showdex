import * as React from 'react';
import cx from 'classnames';
import { Dropdown, PokeTypeField, ValueField } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import {
  Badge,
  Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { legalLockedFormat } from '@showdex/utils/battle';
import { clamp, upsizeArray, writeClipboardText } from '@showdex/utils/core';
import { getMoveOverrideDefaults, hasMoveOverrides } from '@showdex/utils/dex';
import { formatDamageAmounts } from '@showdex/utils/ui';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { BadgeInstance } from '@showdex/components/ui';
import type { CalcdexMoveOverride } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { useCalcdexPokeContext } from '../CalcdexPokeContext';
import { PokeMoveOptionTooltip } from './PokeMoveOptionTooltip';
import styles from './PokeMoves.module.scss';

export interface PokeMovesProps {
  className?: string;
  style?: React.CSSProperties;
  containerSize?: ElementSizeLabel;
}

const baseScope = '@showdex/pages/Calcdex/PokeMoves';

export const PokeMoves = ({
  className,
  style,
  containerSize,
}: PokeMovesProps): JSX.Element => {
  const {
    state,
    settings,
    player,
    playerPokemon: pokemon,
    opponentPokemon,
    moveOptions,
    matchups,
    updatePokemon,
  } = useCalcdexPokeContext();

  const {
    active: battleActive,
    gen,
    format,
    rules,
  } = state;

  const colorScheme = useColorScheme();
  const copiedRefs = React.useRef<BadgeInstance[]>([]);

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const nationalDexFormat = !!format && [
    'nationaldex',
    'natdex',
  ].some((f) => format.includes(f));

  const showTeraToggle = !!pokemon?.speciesForme && gen > 8;

  const disableTeraToggle = !pokemon?.speciesForme
    || !pokemon.teraType
    || pokemon.teraType === '???'
    || (settings?.lockUsedTera && player?.usedTera && battleActive);

  const showZToggle = !!pokemon?.speciesForme
    && (gen === 7 || nationalDexFormat);

  const showMaxToggle = !!pokemon?.speciesForme
    && !rules?.dynamax
    && gen < 9
    && (nationalDexFormat || (gen === 8 && !format?.includes('bdsp')));

  const disableMaxToggle = !pokemon?.speciesForme;
  //  || (player?.usedMax && battleActive);

  const showEditButton = !!pokemon?.speciesForme && (
    settings?.showMoveEditor === 'always'
      || (settings?.showMoveEditor === 'meta' && !legalLockedFormat(format))
  );

  const handleMoveChange = (name: MoveName, index: number) => {
    const moves = upsizeArray(
      [...(pokemon?.moves || [])],
      matchups?.length,
      null,
    );

    if (!Array.isArray(moves) || (moves?.[index] && moves[index] === name)) {
      return;
    }

    // when move is cleared, `name` will be null/undefined, so coalesce into an empty string
    moves[index] = (name?.replace('*', '') ?? '') as MoveName;

    updatePokemon({
      moves,
    }, `${baseScope}:handleMoveChange()`);
  };

  // copies the matchup result description to the user's clipboard when the damage range is clicked
  const handleDamagePress = (index: number, description: string) => {
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
        (() => {})();
      }
    })();
  };

  return (
    <TableGrid
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        // ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
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
          Moves
        </div>

        {
          showTeraToggle &&
          <ToggleButton
            className={cx(styles.toggleButton, styles.ultButton)}
            label="Tera"
            // tooltip={[
            //   pokemon?.terastallized ? 'Revert' : 'Terastallize',
            //   'to',
            //   (pokemon?.terastallized ? pokemon?.types?.join('/') : pokemon?.teraType) || '???',
            // ].join(' ')}
            tooltip={(
              <div className={styles.descTooltip}>
                {
                  settings?.showUiTooltips &&
                  <div style={battleActive ? { marginBottom: 2 } : undefined}>
                    {pokemon?.terastallized ? 'Revert' : 'Terastallize'} to{' '}
                    {(pokemon?.terastallized ? pokemon?.types?.join('/') : pokemon?.teraType) || '???'}
                  </div>
                }

                {
                  battleActive &&
                  <div
                    className={cx(
                      styles.ultUsage,
                      !player?.usedTera && styles.available,
                      player?.usedTera && styles.consumed,
                    )}
                  >
                    Tera <strong>{player?.usedTera ? 'Used' : 'Available'}</strong>
                  </div>
                }
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips && !battleActive}
            primary
            active={pokemon?.terastallized}
            disabled={disableTeraToggle}
            onPress={() => updatePokemon({
              terastallized: !pokemon?.terastallized,
              useZ: false,
              useMax: false,
            }, `${baseScope}:ToggleButton~Tera:onPress()`)}
          />
        }

        {
          showZToggle &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.ultButton,
              gen > 8 && styles.lessSpacing,
            )}
            label="Z"
            tooltip={`${pokemon?.useZ ? 'Deactivate' : 'Activate'} Z-Moves`}
            tooltipDisabled={!settings?.showUiTooltips}
            primary
            active={pokemon?.useZ}
            disabled={!pokemon?.speciesForme}
            onPress={() => updatePokemon({
              terastallized: false,
              useZ: !pokemon?.useZ,
              useMax: false,
            }, `${baseScope}:ToggleButton~Z:onPress()`)}
          />
        }

        {
          showMaxToggle &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.ultButton,
              showZToggle && styles.lessSpacing,
            )}
            label="Max"
            tooltip={(
              <div className={styles.descTooltip}>
                {
                  settings?.showUiTooltips &&
                  <div style={battleActive ? { marginBottom: 2 } : undefined}>
                    {pokemon?.useMax ? 'Deactivate' : 'Activate'} Max Moves
                  </div>
                }

                {
                  battleActive &&
                  <div
                    className={cx(
                      styles.ultUsage,
                      !player?.usedMax && styles.available,
                      player?.usedMax && styles.consumed,
                    )}
                  >
                    Dmax <strong>{player?.usedMax ? 'Used' : 'Available'}</strong>
                  </div>
                }
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips && !battleActive}
            primary
            active={pokemon?.useMax}
            disabled={disableMaxToggle}
            onPress={() => updatePokemon({
              terastallized: false,
              useZ: false,
              useMax: !pokemon?.useMax,
            }, `${baseScope}:ToggleButton~Max:onPress()`)}
          />
        }

        {
          showEditButton &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.editButton,
              // pokemon?.showMoveOverrides && styles.hideButton,
            )}
            label={pokemon?.showMoveOverrides ? 'Hide' : 'Edit'}
            tooltip={`${pokemon?.showMoveOverrides ? 'Close' : 'Open'} Move Editor`}
            tooltipDisabled={!settings?.showUiTooltips}
            primary={pokemon?.showMoveOverrides}
            // active={pokemon?.showMoveOverrides}
            disabled={!pokemon?.speciesForme}
            onPress={() => updatePokemon({
              showMoveOverrides: !pokemon?.showMoveOverrides,
            }, `${baseScope}:ToggleButton~Edit:onPress()`)}
          />
        }
      </TableGridItem>

      {pokemon?.showMoveOverrides ? (
        <TableGridItem
          className={cx(styles.header, styles.editorHeader)}
          header
        >
          {/* <div className={styles.headerTitle}>
            Properties
          </div> */}
        </TableGridItem>
      ) : (
        <>
          <TableGridItem
            className={cx(styles.header, styles.dmgHeader)}
            header
          >
            <div className={styles.headerTitle}>
              DMG
            </div>

            <ToggleButton
              className={styles.toggleButton}
              label="Crit"
              tooltip={`${pokemon?.criticalHit ? 'Hide' : 'Show'} Critical Hit Damages`}
              tooltipDisabled={!settings?.showUiTooltips}
              primary
              active={pokemon?.criticalHit}
              disabled={!pokemon?.speciesForme}
              onPress={() => updatePokemon({
                criticalHit: !pokemon?.criticalHit,
              }, `${baseScope}:ToggleButton~Crit:onPress()`)}
            />
          </TableGridItem>

          <TableGridItem
            className={styles.header}
            header
          >
            <div className={styles.headerTitle}>
              KO %
            </div>
          </TableGridItem>
        </>
      )}

      {/* (actual) moves */}
      {Array(matchups.length).fill(null).map((_, i) => {
        // const moveName = pokemon?.moves?.[i];
        // const move = moveName ? dex?.moves.get(moveName) : null;
        // const moveDescription = move?.shortDesc || move?.desc;

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

        // getMoveOverrideDefaults() could return null, so spreading here to avoid a "Cannot read properties of null" error
        // (could make it not return null, but too lazy atm lol)
        const moveDefaults = { ...getMoveOverrideDefaults(format, pokemon, moveName, opponentPokemon) };

        const moveOverrides = {
          ...moveDefaults,
          ...pokemon?.moveOverrides?.[moveName],
        };

        const damagingMove = [
          'Physical',
          'Special',
        ].includes(moveOverrides.category);

        const hasOverrides = pokemon?.showMoveOverrides
          && hasMoveOverrides(format, pokemon, moveName, opponentPokemon);

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
          <React.Fragment
            key={`PokeMoves:Moves:${pokemonKey}:MoveRow:${i}`}
          >
            <TableGridItem align="left">
              <Dropdown
                aria-label={`Move Slot ${i + 1} for Pokemon ${friendlyPokemonName}`}
                hint="--"
                optionTooltip={PokeMoveOptionTooltip}
                optionTooltipProps={{
                  format,
                  pokemon,
                  opponentPokemon,
                  hidden: !settings?.showMoveTooltip,
                }}
                input={{
                  name: `PokeMoves:Moves:${pokemonKey}:Dropdown:${i}`,
                  value: moveName,
                  onChange: (name: MoveName) => handleMoveChange(name, i),
                }}
                options={moveOptions}
                noOptionsMessage="No Moves Found"
                disabled={!pokemon?.speciesForme}
              />
            </TableGridItem>

            {pokemon?.showMoveOverrides ? (
              <TableGridItem className={styles.editorItem}>
                <div className={styles.editorLeft}>
                  <PokeTypeField
                    input={{
                      value: moveOverrides.type,
                      onChange: (value: Showdown.TypeName) => updatePokemon({
                        moveOverrides: {
                          [moveName]: { type: value },
                        },
                      }, `${baseScope}:PokeTypeField~Move:input.onChange()`),
                    }}
                  />

                  <ToggleButton
                    className={cx(
                      styles.editorButton,
                      styles.categoryButton,
                      moveOverrides.category === 'Status' && styles.readOnly,
                    )}
                    label={moveOverrides.category?.slice(0, 4)}
                    tooltip={(
                      <div className={styles.descTooltip}>
                        {
                          damagingMove &&
                          <>
                            Switch to{' '}
                            <em>{moveOverrides.category === 'Physical' ? 'Special' : 'Physical'}</em>
                            <br />
                          </>
                        }

                        <strong>{moveOverrides.category}</strong>
                      </div>
                    )}
                    tooltipDisabled={!settings?.showUiTooltips}
                    primary={damagingMove}
                    onPress={damagingMove ? () => updatePokemon({
                      moveOverrides: {
                        [moveName]: {
                          category: moveOverrides.category === 'Physical'
                            ? 'Special'
                            : 'Physical',
                        },
                      },
                    }, `${baseScope}:ToggleButton~Category:onPress()`) : undefined}
                  />

                  {
                    damagingMove &&
                    <>
                      <div className={styles.moveProperty}>
                        <ValueField
                          className={styles.valueField}
                          label={`Base Power Override for ${moveName} of Pokemon ${friendlyPokemonName}`}
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
                            value: moveOverrides[basePowerKey],
                            onChange: (value: number) => updatePokemon({
                              moveOverrides: {
                                [moveName]: { [basePowerKey]: clamp(0, value, 999) },
                              },
                            }),
                          }}
                        />

                        <div className={styles.propertyName}>
                          {pokemon?.useZ && !pokemon?.useMax && 'Z '}
                          {pokemon?.useMax && 'Max '}
                          BP
                        </div>
                      </div>

                      {
                        ['md', 'lg', 'xl'].includes(containerSize) &&
                        <div
                          className={styles.moveProperty}
                          style={{ marginLeft: '1em' }}
                        >
                          <ToggleButton
                            className={styles.editorButton}
                            style={{ marginRight: 3 }}
                            label="ATK"
                            tooltip={(
                              <div className={styles.descTooltip}>
                                Use this Pok&eacute;mon's ATK stat.
                              </div>
                            )}
                            tooltipDisabled={!settings?.showUiTooltips}
                            primary
                            active={moveOverrides.offensiveStat === 'atk'}
                            activeScale={moveOverrides.offensiveStat === 'atk' ? 0.98 : undefined}
                            onPress={() => updatePokemon({
                              moveOverrides: {
                                [moveName]: { offensiveStat: 'atk' },
                              },
                            }, `${baseScope}:ToggleButton~Offense-ATK:onPress()`)}
                          />
                          <ToggleButton
                            className={styles.editorButton}
                            style={{ marginRight: '0.8em' }}
                            label="SPA"
                            tooltip={(
                              <div className={styles.descTooltip}>
                                Use this Pok&eacute;mon's SPA stat.
                              </div>
                            )}
                            tooltipDisabled={!settings?.showUiTooltips}
                            primary
                            active={moveOverrides.offensiveStat === 'spa'}
                            activeScale={moveOverrides.offensiveStat === 'spa' ? 0.98 : undefined}
                            onPress={() => updatePokemon({
                              moveOverrides: {
                                [moveName]: { offensiveStat: 'spa' },
                              },
                            }, `${baseScope}:ToggleButton~Offense-SPA:onPress()`)}
                          />

                          <div
                            className={styles.propertyName}
                            style={{ opacity: 0.5 }}
                          >
                            vs
                          </div>

                          <ToggleButton
                            className={styles.editorButton}
                            style={{ marginRight: 3, marginLeft: '0.8em' }}
                            label="DEF"
                            tooltip={(
                              <div className={styles.descTooltip}>
                                Use the opposing Pok&eacute;mon's DEF stat.
                              </div>
                            )}
                            tooltipDisabled={!settings?.showUiTooltips}
                            primary
                            active={moveOverrides.defensiveStat === 'def'}
                            activeScale={moveOverrides.defensiveStat === 'def' ? 0.98 : undefined}
                            onPress={() => updatePokemon({
                              moveOverrides: {
                                [moveName]: { defensiveStat: 'def' },
                              },
                            }, `${baseScope}:ToggleButton~Defense-DEF:onPress()`)}
                          />
                          <ToggleButton
                            className={styles.editorButton}
                            // style={{ marginRight: 3 }}
                            label="SPD"
                            tooltip={(
                              <div className={styles.descTooltip}>
                                Use the opposing Pok&eacute;mon's SPD stat.
                              </div>
                            )}
                            tooltipDisabled={!settings?.showUiTooltips}
                            primary
                            active={moveOverrides.defensiveStat === 'spd'}
                            activeScale={moveOverrides.defensiveStat === 'spd' ? 0.98 : undefined}
                            onPress={() => updatePokemon({
                              moveOverrides: {
                                [moveName]: { defensiveStat: 'spd' },
                              },
                            }, `${baseScope}:ToggleButton~Defense-SPD:onPress()`)}
                          />
                          {/* update (2022/11/04): ignoreDefensive in createSmogonMove() doesn't seem to do anything */}
                          {/* <ToggleButton
                            className={styles.editorButton}
                            label="IGN"
                            tooltip={(
                              <div className={styles.descTooltip}>
                                Ignore/bypass the opposing Pok&eactue;mon's defensive stats.
                              </div>
                            )}
                            tooltipDisabled={!settings?.showUiTooltips}
                            primary
                            active={moveOverrides.defensiveStat === 'ignore'}
                            onPress={() => updatePokemon({
                              moveOverrides: {
                                [moveName]: { defensiveStat: 'ignore' },
                              },
                            })}
                          /> */}
                        </div>
                      }
                    </>
                  }
                </div>

                <div className={styles.editorRight}>
                  <ToggleButton
                    className={styles.editorButton}
                    style={hasOverrides ? undefined : { opacity: 0 }}
                    label="Reset"
                    tooltip="Reset Move to Defaults"
                    tooltipDisabled={!settings?.showUiTooltips}
                    primary={hasOverrides}
                    disabled={!hasOverrides}
                    onPress={() => updatePokemon({
                      moveOverrides: {
                        [moveName]: null,
                      },
                    }, `${baseScope}:ToggleButton~Reset:onPress()`)}
                  />
                </div>
              </TableGridItem>
            ) : (
              <>
                <TableGridItem>
                  {/* [XXX.X% &ndash;] XXX.X% */}
                  {/* (note: '0 - 0%' damageRange will be reported as 'N/A') */}
                  {(settings?.showNonDamageRanges || hasDamageRange) ? (
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
                          label="Copied!"
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
                          {parsedDamageRange}
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
