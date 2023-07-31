import { HydroDescriptor, type HydroHeader } from '@showdex/consts/hydro';
import { hydrateDate } from './hydratePrimitives';

/**
 * Hydrates a string `value` into a `HydroHeader`.
 *
 * * Remaining non-header information will be conveniently pre-`split()` via the `delimiter` &
 *   available in the second element of the returned tuple.
 *   - Their opcodes will remain in-tact.
 * * This can conveniently be used to separate the header from the payload (see example below).
 * * An empty array (i.e., `[]`) will be returned if hydration fails for whatever reason.
 *
 * @example
 * ```ts
 * hydrateHeader('v:1.1.6;@:showdex-v1.1.6-b188FC84C1A9-dev.chrome;#:18904BAC42E;$:presets;u:...;p:...;p:...');
 *
 * [
 *   {
 *     version: '1.1.6',
 *     build: 'showdex-v1.1.6-b188FC84C1A9-dev.chrome',
 *     timestamp: '18904BAC42E',
 *     date: Date(),
 *     descriptor: 'presets',
 *     descriptorValid: true,
 *   },
 *   [
 *     'u:...',
 *     'p:...',
 *     'p:...',
 *   ]
 * ]
 * ```
 * @since 1.1.6
 */
export const hydrateHeader = (
  value: string,
  delimiter = ';',
  opcodeDelimiter = ':',
): [
  header?: HydroHeader,
  remaining?: string[],
] => {
  if (!value?.includes(opcodeDelimiter)) {
    return [];
  }

  const parts = value.split(delimiter);

  if (!parts?.length) {
    return [];
  }

  const header: HydroHeader = {
    version: null,
    build: null,
    timestamp: null,
    date: null,
    descriptor: null,
    descriptorValid: false,
  };

  const remaining: string[] = [];

  parts.forEach((part) => {
    if (!part?.includes(opcodeDelimiter)) {
      return;
    }

    const [
      opcode,
      ...partValueParts
    ] = part.split(opcodeDelimiter);

    if (!partValueParts.length) {
      return;
    }

    const partValue = partValueParts.join(opcodeDelimiter);

    switch (opcode) {
      case 'v': {
        header.version = partValue;

        break;
      }

      case '@': {
        header.build = partValue;

        break;
      }

      case '#': {
        header.timestamp = partValue;
        header.date = hydrateDate(header.timestamp);

        break;
      }

      case '$': {
        header.descriptor = partValue as HydroDescriptor;
        header.descriptorValid = Object.values(HydroDescriptor).includes(header.descriptor);

        break;
      }

      default: {
        remaining.push(part);

        break;
      }
    }
  });

  return [
    header,
    remaining,
  ];
};
