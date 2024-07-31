import { type ShowdexAssetBundle, type ShowdexPresetsBundle } from '@showdex/interfaces/app';
import { type BakedexApiResponse, type BakedexApiResponseEntity } from './BakedexApiResponse';

/**
 * All possible namespaces used in the Bakedex Bundle Catalog API.
 *
 * @since 1.2.4
 */
export const BakedexApiBunsNamespaces = [
  'players',
  'presets',
  'supporters',
] as const;

/**
 * Bakedex Bundle Catalog API namespace.
 *
 * * Confusingly, this isn't the bundle's *actual* type, but more of like a directory / folder name.
 *   - Items inside the namespace will have their own `ntt`'s, not necessarily those of its parent namespace!
 *   - e.g., `ShowdexPlayerTitle`'s are stored under a `'players'`-entity namespace whose bundle's `ntt` is `'titles'`
 *     in the bundle's "`buns`" metadata (of base type `ShowdexAssetBundle`).
 *
 * @since 1.2.4
 */
export type BakedexApiBunsNamespace = typeof BakedexApiBunsNamespaces[number];

/**
 * Bakedex Bundle Catalog API namespace bundle mappings.
 *
 * * Note that these are just the metadata mappings for each bundle, not them bundles themselves!
 *   - But to know what you're looking for, this might be useful!
 * * (Every bundle metadata object extends the *very particular* base `ShowdexAssetBundle` interface btw.)
 *
 * @since 1.2.4
 */
export type BakedexApiBunsAssetBundle<
  TEntity extends BakedexApiResponseEntity = BakedexApiResponseEntity,
  TBundle extends ShowdexAssetBundle = ShowdexAssetBundle,
> = TBundle & { ntt: TEntity; };

/**
 * Bakedex Bundle Catalog API response payload.
 *
 * @since 1.2.4
 */
export type BakedexApiBunsPayload = {
  [K in BakedexApiBunsNamespace]: K extends 'players'
    ? Record<string, BakedexApiBunsAssetBundle<'titles'>>
    : K extends 'presets'
      ? Record<string, BakedexApiBunsAssetBundle<'presets', ShowdexPresetsBundle>>
      : K extends 'supporters'
        ? Record<string, BakedexApiBunsAssetBundle<'tiers'>>
        : unknown;
};

/**
 * JSON response schema from the Bakedex Bundle Catalog API.
 *
 * @since 1.2.4
 */
export type BakedexApiBunsResponse = BakedexApiResponse<'buns', BakedexApiBunsPayload>;
