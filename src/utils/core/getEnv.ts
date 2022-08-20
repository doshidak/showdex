import type { EnvDict } from './createEnvParser';
import { createEnvParser } from './createEnvParser';

const processEnv: EnvDict = {
  NODE_ENV: process.env.NODE_ENV,

  PACKAGE_NAME: process.env.PACKAGE_NAME,
  PACKAGE_VERSION: process.env.PACKAGE_VERSION,
  PACKAGE_URL: process.env.PACKAGE_URL,
  PACKAGE_BUILD_DATE: process.env.PACKAGE_BUILD_DATE,

  CALCDEX_DEFAULT_GEN: process.env.CALCDEX_DEFAULT_GEN,
  CALCDEX_PLAYER_MAX_POKEMON: process.env.CALCDEX_PLAYER_MAX_POKEMON,
  CALCDEX_POKEMON_MAX_LEGAL_EVS: process.env.CALCDEX_POKEMON_MAX_LEGAL_EVS,
  PKMN_PRESETS_BASE_URL: process.env.PKMN_PRESETS_BASE_URL,
  PKMN_PRESETS_GENS_PATH: process.env.PKMN_PRESETS_GENS_PATH,
  PKMN_PRESETS_RANDOMS_PATH: process.env.PKMN_PRESETS_RANDOMS_PATH,
  SHOWDOWN_USERS_URL: process.env.SHOWDOWN_USERS_URL,
  SMOGON_UNIVERSITY_DEX_URL: process.env.SMOGON_UNIVERSITY_DEX_URL,
  UUID_NAMESPACE: process.env.UUID_NAMESPACE,
};

export const env = createEnvParser(processEnv, 'DEBUG');
