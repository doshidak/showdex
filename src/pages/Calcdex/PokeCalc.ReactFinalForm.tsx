import * as React from 'react';
import { Field, Form, FormSpy } from 'react-final-form';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { calculate, Pokemon, Move } from '@smogon/calc';
import cx from 'classnames';
import { PokeStatus, PokeType } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { Button } from '@showdex/components/ui';
// import { NATURES } from '@showdex/consts';
import { getSetsForFormat } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
import type { AbilityName } from '@pkmn/dex';
import type { GenerationNum } from '@pkmn/data';
import type { State } from '@smogon/calc';
import type { CalcdexPokemon } from './Calcdex';
import styles from './PokeCalc.module.scss';

interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon: CalcdexPokemon;
  vsPokemon?: CalcdexPokemon;
  tooltips?: Showdown.BattleTooltips;
  format?: string;
  gen?: GenerationNum;
  onChangePokemon?: (pokemon: Partial<CalcdexPokemon>) => void;
}

const gens = new Generations(Dex);

export const PokeCalc = ({
  className,
  style,
  pokemon,
  vsPokemon,
  tooltips,
  format,
  gen,
  onChangePokemon,
}: PokeCalcProps): JSX.Element => {
  const dex = gens.get(gen || 8);

  const species = pokemon?.speciesForme ? Dex?.species?.get?.(pokemon.speciesForme) : null;

  const {
    abilities,
    baseStats,
  } = species || {};

  const types = pokemon?.ident ? tooltips?.getPokemonTypes?.(pokemon as Showdown.Pokemon) : null;
  const currentHp = ((pokemon?.hp || 0) / (pokemon?.maxhp || 1)) * 100;

  const possibleNatures = Array.from(dex?.natures || []).map((nature) => nature?.name).filter(Boolean);
  const possibleAbilities = Object.values(abilities || {}) as AbilityName[];
  const [possibleMoves, setPossibleMoves] = React.useState<string[]>([]);

  React.useEffect(() => void (async () => {
    if (!pokemon?.speciesForme || typeof dex?.learnsets?.learnable !== 'function') {
      return;
    }

    const learnset = await dex.learnsets.learnable(pokemon.speciesForme);

    const moveNames = Object.keys(learnset || {})
      .map((moveid) => dex.moves.get(moveid)?.name)
      .filter(Boolean)
      .sort();

    const allOtherMoves = Object.values(BattleMovedex || {} as typeof BattleMovedex)
      .map((move) => move?.name)
      .filter((name) => !!name && !moveNames.includes(name as typeof moveNames[0]))
      .sort() as typeof moveNames;

    const moves = allOtherMoves.length ? moveNames.concat(allOtherMoves) : moveNames;

    // setPossibleMoves(moveNames);
    setPossibleMoves(moves);
  })(), [
    dex,
    pokemon,
  ]);

  const parsedFormat = format?.replace?.('randombattle', '');
  // const parsedFormat = `gen${gen}`;
  const sets = pokemon?.speciesForme && parsedFormat ? getSetsForFormat(parsedFormat)?.[pokemon.speciesForme] || {} : {};
  const possibleSets = Object.keys(sets);

  const firstSetKey = possibleSets[0];
  const firstSet = sets[firstSetKey];

  const possibleNature = pokemon?.nature || firstSet?.nature;

  return (
    <Form<Partial<CalcdexPokemon>>
      initialValues={{
        // ident: pokemon?.ident,
        // searchid: pokemon?.searchid,
        // name: pokemon?.name,
        speciesForme: pokemon?.speciesForme, // keep this in order to change the actual pokemon
        // level: pokemon?.level || 0,
        // status: pokemon?.status,
        // statusData: pokemon?.statusData,
        ability: pokemon?.ability || pokemon?.baseAbility || firstSet?.ability,
        nature: possibleNature,
        item: pokemon?.item || firstSet?.item,
        // itemEffect: pokemon?.itemEffect,
        // prevItem: pokemon?.prevItem,
        // prevItemEffect: pokemon?.prevItemEffect,
        // moves: pokemon?.moves || firstSet?.moves,
        // moves: upsizeArray($.extend(true, [] as string[], pokemon?.moves, firstSet?.moves), 4, null, true),
        moves: [...(pokemon?.moves || []), ...(firstSet?.moves || [])].slice(0, 4),
        // moveTrack: pokemon?.moveTrack,
        // ivs: pokemon?.ivs || firstSet?.ivs,
        ivs: {
          hp: pokemon?.ivs?.hp || firstSet?.ivs?.hp || 31,
          atk: pokemon?.ivs?.atk || firstSet?.ivs?.atk || 31,
          def: pokemon?.ivs?.def || firstSet?.ivs?.def || 31,
          spa: pokemon?.ivs?.spa || firstSet?.ivs?.spa || 31,
          spd: pokemon?.ivs?.spd || firstSet?.ivs?.spd || 31,
          spe: pokemon?.ivs?.spe || firstSet?.ivs?.spe || 31,
        },
        // evs: pokemon?.evs || firstSet?.evs,
        evs: {
          hp: pokemon?.evs?.hp || firstSet?.evs?.hp || 0,
          atk: pokemon?.evs?.atk || firstSet?.evs?.atk || 0,
          def: pokemon?.evs?.def || firstSet?.evs?.def || 0,
          spa: pokemon?.evs?.spa || firstSet?.evs?.spa || 0,
          spd: pokemon?.evs?.spd || firstSet?.evs?.spd || 0,
          spe: pokemon?.evs?.spe || firstSet?.evs?.spe || 0,
        },
        boosts: {
          atk: pokemon?.boosts?.atk || 0,
          def: pokemon?.boosts?.def || 0,
          spa: pokemon?.boosts?.spa || 0,
          spd: pokemon?.boosts?.spd || 0,
          spe: pokemon?.boosts?.spe || 0,
        },
        // originalCurHp: currentHp,
        // toxicCounter: pokemon?.statusData?.toxicTurns,
        preset: firstSetKey,
      }}
      initialValuesEqual={(a, b) => JSON.stringify(a) === JSON.stringify(b)}
      // debug={console.log}
      onSubmit={() => {}}
    >
      {({
        values,
        handleSubmit,
      }) => {
        const pokemonInvalid = !values.speciesForme;

        const calculatorPokemon = !pokemonInvalid && gen ? new Pokemon(gen, values.speciesForme, {
          ...pokemon,
          ...values,
        } as State.Pokemon) : null;

        const calculatorVsPokemon = vsPokemon?.speciesForme && gen ? new Pokemon(gen, vsPokemon.speciesForme, vsPokemon as State.Pokemon) : null;

        const boostedStats: Partial<Record<Showdown.StatName, number>> = ([
          'hp',
          'atk',
          'def',
          'spa',
          'spd',
          'spe',
        ] as Showdown.StatName[]).reduce((prev, stat) => {
          prev[stat] = dex.stats.calc(
            stat,
            baseStats?.[stat] || 0,
            values.ivs?.[stat] || 31,
            values.evs?.[stat] || 0,
            pokemon?.level || 100,
            values.nature ? dex?.natures?.get?.(values.nature) : undefined,
          );

          // re-calculate any boosted stat
          if (stat in (values.boosts || {})) {
            const stage = (values.boosts?.[stat] as number) || 0;

            if (stage) {
              const clampedStage = Math.min(Math.max(stage, -6), 6); // -6 <= stage <= 6
              const multiplier = clampedStage < 0 ? (2 / (2 + Math.abs(clampedStage))) : ((1 + clampedStage) / 2);

              prev[stat] *= multiplier;
            }
          }

          return prev;
        }, {});

        return (
          <form
            className={cx(className)}
            style={style}
            onSubmit={handleSubmit}
          >
            <FormSpy<CalcdexPokemon>
              subscription={{ values: true }}
              onChange={(formProps) => {
                if (pokemon?.ident) {
                  onChangePokemon?.({
                    ident: pokemon.ident,
                    ...formProps.values,
                  });
                }
              }}
            />

            <div className={styles.row}>
              <div>
                {pokemon?.name || '???'}

                <span className={styles.small}>
                  <span style={{ opacity: 0.5 }}>
                    {pokemon?.level ? ` Lv.${pokemon.level}` : null}
                  </span>

                  {
                    !!types?.length &&
                    <>
                      {' '}
                      {types.map((type, i) => (
                        <PokeType
                          key={`PokeCalc-PokeType:${pokemon?.ident || '???'}:${type}`}
                          style={types.length > 1 && i === 0 ? { marginRight: 2 } : null}
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
                    style={{ width: `${currentHp.toFixed(2)}%` }}
                  />
                </span>

                {
                  !!currentHp &&
                  <>
                    {' '}
                    {`${currentHp.toFixed(0)}%`}
                  </>
                }

                {
                  (!!values.status || !values.originalCurHp) &&
                  <>
                    {' '}
                    <PokeStatus
                      // status={values.status}
                      // fainted={!values.originalCurHp}
                      status={pokemon?.status}
                      fainted={pokemon?.fainted || !currentHp}
                    />
                  </>
                }
              </div>

              <div>
                <div className={styles.statLabel}>
                  Set

                  {
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
                  }
                </div>
                <Field
                  name="preset"
                  component={Dropdown}
                  aria-label="Pokemon Set"
                  hint="Sets..."
                  options={possibleSets.map((set) => ({ label: set, value: set }))}
                  noOptionsMessage="No Sets Found"
                  disabled={pokemonInvalid}
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
                </div>
                {/* <br /> */}
                {/* {pokemon?.ability || pokemon?.baseAbility || possibleAbilities.join(' / ') || '???'} */}
                <Field
                  name="ability"
                  component={Dropdown}
                  aria-label="Ability"
                  hint="???"
                  options={possibleAbilities.map((ability) => ({ label: ability, value: ability }))}
                  noOptionsMessage="No Abilities Found"
                  disabled={pokemonInvalid}
                />
              </div>

              <div style={{ flex: 1, margin: '0 5px' }}>
                <div className={styles.statLabel}>
                  Nature
                </div>
                <Field
                  name="nature"
                  component={Dropdown}
                  aria-label="Nature"
                  hint="???"
                  options={possibleNatures.map((nature) => ({ label: nature, value: nature }))}
                  noOptionsMessage="No Natures Found"
                  disabled={pokemonInvalid}
                />
              </div>

              <div style={{ flex: 1, marginLeft: 5 }}>
                <div className={styles.statLabel}>
                  Item
                </div>
                {/* <br /> */}
                {/* {pokemon?.item || (pokemon?.prevItem ? 'None' : '???')} */}
                <Field
                  name="item"
                  component={Dropdown}
                  aria-label="Item"
                  hint={values.prevItem ? 'None' : '???'}
                  options={Object.values(BattleItems).map((item) => ({ label: item?.name, value: item?.name }))}
                  noOptionsMessage="No Items Found"
                  disabled={pokemonInvalid}
                />

                {
                  !!pokemon?.itemEffect &&
                  <div className={cx(styles.statLabel, styles.small)}>
                    {pokemon.itemEffect}
                  </div>
                }
                {
                  !!pokemon?.prevItem &&
                  <div className={styles.small}>
                    <span className={styles.statLabel}>
                      Prev{' '}
                    </span>
                    {pokemon.prevItem}
                    {
                      !!pokemon.prevItemEffect &&
                      <>
                        <br />
                        <span className={styles.statLabel}>
                          {pokemon.prevItemEffect}
                        </span>
                      </>
                    }
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
                  labelStyle={{ fontSize: 8 }}
                  label="CRIT"
                  disabled={pokemonInvalid}
                  onPress={() => {}}
                />
              </div>
              <div className={cx(styles.tableItem, styles.statLabel)}>
                KO
              </div>

              {/* (the actual) Move List */}
              {Array(4).fill(null).map((_, i) => {
                // const [moveid, ppUsed] = track || [];
                const moveid = values.moves?.[i];
                // const actualMoveId = pokemon?.moveTrack?.[i]?.[0];

                // const move = moveid ? Dex?.moves?.get?.(moveid) : null;
                const move = moveid ? dex?.moves?.get?.(moveid) : null;
                const transformed = !!moveid && moveid?.charAt(0) === '*'; // moves used by a transformed Ditto
                const moveName = transformed ? moveid.substring(1) : moveid;

                // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
                // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

                const calculatorMove = moveid && moveName && gen ? new Move(gen, moveName) : null;
                const result = calculatorPokemon && calculatorVsPokemon && calculatorMove && gen ?
                  calculate(gen, calculatorPokemon, calculatorVsPokemon, calculatorMove) :
                  null;

                const resultKoChance = result?.damage ? result.kochance() : null;
                const resultDesc = result?.damage ? result?.desc() : null;

                // console.log(
                //   'calculator result for move', moveName,
                //   '\n', result,
                //   '\n', 'ko chance', result?.damage ? result?.kochance() : '(impossible cause no damage)',
                //   '\n', 'desc', result?.desc(),
                // );

                const showAccuracy = typeof move?.accuracy !== 'boolean' &&
                  (move?.accuracy || -1) > 0 &&
                  move.accuracy !== 100;

                // const showActualMove = !!actualMoveId && !values.moves?.includes?.(actualMoveId);

                // const showMoveStats = showAccuracy || !!move?.priority || showActualMove;
                const showMoveStats = showAccuracy || !!move?.priority;

                // console.log(
                //   'moveid', moveid, 'moveName', moveName,
                //   '\n', 'actualMoveId:', actualMoveId, 'showActualMove?', showActualMove,
                // );

                return (
                  <React.Fragment key={`PokeCalc:MoveTrack-${values.name || '???'}:${moveName || i}`}>
                    <div className={cx(styles.tableItem, styles.left)}>
                      <Field
                        name={`moves.${i}`}
                        component={Dropdown}
                        aria-label={`Move ${i + 1} for ${values.name || '???'}`}
                        hint="???"
                        options={possibleMoves?.map?.((m) => ({ label: m, value: m })) || []}
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
                          {/* <span className={styles.small}>
                            {/* <span className={styles.statLabel}>
                              TYPE{' '}
                            </span> *\/}
                            [{typeAbbrevs[move?.type] || '???'}]
                          </span> */}

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
                          <br />
                        </>
                      }
                      {!!result?.damage && !!resultKoChance?.n && `${resultKoChance.n}HKO`}
                      {(!result?.damage && !resultKoChance?.chance && !resultKoChance?.n) && '--'}
                    </div>
                  </React.Fragment>
                );
              })}

              <div className={cx(styles.tableGrid, styles.statsTable, styles.section)}>
                <div className={cx(styles.tableItem, styles.statLabel)} />
                <div className={cx(styles.tableItem, styles.statLabel)}>
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
                </div>

                <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
                  EVs
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.hp || 0}
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.atk || 0}
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.def || 0}
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.spa || 0}
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.spd || 0}
                </div>
                <div className={cx(styles.tableItem)}>
                  {values.evs?.spe || 0}
                </div>

                <div className={cx(styles.tableItem)} />
                <div className={cx(styles.tableItem)}>
                  {boostedStats?.hp || '???'}
                </div>
                <div
                  className={cx(
                    styles.tableItem,
                    (values.boosts?.atk || 0) > 0 && styles.positive,
                    (values.boosts?.atk || 0) < 0 && styles.negative,
                  )}
                >
                  {boostedStats.atk || '???'}
                </div>
                <div
                  className={cx(
                    styles.tableItem,
                    (values.boosts?.def || 0) > 0 && styles.positive,
                    (values.boosts?.def || 0) < 0 && styles.negative,
                  )}
                >
                  {boostedStats.def || '???'}
                </div>
                <div
                  className={cx(
                    styles.tableItem,
                    (values.boosts?.spa || 0) > 0 && styles.positive,
                    (values.boosts?.spa || 0) < 0 && styles.negative,
                  )}
                >
                  {boostedStats.spa || '???'}
                </div>
                <div
                  className={cx(
                    styles.tableItem,
                    (values.boosts?.spd || 0) > 0 && styles.positive,
                    (values.boosts?.spd || 0) < 0 && styles.negative,
                  )}
                >
                  {boostedStats.spd || '???'}
                </div>
                <div
                  className={cx(
                    styles.tableItem,
                    (values.boosts?.spe || 0) > 0 && styles.positive,
                    (values.boosts?.spe || 0) < 0 && styles.negative,
                  )}
                >
                  {boostedStats.spe || '???'}
                </div>

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
                {(['atk', 'def', 'spa', 'spd', 'spe'] as Showdown.StatNameNoHp[]).map((stat) => (
                  <Field<number>
                    key={`PokeCalc:StageBoost-${pokemon?.ident || '???'}:${stat}`}
                    name={`boosts.${stat}`}
                  >
                    {({ input }) => (
                      <div className={cx(styles.tableItem, styles.stageValue)}>
                        <Button
                          style={{ marginRight: 3 }}
                          label="-"
                          disabled={input.value <= -6}
                          // onPress={() => onChangePokemon?.({
                          //   ident: pokemon?.ident,
                          //   boosts: {
                          //     ...pokemon?.boosts,
                          //     [stat]: Math.max((parseInt(pokemon?.boosts?.[stat] as string, 10) || 0) - 1, -6),
                          //   },
                          // })}
                          // onPress={() => {
                          //   if (!('boosts' in pokemon)) {
                          //     pokemon.boosts = { [stat]: 0 };
                          //   }
                          //
                          //   pokemon.boosts[stat] = Math.max(pokemon.boosts[stat] - 1, -6);
                          //
                          //   onChangePokemon?.(pokemon);
                          // }}
                          onPress={() => input.onChange(Math.max(input.value - 1, -6))}
                        />

                        {input.value > 0 && '+'}
                        {typeof input.value === 'number' ? input.value : 'X'}

                        <Button
                          style={{ marginLeft: 3 }}
                          label="+"
                          disabled={input.value >= 6}
                          // onPress={() => onChangePokemon?.({
                          //   ident: pokemon?.ident,
                          //   boosts: {
                          //     ...pokemon?.boosts,
                          //     [stat]: Math.min((parseInt(pokemon?.boosts?.[stat] as string, 10) || 0) + 1, 6),
                          //   },
                          // })}
                          // onPress={() => {
                          //   if (!('boosts' in pokemon)) {
                          //     pokemon.boosts = { [stat]: 0 };
                          //   }
                          //
                          //   pokemon.boosts[stat] = Math.min(pokemon.boosts[stat] + 1, 6);
                          //
                          //   onChangePokemon?.(pokemon);
                          // }}
                          onPress={() => input.onChange(Math.min(input.value + 1, 6))}
                        />
                      </div>
                    )}
                  </Field>
                ))}
              </div>

            </div>
          </form>
        );
      }}
    </Form>
  );
};
