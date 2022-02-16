import * as React from 'react';
import cx from 'classnames';
// import { upsizeArray } from '@showdex/utils/core';
import { logger, printBuildInfo } from '@showdex/utils/debug';
// import type { GenerationNum } from '@pkmn/data';
// import type { Smogon } from '@pkmn/smogon';
// import type { State } from '@smogon/calc';
// import { detectPokemonIdent } from './detectPokemonIdent';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
// import { mapServerPokemon } from './mapServerPokemon';
// import { sanitizeField } from './sanitizeField';
// import { sanitizePokemon } from './sanitizePokemon';
// import { syncField } from './syncField';
// import { syncPokemon, syncPokemonBoosts, syncPokemonStats } from './syncPokemon';
import { useCalcdex } from './useCalcdex';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
  tooltips?: Showdown.BattleTooltips;
  // smogon?: Smogon;
  // nonce?: string;
}

const l = logger('Calcdex');

export const Calcdex = ({
  battle,
  tooltips,
  // smogon,
  // nonce,
}: CalcdexProps): JSX.Element => {
  const {
    dex,
    state,
    updatePokemon,
    updateField,
    // setActiveIndex,
    setSelectionIndex,
  } = useCalcdex({
    battle,
    tooltips,
    // smogon,
  });

  l.debug(
    'rendering...',
    '\n', 'p1.pokemon', battle?.p1?.pokemon,
    '\n', 'p2.pokemon', battle?.p2?.pokemon,
    '\n', 'state', state,
  );

  const {
    gen,
    // format,
    field,
    p1,
    p2,
  } = state;

  // const [prevNonce, setPrevNonce] = React.useState<string>(nonce);
  //
  // React.useEffect(() => {
  //   if (nonce !== prevNonce) {
  //     setPrevNonce(nonce);
  //   }
  // }, [
  //   prevNonce,
  //   nonce,
  // ]);

  // const {
  //   battle,
  //   tooltips,
  // } = (app.curRoom as BattleRoom) || {};

  // const {
  //   id,
  //   gen,
  //   // gameType,
  //   // p1,
  //   // p2,
  // } = battle || {};

  // const [battleId, setBattleId] = React.useState<string>(id);
  // const [p1Pokemon, setP1Pokemon] = React.useState<CalcdexPokemon[]>($.extend(true, [], p1?.pokemon));
  // const [p1Pokemon, setP1Pokemon] = React.useState<CalcdexPokemon[]>(battle?.p1?.pokemon?.map(sanitizePokemon).map(mapServerPokemon(battle?.myPokemon)) || [] as CalcdexPokemon[]);
  // const [p1Pokemon, setP1Pokemon] = React.useState<CalcdexPokemon[]>([] as CalcdexPokemon[]);
  // const [p1SelectedIndex, setP1SelectedIndex] = React.useState<number>(0);
  // const [p2Pokemon, setP2Pokemon] = React.useState<CalcdexPokemon[]>($.extend(true, [], p2?.pokemon));
  // const [p2Pokemon, setP2Pokemon] = React.useState<CalcdexPokemon[]>(battle?.p2?.pokemon?.map(sanitizePokemon) || [] as CalcdexPokemon[]);
  // const [p2Pokemon, setP2Pokemon] = React.useState<CalcdexPokemon[]>([] as CalcdexPokemon[]);
  // const [p2SelectedIndex, setP2SelectedIndex] = React.useState<number>(0);

  // these are only here for debugging purposes
  // React.useEffect(() => l.debug('p1Pokemon', p1Pokemon), [p1Pokemon]);
  // React.useEffect(() => l.debug('p2Pokemon', p2Pokemon), [p2Pokemon]);

  // const handlePokemonChange = (pokemon: Partial<CalcdexPokemon>) => {
  //   l.debug(
  //     'handlePokemonChange:', pokemon,
  //     '\n', 'p1.pokemon', battle?.p1?.pokemon,
  //     '\n', 'p2.pokemon', battle?.p2?.pokemon,
  //   );
  //
  //   const ident = detectPokemonIdent(pokemon);
  //
  //   if (!ident) {
  //     l.warn('ignoring change request due to falsy pokemon ident', pokemon);
  //
  //     return;
  //   }
  //
  //   // const isP2 = pokemon.searchid.startsWith('p2:');
  //   // const isP2 = ident.startsWith('p2:');
  //   // const pokemonSource = $.extend(true, [] as CalcdexPokemon[], (isP2 ? p2Pokemon : p1Pokemon) || [] as CalcdexPokemon[]);
  //   // const setPokemon = isP1 ? setP1Pokemon : setP2Pokemon;
  //
  //   let isP2 = ident.startsWith('p2:');
  //   // let index = p1Pokemon?.findIndex?.((p) => p?.ident === ident || p?.ident?.includes?.(pokemon?.speciesForme) || p?.name === pokemon?.name);
  //   let index = p1Pokemon?.findIndex?.((p) => p?.ident === ident);
  //
  //   if (typeof index !== 'number' || index < 0) {
  //     l.debug(
  //       'gunna have to do a bit more digging to find this pokemon with ident', ident,
  //       '\n', 'couldn\'t find the mon in p1, maybe p2?',
  //     );
  //
  //     // index = p2Pokemon?.findIndex?.((p) => p?.ident === ident || p?.ident?.includes?.(pokemon?.speciesForme) || p?.name === pokemon?.name);
  //     index = p2Pokemon?.findIndex?.((p) => p?.ident === ident);
  //
  //     if (typeof index !== 'number' || index < 0) {
  //       l.warn('yeah, this mon straight up doesn\'t exist anywhere lmao', pokemon);
  //
  //       return;
  //     }
  //
  //     isP2 = true;
  //   }
  //
  //   // const pokemonSource = $.extend(
  //   //   true,
  //   //   [] as CalcdexPokemon[],
  //   //   (isP2 ? p2Pokemon : p1Pokemon) || [] as CalcdexPokemon[],
  //   // );
  //
  //   // const pokemonSource = isP2 ? p2Pokemon : p1Pokemon;
  //
  //   // l.debug('indexing pokemon from side', isP2 ? 'p2' : 'p1', pokemon);
  //
  //   // const index = pokemonSource.findIndex((p) => p?.searchid === pokemon?.searchid);
  //   // const index = pokemonSource.findIndex((p) => p?.ident?.includes?.(ident || pokemon?.speciesForme) || p?.name === pokemon?.name);
  //
  //   l.debug('pokemon with ident', ident || pokemon.ident || pokemon.speciesForme || pokemon.name, 'supposedly at index', index, 'for', isP2 ? 'p2' : 'p1');
  //
  //   if (index < 0) {
  //     l.warn('ignoring change request due to unknown pokemon index', index, pokemon);
  //
  //     return;
  //   }
  //
  //   // const isP2 = pokemonSource[index]?.side?.sideid === 'p2' || ident.startsWith('p2:');
  //
  //   // setPokemon((prevPokemon) => {
  //   //   // Object.entries(pokemon).filter((e) => e?.[0] !== 'ident').forEach(([key, value]) => {
  //   //   //   prevPokemon[index][key] = value;
  //   //   // });
  //   //
  //   //   // prevPokemon[index] = {
  //   //   //   ...prevPokemon[index],
  //   //   //   ...pokemon,
  //   //   // };
  //   //
  //   //   prevPokemon[index] = $.extend(true, {}, prevPokemon[index], pokemon);
  //   //
  //   //   l.debug('updating pokemon with ident', pokemon.ident, 'to', prevPokemon[index]);
  //   //
  //   //   return prevPokemon;
  //   // });
  //
  //   // const newPokemon = $.extend(false, [] as CalcdexPokemon[], isP1 ? p1Pokemon : p2Pokemon);
  //
  //   // pokemonSource[index] = $.extend(false, {} as Partial<CalcdexPokemon>, pokemonSource[index], pokemon);
  //   // const [statsPokemon] = syncPokemonStats(pokemonSource[index], pokemon);
  //   // const [boostedPokemon] = syncPokemonBoosts(pokemonSource[index], pokemon);
  //
  //   // pokemonSource[index] = {
  //   //   ...statsPokemon,
  //   //   ident: pokemonSource[index].ident, // just in case :)
  //   //   moves: pokemon.moves,
  //   //   // ivs: {
  //   //   //   ...pokemonSource[index].ivs,
  //   //   //   ...pokemon?.ivs,
  //   //   // },
  //   //   // evs: {
  //   //   //   ...pokemonSource[index].evs,
  //   //   //   ...pokemon?.evs,
  //   //   // },
  //   //   ivs: pokemon.ivs,
  //   //   evs: pokemon.evs,
  //   //   boosts: boostedPokemon.boosts,
  //   //   // dirtyBoosts: pokemon?.dirtyBoosts || statsPokemon?.dirtyBoosts,
  //   //   // critical: typeof pokemon?.critical === 'boolean' ? pokemon.critical : (statsPokemon?.critical || false),
  //   //   // preset: pokemon?.preset || statsPokemon?.preset,
  //   // };
  //
  //   // if (isP1) {
  //   //   setP1Pokemon(pokemonSource);
  //   // } else {
  //   //   setP2Pokemon(pokemonSource);
  //   // }
  //
  //   // const startIndex = isP2 ? 6 : 0;
  //   // const endIndex = startIndex + 6;
  //
  //   // const newPokemon = $.extend(
  //   //   true,
  //   //   [] as CalcdexPokemon[],
  //   //   pokemonSource.slice(startIndex, endIndex),
  //   // );
  //
  //   // (isP2 ? setP2Pokemon : setP1Pokemon)(pokemonSource);
  //   // (isP2 ? setP2Pokemon : setP1Pokemon)(newPokemon);
  //
  //   (isP2 ? setP2Pokemon : setP1Pokemon)((prevPokemon) => {
  //     if (!Array.isArray(prevPokemon)) {
  //       return prevPokemon;
  //     }
  //
  //     const newPokemon = [...prevPokemon];
  //
  //     const [stats] = syncPokemonStats(newPokemon[index], pokemon);
  //     const [boosted] = syncPokemonBoosts(newPokemon[index], pokemon);
  //
  //     newPokemon[index] = {
  //       ...newPokemon[index],
  //       ...stats,
  //       ident: newPokemon[index].ident, // just in case :)
  //       moves: pokemon.moves,
  //       ivs: pokemon.ivs,
  //       evs: pokemon.evs,
  //       boosts: boosted.boosts,
  //     };
  //
  //     l.debug('updating pokemon for sideid', isP2 ? 'p2' : 'p1', 'at index', index, 'to', newPokemon[index]);
  //
  //     // return [...prevPokemon];
  //     return newPokemon;
  //   });
  //
  //   // if (isP2) {
  //   //   setP2Pokemon(pokemonSource);
  //   //
  //   //   return;
  //   // }
  //   //
  //   // setP1Pokemon(pokemonSource);
  // };

  // const [battleField, setBattleField] = React.useState<State.Field>(sanitizeField(battle, p1SelectedIndex, p2SelectedIndex));

  // const handleFieldChange = (field: Partial<State.Field>) => {
  //   l.debug('handleFieldChange:', field);
  //
  //   const newField = $.extend(true, {} as Partial<State.Field>, battleField, field);
  //
  //   if (!newField?.gameType) {
  //     l.warn('extended newField is not a valid field', newField);
  //
  //     return;
  //   }
  //
  //   l.debug('updating battle field to', newField);
  //
  //   setBattleField(newField);
  // };

  // handles changes in pokemon from the `battle` object
  // const [prevNonce, setPrevNonce] = React.useState<string>(null);

  // React.useEffect(() => {
  // l.debug(
  //   'received battle object update; determining sync changes...',
  //   '\n', 'p1.pokemon', battle?.p1?.pokemon,
  //   '\n', 'p2.pokemon', battle?.p2?.pokemon,
  // );
  //
  // if (battle?.nonce === prevNonce) {
  //   l.debug('ignoring cause nonce hasn\'t changed yet');
  //
  //   return;
  // }
  //
  // setPrevNonce(battle?.nonce);
  //
  // // if (p1?.pokemon?.length && p1.pokemon.length > p1Pokemon.length) {
  // //   setP1Pokemon($.extend(true, [], p1.pokemon));
  // // }
  //
  // // const newP1Pokemon = syncPokemon(battle?.p1, p1Pokemon, true);
  // // const newP1Pokemon = syncPokemon(battle?.p1, 'p1', p1Pokemon);
  //
  // // if (newP1Pokemon?.length) {
  // //   l.debug('setting p1Pokemon state to', newP1Pokemon);
  // //
  // //   setP1Pokemon(newP1Pokemon);
  // // }
  //
  // setP1Pokemon((prevPokemon) => {
  //   const newPokemon = syncPokemon(battle?.p1, prevPokemon, true);
  //
  //   if (Array.isArray(newPokemon) && JSON.stringify(newPokemon?.map?.((p) => p?.ident)) !== JSON.stringify(prevPokemon?.map?.((p) => p?.ident))) {
  //     l.debug('setting p1Pokemon state to', newPokemon);
  //
  //     return newPokemon;
  //   }
  //
  //   return prevPokemon;
  // });
  //
  // // if (p2?.pokemon?.length && p2.pokemon.length > p2Pokemon.length) {
  // //   setP2Pokemon($.extend(true, [], p2.pokemon));
  // // }
  //
  // // const newP2Pokemon = syncPokemon(battle?.p2, p2Pokemon, true);
  // // const newP2Pokemon = syncPokemon(battle?.p2, 'p2', p2Pokemon);
  //
  // // if (newP2Pokemon?.length) {
  // //   l.debug('setting p2Pokemon state to', newP2Pokemon);
  // //
  // //   setP2Pokemon(newP2Pokemon);
  // // }
  //
  // setP2Pokemon((prevPokemon) => {
  //   const newPokemon = syncPokemon(battle?.p2, prevPokemon, true);
  //
  //   if (Array.isArray(newPokemon) && JSON.stringify(newPokemon) !== JSON.stringify(prevPokemon)) {
  //     l.debug('setting p2Pokemon state to', newPokemon);
  //
  //     return newPokemon;
  //   }
  //
  //   return prevPokemon;
  // });
  //
  // const newField = syncField(battleField, battle, p1SelectedIndex, p2SelectedIndex);
  //
  // if (newField?.gameType) {
  //   l.debug('setting battleField state to', newField);
  //
  //   setBattleField(newField);
  // }
  // }, [
  // battle,
  // // battle?.p1?.active,
  // // battle?.p2?.active,
  // // battle?.p1?.pokemon?.length,
  // // battle?.p2?.pokemon?.length,
  // prevNonce,
  // // p1,
  // p1Pokemon,
  // p1SelectedIndex,
  // // p2,
  // p2Pokemon,
  // p2SelectedIndex,
  // battleField,
  // ]);

  // handles battle room changes
  // React.useEffect(() => {
  //   if (id && battleId !== id) {
  //     l.debug('detected new battle id', id, 'from previously stored battle id', battleId);
  //
  //     setBattleId(id);
  //
  //     // setP1Pokemon($.extend(true, [] as CalcdexPokemon[], p1?.pokemon || [] as CalcdexPokemon[]));
  //     // setP2Pokemon($.extend(true, [] as CalcdexPokemon[], p2?.pokemon || [] as CalcdexPokemon[]));
  //     setP1Pokemon(battle?.p1?.pokemon?.map(sanitizePokemon).map(mapServerPokemon(battle?.myPokemon)) || [] as CalcdexPokemon[]);
  //     setP1SelectedIndex(0);
  //     setP2Pokemon(battle?.p2?.pokemon?.map(sanitizePokemon) || [] as CalcdexPokemon[]);
  //     setP2SelectedIndex(0);
  //     setBattleField(sanitizeField(battle, 0, 0));
  //   }
  // }, [
  //   battle,
  //   battle?.id,
  //   id,
  //   battleId,
  // ]);

  return (
    <div className={cx('showdex-module', styles.container)}>
      <div className={styles.content}>
        <div className={styles.buildInfo}>
          {printBuildInfo()}
        </div>

        <PlayerCalc
          // player={battle?.p1}
          player={p1}
          opponent={p2}
          // pokemon={p1Pokemon}
          // opponentPokemon={p2Pokemon}
          // selectedIndex={p1SelectedIndex}
          // opponentIndex={p2SelectedIndex}
          // sideKey="attackerSide"
          // field={battleField}
          // tooltips={tooltips}
          // smogon={smogon}
          field={field}
          // format={format}
          gen={gen}
          dex={dex}
          defaultName="Player 1"
          // onPokemonChange={handlePokemonChange}
          // onIndexSelect={setP1SelectedIndex}
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex('p1', index)}
        />

        <FieldCalc
          style={{ marginTop: 30 }}
          // battle={battle}
          // field={battleField}
          field={field}
          // onFieldChange={handleFieldChange}
          onFieldChange={updateField}
        />

        <PlayerCalc
          style={{ marginTop: 30 }}
          // player={battle?.p2}
          player={p2}
          opponent={p1}
          // pokemon={p2Pokemon}
          // opponentPokemon={p1Pokemon}
          // selectedIndex={p2SelectedIndex}
          // opponentIndex={p1SelectedIndex}
          // sideKey="defenderSide"
          // field={battleField}
          // tooltips={tooltips}
          // smogon={smogon}
          field={field}
          // format={format}
          gen={gen}
          dex={dex}
          defaultName="Player 2"
          // onPokemonChange={handlePokemonChange}
          // onIndexSelect={setP2SelectedIndex}
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex('p2', index)}
        />
      </div>
    </div>
  );
};
