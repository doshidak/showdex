/**
 * What's a "uris" ?? LOL idk but this joins together URIs (Universal Resource Indentifiers).
 *
 * @example
 * ```ts
 * joinUris('https://bake.dex.tize.io/', '/v1', '/some//crazy////route');
 *
 * 'https://bake.dex.tize.io/v1/some/crazy/route'
 * ```
 * @since 1.2.4
 */
export const joinUris = (
  baseUrl: string,
  ...uris: string[]
): string => (!baseUrl ? null : [
  baseUrl,
  ...uris,
].filter(Boolean).join('/').replace(/(?<!\w:)\/{2,}/gi, '/'));
