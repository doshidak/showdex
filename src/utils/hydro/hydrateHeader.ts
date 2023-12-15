import { type HydroHeader, HydroDescriptor } from '@showdex/interfaces/hydro';
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
    buildTimestamp: null,
    buildDate: null,
    buildEnvironment: 'production',
    buildTarget: null,
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

        // e.g., header.build = 'showdex-v1.2.0-b18C6BC343EC-dev.chrome'
        if (header.build?.includes('-')) {
          const [
            , // e.g., 'showdex'
            versionPart, // e.g., 'v1.2.0'
            buildPart, // e.g., 'b18C6BC343EC'
            targetPart, // e.g., 'dev.chrome'
          ] = header.build.split('-');

          if (versionPart?.startsWith('v') && !header.version) {
            header.version = versionPart.slice(1);
          }

          if (buildPart?.startsWith('b')) {
            header.buildTimestamp = buildPart.slice(1);
            header.buildDate = hydrateDate(header.buildTimestamp);
          }

          if (targetPart) {
            header.buildTarget = targetPart;

            if (header.buildTarget.startsWith('dev.')) {
              header.buildEnvironment = 'development';
              header.buildTarget = header.buildTarget.replace('dev.', '');
            }
          }
        }

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
