/**
 * Bakedex API response `payload` entity / type.
 *
 * @since 1.2.4
 */
export type BakedexApiResponseEntity =
  | 'buns'
  | 'presets'
  | 'tiers'
  | 'titles';

/**
 * Generic response skeleton from the Bakedex API.
 *
 * @since 1.2.4
 */
export interface BakedexApiResponse<
  TEntity = BakedexApiResponseEntity,
  TPayload = unknown,
> {
  ok: boolean;
  status: [code: number, label: string];
  ntt: TEntity;
  payload: TPayload;
}
