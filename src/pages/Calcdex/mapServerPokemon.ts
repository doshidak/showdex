import type { CalcdexPokemon } from './CalcdexReducer';

export const mapServerPokemon = (serverPokemon: Showdown.ServerPokemon[]) => ((pokemon: CalcdexPokemon): CalcdexPokemon => {
  if (!serverPokemon?.length) {
    return pokemon;
  }

  const foundServerPokemon = serverPokemon.find((p) => p?.ident === pokemon?.ident);

  if (!foundServerPokemon?.ident) {
    return pokemon;
  }

  let didChange = false;

  (<(keyof Showdown.ServerPokemon)[]> [
    'ability',
    'item',
  ]).forEach((key) => {
    const value = (<Record<keyof Showdown.ServerPokemon, unknown>> foundServerPokemon)[key];

    if (!value && !['string', 'number', 'boolean'].includes(typeof value)) {
      return;
    }

    (<Record<keyof Showdown.ServerPokemon, unknown>> pokemon)[key] = value;

    if (!didChange) {
      didChange = true;
    }
  });

  if (didChange) {
    pokemon.preset = '';
    pokemon.autoPreset = false;
  }

  return pokemon;
});
