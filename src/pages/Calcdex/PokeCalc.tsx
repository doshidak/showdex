import * as React from 'react';
import {
  calculate,
  Field as SmogonField,
  Move as SmogonMove,
} from '@smogon/calc';
import cx from 'classnames';
import { Picon, PokeStatus, PokeType } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { Button } from '@showdex/components/ui';
import {
  PokemonBoostNames,
  PokemonNatureBoosts,
  PokemonNatures,
  PokemonStatNames,
} from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  Generation,
  GenerationNum,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { CalcdexBattleField, CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonHp } from './calcPokemonHp';
import { createSmogonPokemon } from './createSmogonPokemon';
import { formatStatBoost } from './formatStatBoost';
import styles from './PokeCalc.module.scss';

interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
  playerPokemon: CalcdexPokemon;
  opponentPokemon: CalcdexPokemon;
  field?: CalcdexBattleField;
  gen?: GenerationNum;
  dex?: Generation;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

const l = logger('Calcdex/PokeCalc');

export const PokeCalc = ({
  className,
  style,
  playerPokemon,
  opponentPokemon,
  field,
  gen = 8,
  dex,
  onPokemonChange,
}: PokeCalcProps): JSX.Element => {
  const pokemonInvalid = !playerPokemon?.speciesForme;

  const currentHp = calcPokemonHp(playerPokemon);

  const smogonPlayerPokemon = createSmogonPokemon(gen, playerPokemon);
  const smogonOpponentPokemon = createSmogonPokemon(gen, opponentPokemon);
  const smogonField = field?.gameType ? new SmogonField(field) : null;

  return (
    <div
      className={cx(className)}
      style={style}
    >
      <div className={styles.row}>
        <div style={{ flex: '0 0 40px', transform: 'translateY(-2px)' }}>
          <Picon
            style={{ transform: 'scaleX(-1)' }}
            pokemon={{
              ...playerPokemon,
              item: playerPokemon?.dirtyItem || playerPokemon?.item,
            }}
          />
        </div>

        <div style={{ flex: 1.25 }}>
          <span className={styles.pokemonName}>
            {playerPokemon?.name || '???'}
          </span>

          <span className={styles.small}>
            {
              (typeof playerPokemon?.level === 'number' && playerPokemon.level !== 100) &&
              <>
                {' '}
                <span style={{ opacity: 0.5 }}>
                  L{playerPokemon.level}
                </span>
              </>
            }

            {
              !!playerPokemon?.types?.length &&
              <>
                {' '}
                {playerPokemon.types.map((type, i) => (
                  <PokeType
                    key={`PokeCalc-PokeType:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${type}`}
                    style={playerPokemon.types.length > 1 && i === 0 ? { marginRight: 2 } : null}
                    type={type}
                  />
                ))}
              </>
            }
          </span>

          <br />

          <span className={styles.statLabel}>
            HP
          </span>
          {' '}

          <span
            className={styles.hpBar}
            style={{ marginBottom: 2 }}
          >
            <span
              className={cx(
                styles.valueBar,
                // pokemon?.hpcolor === 'g' && styles.green,
                // pokemon?.hpcolor === 'y' && styles.yellow,
                // pokemon?.hpcolor === 'r' && styles.red,
              )}
              style={{ width: `${(currentHp * 100).toFixed(3)}%` }}
            />
          </span>

          {
            !!currentHp &&
            <>
              {' '}
              {`${(currentHp * 100).toFixed(0)}%`}
            </>
          }

          {
            (!!playerPokemon?.status || playerPokemon?.fainted || !currentHp) &&
            <>
              {' '}
              <PokeStatus
                // status={values.status}
                status={playerPokemon?.status}
                fainted={playerPokemon?.fainted || !currentHp}
              />
            </>
          }
        </div>

        <div style={{ flex: 1 }}>
          <div className={styles.statLabel}>
            Set

            {/*
              (!!format && typeof gen === 'number') &&
              <>
                {' '}
                <span
                  className={styles.small}
                  style={{ textTransform: 'none', opacity: 0.5 }}
                >
                  {format || `gen${gen}`}
                </span>
              </>
            */}

            {' '}
            <Button
              style={{ verticalAlign: 'middle', marginBottom: 2 }}
              labelClassName={cx(styles.small)}
              labelStyle={{
                textTransform: 'uppercase',
                ...(playerPokemon?.autoPreset ? undefined : { color: '#FFFFFF' }),
              }}
              label="Auto"
              absoluteHover
              disabled={!playerPokemon?.presets?.length}
              onPress={() => onPokemonChange?.({
                calcdexId: playerPokemon?.calcdexId,
                ident: playerPokemon?.ident,
                // speciesForme: playerPokemon?.speciesForme,
                autoPreset: !playerPokemon?.autoPreset,
              })}
            />
          </div>

          <Dropdown
            aria-label="Pokemon Set"
            hint="None"
            input={{
              name: `PokeCalc-Preset:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}`,
              value: playerPokemon?.preset,
              onChange: (calcdexId: string) => {
                const preset = playerPokemon.presets.find((p) => p?.calcdexId === calcdexId);

                if (!preset?.name) {
                  return;
                }

                onPokemonChange?.({
                  calcdexId: playerPokemon?.calcdexId,
                  ident: playerPokemon?.ident,
                  // speciesForme: playerPokemon?.speciesForme,
                  ivs: preset.ivs || playerPokemon?.ivs,
                  evs: preset.evs || playerPokemon?.evs,
                  moves: preset.moves || playerPokemon?.moves,
                  altMoves: preset.altMoves || playerPokemon?.altMoves,
                  nature: preset.nature || playerPokemon?.nature,
                  dirtyAbility: preset.ability || playerPokemon?.ability,
                  altAbilities: preset.altAbilities || playerPokemon?.altAbilities,
                  // item: preset.item || playerPokemon?.item,
                  // dirtyItem: !!playerPokemon.item,
                  dirtyItem: preset.item || playerPokemon?.item,
                  altItems: preset.altItems || playerPokemon?.altItems,
                  preset: calcdexId,
                });
              },
            }}
            options={playerPokemon?.presets?.filter((p) => p?.calcdexId).map((p) => ({
              label: p?.name,
              value: p?.calcdexId,
            }))}
            noOptionsMessage="No Sets"
            clearable={false}
            disabled={pokemonInvalid || !playerPokemon?.presets?.length}
          />
        </div>
      </div>

      <div
        className={cx(styles.row, styles.section)}
        style={{ alignItems: 'flex-start' }}
      >
        <div style={{ flex: 1, marginRight: 5 }}>
          <div className={styles.statLabel}>
            Ability

            {
              !!playerPokemon?.dirtyAbility &&
              <>
                {' '}
                <Button
                  style={{ verticalAlign: 'middle', marginBottom: 1 }}
                  labelClassName={cx(styles.small)}
                  labelStyle={{ textTransform: 'uppercase' }}
                  label="Reset"
                  absoluteHover
                  onPress={() => onPokemonChange?.({
                    calcdexId: playerPokemon?.calcdexId,
                    ident: playerPokemon?.ident,
                    // speciesForme: playerPokemon?.speciesForme,
                    dirtyAbility: null,
                  })}
                />
              </>
            }
          </div>
          {/* <br /> */}
          {/* {pokemon?.ability || pokemon?.baseAbility || possibleAbilities.join(' / ') || '???'} */}
          <Dropdown
            aria-label="Ability"
            hint="???"
            input={{
              name: `PokeCalc-Ability:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}`,
              value: playerPokemon?.dirtyAbility ?? playerPokemon?.ability,
              onChange: (ability: AbilityName) => onPokemonChange?.({
                calcdexId: playerPokemon?.calcdexId,
                ident: playerPokemon?.ident,
                // speciesForme: playerPokemon?.speciesForme,
                // ability,
                dirtyAbility: ability,
              }),
            }}
            // options={playerPokemon?.abilities?.map((ability) => ({
            //   label: ability,
            //   value: ability,
            // }))}
            options={[!!playerPokemon?.altAbilities?.length && {
              label: 'Pool',
              options: playerPokemon.altAbilities.map((ability) => ({
                label: ability,
                value: ability,
              })),
            }, !!playerPokemon?.abilities?.length && {
              label: 'Other',
              options: playerPokemon.abilities
                .filter((a) => !!a && (!playerPokemon.altAbilities.length || !playerPokemon.altAbilities.includes(a)))
                .map((ability) => ({ label: ability, value: ability })),
            }].filter(Boolean)}
            noOptionsMessage="No Abilities"
            clearable={false}
            disabled={pokemonInvalid}
          />
        </div>

        <div style={{ flex: 1, margin: '0 5px' }}>
          <div className={styles.statLabel}>
            Nature
          </div>
          <Dropdown
            aria-label="Nature"
            hint="???"
            input={{
              name: `PokeCalc-Nature:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}`,
              value: playerPokemon?.nature,
              onChange: (nature: Showdown.PokemonNature) => onPokemonChange?.({
                calcdexId: playerPokemon?.calcdexId,
                ident: playerPokemon?.ident,
                // speciesForme: playerPokemon?.speciesForme,
                nature,
              }),
            }}
            options={PokemonNatures.map((nature) => ({
              label: [
                nature,
                PokemonNatureBoosts[nature]?.length && ' (',
                PokemonNatureBoosts[nature]?.[0] && `${PokemonNatureBoosts[nature][0].toUpperCase()}+ `,
                PokemonNatureBoosts[nature]?.[1] && `${PokemonNatureBoosts[nature][1].toUpperCase()}-`,
                PokemonNatureBoosts[nature]?.length && ')',
              ].filter(Boolean).join(''),
              value: nature,
            }))}
            noOptionsMessage="No Natures"
            clearable={false}
            // hideSelections
            disabled={pokemonInvalid}
          />
        </div>

        <div style={{ flex: 1, marginLeft: 5 }}>
          <div className={styles.statLabel}>
            Item

            {
              (!!playerPokemon?.dirtyItem || (playerPokemon?.dirtyItem === '' && !!playerPokemon?.item)) &&
              <>
                {' '}
                <Button
                  style={{ verticalAlign: 'middle', marginBottom: 1 }}
                  labelClassName={cx(styles.small)}
                  labelStyle={{ textTransform: 'uppercase' }}
                  label="Reset"
                  absoluteHover
                  onPress={() => onPokemonChange?.({
                    calcdexId: playerPokemon?.calcdexId,
                    ident: playerPokemon?.ident,
                    // speciesForme: playerPokemon?.speciesForme,
                    dirtyItem: null,
                  })}
                />
              </>
            }
          </div>
          {/* <br /> */}
          {/* {pokemon?.item || (pokemon?.prevItem ? 'None' : '???')} */}
          <Dropdown
            aria-label="Item"
            // hint={playerPokemon?.prevItem ? 'None' : '???'}
            hint="None"
            input={{
              name: `PokeCalc-Item:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}`,
              value: playerPokemon?.dirtyItem ?? playerPokemon?.item,
              onChange: (item: ItemName) => onPokemonChange?.({
                calcdexId: playerPokemon?.calcdexId,
                ident: playerPokemon?.ident,
                // speciesForme: playerPokemon?.speciesForme,
                // item,
                // dirtyItem: true,
                dirtyItem: item ?? ('' as ItemName),
              }),
            }}
            // options={Object.values(BattleItems).map((item) => ({
            //   label: item?.name,
            //   value: item?.name,
            // }))}
            options={[!!playerPokemon?.altItems?.length && {
              label: 'Pool',
              options: playerPokemon.altItems.map((item) => ({
                label: item,
                value: item,
              })),
            }, !!BattleItems && {
              label: 'All',
              options: Object.values(BattleItems)
                .filter((i) => i?.name && (!playerPokemon?.altItems?.length || !playerPokemon.altItems.includes(i.name as ItemName)))
                .map((item) => ({ label: item.name, value: item.name })),
            }].filter(Boolean)}
            noOptionsMessage="No Items"
            disabled={pokemonInvalid}
          />

          {
            !!playerPokemon?.itemEffect &&
            <div className={cx(styles.statLabel, styles.small)}>
              {playerPokemon.itemEffect}
            </div>
          }
          {
            !!playerPokemon?.prevItem &&
            <div className={styles.small}>
              <span className={styles.statLabel}>
                {playerPokemon.prevItemEffect || 'Prev'}
              </span>
              {playerPokemon.prevItemEffect?.length > 4 ? <br /> : ' '}
              {playerPokemon.prevItem}
            </div>
          }
        </div>

        {/* <div style={{ flex: 1.25 }}>
          <span className={styles.statLabel}>
            Opposing Screens
          </span>
          <br />
          &lt;- @TODO -&gt;
        </div> */}
      </div>

      {/* Move List */}
      <div className={cx(styles.tableGrid, styles.movesTable, styles.section)}>
        <div className={cx(styles.tableItem, styles.left, styles.statLabel)}>
          Moves
        </div>
        {/* <div className={cx(styles.tableItem, styles.statLabel)}>
          BP
        </div> */}
        <div className={cx(styles.tableItem, styles.statLabel)}>
          DMG
          {' '}
          <Button
            style={{ verticalAlign: 'middle', marginBottom: 2 }}
            labelStyle={{
              fontSize: 8,
              color: playerPokemon?.criticalHit ? undefined : '#FFFFFF',
              textTransform: 'uppercase',
            }}
            label="Crit"
            absoluteHover
            disabled={pokemonInvalid}
            onPress={() => onPokemonChange?.({
              calcdexId: playerPokemon?.calcdexId,
              ident: playerPokemon?.ident,
              // speciesForme: playerPokemon?.speciesForme,
              criticalHit: !playerPokemon?.criticalHit,
            })}
          />
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          KO
        </div>

        {/* (the actual) Move List */}
        {Array(4).fill(null).map((_, i) => {
          // const [moveid, ppUsed] = track || [];
          const moveid = playerPokemon?.moves?.[i];
          // const actualMoveId = pokemon?.moveTrack?.[i]?.[0];

          // const move = moveid ? Dex?.moves?.get?.(moveid) : null;
          const move = moveid ? dex?.moves?.get?.(moveid) : null;
          const transformed = !!moveid && moveid?.charAt(0) === '*'; // moves used by a transformed Ditto
          const moveName = transformed ? moveid.substring(1) : moveid;

          // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
          // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

          const calculatorMove = moveid && moveName && gen ? new SmogonMove(gen, moveName) : null;

          if (calculatorMove && playerPokemon?.criticalHit) {
            calculatorMove.isCrit = true;
          }

          const result = smogonPlayerPokemon?.nature && smogonOpponentPokemon?.nature && calculatorMove && gen ?
            calculate(gen, smogonPlayerPokemon, smogonOpponentPokemon, calculatorMove, smogonField) :
            null;

          l.debug(
            'calculate()', smogonPlayerPokemon?.name, 'vs', smogonOpponentPokemon?.name,
            '\n', 'moveName', moveName,
            '\n', 'move', calculatorMove,
            '\n', 'result', result,
          );

          const resultKoChance = result?.damage ? result.kochance() : null;
          const resultDesc = result?.damage ? result?.desc() : null;

          // l.debug(
          //   'calculator result for move', moveName,
          //   '\n', result,
          //   '\n', 'ko chance', result?.damage ? result?.kochance() : '(impossible cause no damage)',
          //   '\n', 'desc', result?.desc(),
          // );

          const showAccuracy = typeof move?.accuracy !== 'boolean' &&
            (move?.accuracy || -1) > 0 &&
            move.accuracy !== 100;

          // const showActualMove = !!actualMoveId && !pokemon?.moves?.includes?.(actualMoveId);

          // const showMoveStats = showAccuracy || !!move?.priority || showActualMove;
          // const showMoveStats = !!move?.type || !!move?.basePower || showAccuracy || !!move?.priority;
          const showMoveStats = !!move?.type;

          // l.debug(
          //   'moveid', moveid, 'moveName', moveName,
          //   '\n', 'actualMoveId:', actualMoveId, 'showActualMove?', showActualMove,
          // );

          return (
            <React.Fragment
              key={`PokeCalc:MoveTrack-${playerPokemon?.calcdexId || playerPokemon?.name || '???'}:${moveName || '???'}:${i}`}
            >
              <div className={cx(styles.tableItem, styles.left)}>
                <Dropdown
                  aria-label={`Move ${i + 1} for ${playerPokemon?.name || '???'}`}
                  hint="--"
                  input={{
                    name: `PokeCalc-Move:${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${i}`,
                    value: playerPokemon?.moves?.[i],
                    onChange: (newMove: MoveName) => {
                      // l.debug('newMove for', playerPokemon?.ident, 'at index', i, newMove);

                      const moves = playerPokemon?.moves || [] as MoveName[];

                      if (!Array.isArray(moves) || (moves?.[i] && moves[i] === newMove)) {
                        return;
                      }

                      moves[i] = newMove;

                      onPokemonChange?.({
                        calcdexId: playerPokemon?.calcdexId,
                        ident: playerPokemon?.ident,
                        // speciesForme: playerPokemon?.speciesForme,
                        moves,
                      });
                    },
                  }}
                  options={[!!playerPokemon?.moveState?.revealed.length && {
                    label: 'Revealed',
                    options: playerPokemon.moveState.revealed.map((name) => ({ label: name, value: name })),
                  }, !!playerPokemon?.altMoves?.length && {
                    label: 'Pool',
                    options: playerPokemon.altMoves
                      .filter((n) => !!n && (!playerPokemon.moveState?.revealed?.length || !playerPokemon.moveState.revealed.includes(n)))
                      .map((name) => ({ label: name, value: name })),
                  }, !!playerPokemon?.moveState?.learnset.length && {
                    label: 'Learnset',
                    options: playerPokemon.moveState.learnset.map((name) => ({ label: name, value: name })),
                  }, !!playerPokemon?.moveState?.other.length && {
                    label: 'All',
                    options: playerPokemon.moveState.other.map((name) => ({ label: name, value: name })),
                  }].filter(Boolean)}
                  noOptionsMessage="No Moves Found"
                  disabled={pokemonInvalid}
                />

                {/* {moveName || '???'} */}
                {/*
                  (!!moveid && activePokemon.lastMove === move?.id) &&
                  <span className={cx(styles.statLabel, styles.small)}>
                    {' '}Last
                  </span>
                */}
                {/* <br /> */}

                {
                  showMoveStats &&
                  <div style={{ padding: '0 5px' }}>
                    {
                      !!move?.type &&
                      <span className={styles.small}>
                        {/* <span className={styles.statLabel}>
                          TYPE{' '}
                        </span> */}
                        {/* [{typeAbbrevs[move?.type] || '???'}] */}
                        <PokeType type={move.type} />
                      </span>
                    }

                    <span className={styles.small}>
                      <span className={styles.statLabel}>
                        {' '}{move?.category?.slice(0, 4) || 'BP'}
                      </span>
                      {typeof move?.basePower === 'number' && move.basePower > 0 ? ` ${move.basePower}` : ''}
                    </span>

                    {/* <span className={styles.small}>
                      <span className={styles.statLabel}>
                        {' '}PP{' '}
                      </span>
                      {remainingPp}/{maxPp}
                    </span> */}

                    {/*
                      (!!moveid && !!move?.category) &&
                      <span className={styles.small}>
                        <span className={styles.statLabel}>
                          {' '}{move.category.slice(0, 4).toUpperCase()}{' '}
                        </span>
                        {move.basePower || null}
                      </span>
                    */}

                    {
                      showAccuracy &&
                      <span className={styles.small}>
                        <span className={styles.statLabel}>
                          {' '}ACC{' '}
                        </span>
                        {move.accuracy}%
                      </span>
                    }

                    {
                      !!move?.priority &&
                      <span className={styles.small}>
                        {' '}
                        <span className={styles.statLabel}>
                          PRI
                        </span>
                        {' '}
                        {move.priority > 0 ? `+${move.priority}` : move.priority}
                      </span>
                    }

                    {/*
                      showActualMove &&
                      <span className={styles.small}>
                        {' '}
                        <span className={styles.statLabel}>
                          Actual
                        </span>
                        {' '}
                        {/* <span style={{ opacity: 0.75 }}>
                          {actualMoveId}
                        </span> *\/}
                        <Field<string> name={`moves.${i}`}>
                          {({ input }) => (
                            <Button
                              labelClassName={styles.small}
                              labelStyle={{ opacity: 0.75 }}
                              label={actualMoveId}
                              absoluteHover
                              disabled={input.value === actualMoveId}
                              onPress={() => input.onChange(actualMoveId)}
                            />
                          )}
                        </Field>
                      </span>
                    */}
                  </div>
                }
              </div>

              {/* <div className={cx(styles.tableItem)}>
                {
                  (!!moveid && !!move?.category) &&
                  <>
                    {move.category !== 'Status' ? (
                      <>
                        {move.basePower || '--'}
                        <br />
                      </>
                    ) : null}
                    <span className={cx(styles.statLabel, styles.small)}>
                      {move.category.slice(0, 4).toUpperCase() || '???'}
                    </span>
                  </>
                }
              </div> */}

              <div
                className={cx(styles.tableItem)}
                style={!result?.damage ? { opacity: 0.5 } : null}
              >
                {/* XXX.X% &ndash; XXX.X% */}
                {result?.damage ? /\(([\d.]+\s-\s[\d.]+%)\)/.exec(resultDesc)?.[1] || '???' : '--'}
              </div>

              <div
                className={cx(styles.tableItem)}
                style={!result?.damage && !resultKoChance?.chance && !resultKoChance?.n ? { opacity: 0.3 } : null}
              >
                {/* XXX% XHKO */}
                {/* {result?.damage && resultKoChance?.chance && resultKoChance.chance !== 1 ? `${(resultKoChance.chance * 100).toFixed(1)}% ` : null} */}
                {
                  (!!result?.damage && !!resultKoChance?.chance && resultKoChance.chance !== 1) &&
                  <>
                    {(resultKoChance.chance * 100).toFixed(1)}%
                    {/* <br /> */}
                    {' '}
                  </>
                }
                {!!result?.damage && !!resultKoChance?.n && `${resultKoChance.n}HKO`}
                {!result?.damage && (!resultKoChance?.chance || resultKoChance.chance === 1) && !resultKoChance?.n && '--'}
              </div>
            </React.Fragment>
          );
        })}

        <div className={cx(styles.tableGrid, styles.statsTable, styles.section)}>
          <div className={cx(styles.tableItem, styles.statLabel)} />
          {PokemonStatNames.map((stat) => (
            <div
              key={`PokeCalc:StatLabel-${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${stat}`}
              className={cx(styles.tableItem, styles.statLabel)}
            >
              {stat}
              {!!playerPokemon?.nature && PokemonNatureBoosts[playerPokemon.nature][0] === stat && '+'}
              {!!playerPokemon?.nature && PokemonNatureBoosts[playerPokemon.nature][1] === stat && '-'}
            </div>
          ))}
          {/* <div className={cx(styles.tableItem, styles.statLabel)}>
            HP
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            ATK
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            DEF
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPA
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPD
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPE
          </div> */}

          <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
            IV
            <span className={styles.small}>
              S
            </span>
          </div>
          {PokemonStatNames.map((stat) => (
            <div
              key={`PokeCalc:Ivs-${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${stat}`}
              className={cx(styles.tableItem)}
            >
              <Button
                style={{ color: 'inherit' }}
                labelStyle={{ color: 'inherit' }}
                label={(playerPokemon?.ivs?.[stat] || 0).toFixed(0)}
                absoluteHover
                onPress={() => {
                  const currentValue = playerPokemon?.ivs?.[stat] || 0;
                  let nextValue = 0;

                  if (currentValue === 0) {
                    nextValue = 31;
                  }

                  if (currentValue === 31) {
                    nextValue = 1;
                  }

                  onPokemonChange?.({
                    calcdexId: playerPokemon?.calcdexId,
                    ident: playerPokemon?.ident,
                    // speciesForme: playerPokemon?.speciesForme,
                    ivs: {
                      ...playerPokemon?.ivs,
                      [stat]: nextValue,
                    },
                  });
                }}
              />
            </div>
          ))}

          <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
            EV
            <span className={styles.small}>
              S
            </span>
          </div>
          {PokemonStatNames.map((stat) => (
            <div
              key={`PokeCalc:Evs-${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${stat}`}
              className={cx(styles.tableItem)}
            >
              <Button
                label={(playerPokemon?.evs?.[stat] || 0).toFixed(0)}
                absoluteHover
                onPress={() => {
                  const currentValue = playerPokemon?.evs?.[stat] || 0;
                  let nextValue = 0;

                  if (currentValue === 0) {
                    nextValue = 252;
                  }

                  if (currentValue === 252) {
                    nextValue = 4;
                  }

                  onPokemonChange?.({
                    calcdexId: playerPokemon?.calcdexId,
                    ident: playerPokemon?.ident,
                    // speciesForme: playerPokemon?.speciesForme,
                    evs: {
                      ...playerPokemon?.evs,
                      [stat]: nextValue,
                    },
                  });
                }}
              />
            </div>
          ))}

          <div className={cx(styles.tableItem)} />
          {PokemonStatNames.map((stat) => (
            <div
              key={`PokeCalc:Boosts-${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${stat}`}
              className={cx(
                styles.tableItem,
                stat !== 'hp' && (playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) > 0 && styles.positive,
                stat !== 'hp' && (playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) < 0 && styles.negative,
              )}
            >
              {formatStatBoost(playerPokemon?.calculatedStats?.[stat]) || '???'}
            </div>
          ))}
          {/* <div className={cx(styles.tableItem)}>
            {formatStatBoost(playerPokemon?.calculatedStats?.hp) || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (playerPokemon?.boosts?.atk || 0) > 0 && styles.positive,
              (playerPokemon?.boosts?.atk || 0) < 0 && styles.negative,
            )}
          >
            {formatStatBoost(playerPokemon?.calculatedStats?.atk) || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (playerPokemon?.boosts?.def || 0) > 0 && styles.positive,
              (playerPokemon?.boosts?.def || 0) < 0 && styles.negative,
            )}
          >
            {formatStatBoost(playerPokemon?.calculatedStats?.def) || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (playerPokemon?.boosts?.spa || 0) > 0 && styles.positive,
              (playerPokemon?.boosts?.spa || 0) < 0 && styles.negative,
            )}
          >
            {formatStatBoost(playerPokemon?.calculatedStats?.spa) || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (playerPokemon?.boosts?.spd || 0) > 0 && styles.positive,
              (playerPokemon?.boosts?.spd || 0) < 0 && styles.negative,
            )}
          >
            {formatStatBoost(playerPokemon?.calculatedStats?.spd) || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (playerPokemon?.boosts?.spe || 0) > 0 && styles.positive,
              (playerPokemon?.boosts?.spe || 0) < 0 && styles.negative,
            )}
          >
            {formatStatBoost(playerPokemon?.calculatedStats?.spe) || '???'}
          </div> */}

          <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
            STAGE
          </div>
          <div className={cx(styles.tableItem)} />
          {/* <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.atk || 0) > 0 && '+'}
            {pokemon?.boosts?.atk || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.def || 0) > 0 && '+'}
            {pokemon?.boosts?.def || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spa || 0) > 0 && '+'}
            {pokemon?.boosts?.spa || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spd || 0) > 0 && '+'}
            {pokemon?.boosts?.spd || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spe || 0) > 0 && '+'}
            {pokemon?.boosts?.spe || 0}
          </div> */}
          {PokemonBoostNames.map((stat) => (
            <div
              key={`PokeCalc:StageBoost-${playerPokemon?.calcdexId || playerPokemon?.ident || '???'}:${stat}`}
              className={cx(styles.tableItem, styles.stageValue)}
            >
              <Button
                style={{ marginRight: 3 }}
                labelStyle={{ color: '#FFFFFF' }}
                label="-"
                disabled={(playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) <= -6}
                onPress={() => onPokemonChange?.({
                  calcdexId: playerPokemon?.calcdexId,
                  ident: playerPokemon?.ident,
                  // speciesForme: playerPokemon?.speciesForme,
                  // boosts: {
                  //   ...playerPokemon?.boosts,
                  //   [stat]: Math.max((playerPokemon?.boosts?.[stat] || 0) - 1, -6),
                  // },
                  dirtyBoosts: {
                    ...playerPokemon?.dirtyBoosts,
                    // [stat]: true,
                    [stat]: Math.max((playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) - 1, -6),
                  },
                })}
              />

              {/* {(pokemon?.boosts?.[stat] || 0) > 0 && '+'}
              {typeof pokemon?.boosts?.[stat] === 'number' ? pokemon.boosts[stat] : 'X'} */}

              <Button
                style={typeof playerPokemon?.dirtyBoosts?.[stat] !== 'number' ? { color: 'inherit' } : undefined}
                labelStyle={typeof playerPokemon?.dirtyBoosts?.[stat] !== 'number' ? { color: 'inherit' } : undefined}
                // label={getStatBoostLabel(pokemon, stat)}
                label={[
                  (playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) > 0 && '+',
                  (playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat])?.toString() || 'X',
                ].filter(Boolean).join('')}
                absoluteHover
                disabled={typeof playerPokemon?.dirtyBoosts?.[stat] !== 'number'}
                onPress={() => onPokemonChange?.({
                  calcdexId: playerPokemon?.calcdexId,
                  ident: playerPokemon?.ident,
                  // speciesForme: playerPokemon?.speciesForme,
                  // boosts: {
                  //   ...playerPokemon?.boosts,
                  //   [stat]: 0,
                  // },
                  dirtyBoosts: {
                    ...playerPokemon?.dirtyBoosts,
                    [stat]: undefined, // resets the boost, which a re-render will re-sync w/ the battle state
                  },
                })}
              />

              <Button
                style={{ marginLeft: 3 }}
                labelStyle={{ color: '#FFFFFF' }}
                label="+"
                disabled={(playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) >= 6}
                onPress={() => onPokemonChange?.({
                  calcdexId: playerPokemon?.calcdexId,
                  ident: playerPokemon?.ident,
                  // speciesForme: playerPokemon?.speciesForme,
                  // boosts: {
                  //   ...playerPokemon?.boosts,
                  //   [stat]: Math.min((playerPokemon?.boosts?.[stat] || 0) + 1, 6),
                  // },
                  dirtyBoosts: {
                    ...playerPokemon?.dirtyBoosts,
                    // [stat]: true,
                    [stat]: Math.min((playerPokemon?.dirtyBoosts?.[stat] ?? playerPokemon?.boosts?.[stat] ?? 0) + 1, 6),
                  },
                })}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
