import { type GenerationNum } from '@smogon/calc';
import { Types } from '@smogon/calc/dist/data/types';

/**
 * Returns the `types` property used in the `Generation` class.
 *
 * * Note that the object returned by `Dex.types.get()` (from the global `Dex` object) does not
 *   include properties like `effectiveness` that is provided by the `get()` method of the `Types` class.
 *
 * @since 1.0.3
 */
export const getTypesDex = (gen: GenerationNum): Types => new Types(gen);
