/**
 * JSON primitive type.
 *
 * @since 1.0.7
 */
export type JsonPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined;

/**
 * JSON value type.
 *
 * @since 1.0.7
 */
export type JsonValue =
  | JsonPrimitive
  | object
  | (JsonPrimitive | object)[];

/**
 * JSON object type.
 *
 * @since 1.0.7
 */
export type Json = object | JsonValue[];
