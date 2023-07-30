import {
  type CalcdexPlayerKey,
  type ShowdexSettings,
  type ShowdexCalcdexSettings,
} from '@showdex/redux/store';
import { getColorScheme } from '@showdex/utils/app';
import { reverseObjectKv } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import {
  DehydratedCalcdexSettingsMap,
  DehydratedHellodexSettingsMap,
  DehydratedShowdexSettingsMap,
} from './dehydrateSettings';
import { hydrateHeader } from './hydrateHeader';
import { hydrateArray, hydrateBoolean, hydrateValue } from './hydratePrimitives';

/**
 * Reverse opcode-to-key mappings for the hydrated root `ShowdexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedShowdexSettingsMap = reverseObjectKv(DehydratedShowdexSettingsMap);

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexHellodexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedHellodexSettingsMap = reverseObjectKv(DehydratedHellodexSettingsMap);

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexCalcdexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedCalcdexSettingsMap = reverseObjectKv(DehydratedCalcdexSettingsMap);

/**
 * Internally-used list of keys to ignore when hydrating the root `ShowdexSettings`.
 *
 * @since 1.0.3
 */
const IgnoredDehydratedShowdexKeys = [
  // DehydratedShowdexSettingsMap.packageVersion,
  // DehydratedShowdexSettingsMap.buildDate,
];

/**
 * Hydrates a string `value` into per-side settings.
 *
 * @since 1.0.3
 */
export const hydratePerSide = (
  value: string,
  delimiter = '/',
  arrayDelimiter = ',',
): Record<'auth' | CalcdexPlayerKey, unknown> => {
  const [
    auth,
    p1,
    p2,
    p3,
    p4,
  ] = value?.split(delimiter).map((v) => (
    v?.includes(arrayDelimiter)
      ? hydrateArray(v, arrayDelimiter)
      : hydrateBoolean(v)
  )) || [];

  return {
    auth,
    p1,
    p2,
    p3,
    p4,
  };
};

const l = logger('@showdex/utils/hydro/hydrateSettings()');

/**
 * Hydrates the passed-in dehydrated `settings`, typically for restoring settings stored in `LocalStorage`.
 *
 * * If `value` is falsy or improperly formatted, default settings will be returned.
 *
 * @since 1.0.3
 */
export const hydrateSettings = (value?: string): ShowdexSettings => {
  // these settings have their default values, which will be individually overwritten with the hydrated values
  // from the dehydrated settings in the passed-in `value` (otherwise, the default settings will be returned)
  const settings: ShowdexSettings = {
    colorScheme: getColorScheme(),
    forcedColorScheme: 'showdown',
    developerMode: __DEV__,

    hellodex: {
      openOnStart: true,
      focusRoomsRoom: false,
      showBattleRecord: true,
      showDonateButton: true,
    },

    calcdex: {
      openOnStart: 'always',
      openAs: 'showdown',
      openOnPanel: 'showdown',
      // forcedOpenAs: 'showdown',
      // closeOnEnd: false,
      closeOn: 'battle-tab',
      destroyOnClose: true,
      // preserveRenderStates: true,

      defaultAutoSelect: {
        auth: true,
        p1: true,
        p2: true,
        p3: true,
        p4: true,
      },

      showPlayerRatings: true,
      authPosition: 'top',
      showNicknames: false,
      // reverseIconName: false,
      openSmogonPage: true,
      // showAllFormes: true,
      showAllOptions: false,
      showNonDamageRanges: true,
      downloadSmogonPresets: true,
      downloadRandomsPresets: true,
      downloadUsageStats: true,
      maxPresetAge: 14,
      prioritizeUsageStats: false,
      includeTeambuilder: 'always',
      autoImportTeamSheets: true,
      autoExportOpponent: false,

      defaultAutoMoves: {
        auth: false,
        p1: true,
        p2: true,
        p3: true,
        p4: true,
      },

      forceNonVolatile: true,
      lockUsedTera: false,
      resetDirtyBoosts: true,
      editPokemonTypes: 'always',
      showMoveEditor: 'meta',
      showBaseStats: 'meta',
      showLegacyEvs: false,

      lockGeneticsVisibility: {
        auth: [],
        p1: ['iv', 'ev'],
        p2: ['iv', 'ev'],
        p3: ['iv', 'ev'],
        p4: ['iv', 'ev'],
      },

      allowIllegalSpreads: 'meta',
      showUiTooltips: true,
      showAbilityTooltip: true,
      showItemTooltip: true,
      showMoveTooltip: true,
      showMatchupTooltip: true,
      prettifyMatchupDescription: true,
      showMatchupDamageAmounts: 'nfe',
      formatMatchupDamageAmounts: true,
      copyMatchupDescription: true,
      showFieldTooltips: true,

      nhkoColors: [
        '#4CAF50',
        '#FF9800',
        '#FF9800',
        '#F44336',
        '#F44336',
      ],

      nhkoLabels: [
        '1HKO',
        '2HKO',
        '3HKO',
        '4HKO',
      ],
    },
  };

  if (!value || typeof value !== 'string') {
    l.debug(
      'No dehydrated settings string was provided, so returning default settings', settings,
      '\n', 'value', value, '(should be falsy)',
    );

    return settings;
  }

  // const dehydratedSettings = value.split(';') || [];
  const [, dehydratedSettings] = hydrateHeader(value);

  if (!dehydratedSettings.length) {
    l.debug(
      'Dehydrated settings may be improperly formatted, so returning default settings', settings,
      '\n', 'dehydratedSettings', dehydratedSettings,
      '\n', 'value', value,
    );

    return settings;
  }

  dehydratedSettings.forEach((dehydratedSetting) => {
    const [
      rawDehydratedKey,
      dehydratedValue,
    ] = dehydratedSetting?.split(':') || [];

    const dehydratedKey = rawDehydratedKey?.toLowerCase();

    if (!dehydratedKey || IgnoredDehydratedShowdexKeys.includes(dehydratedKey)) {
      return;
    }

    switch (dehydratedKey) {
      case DehydratedShowdexSettingsMap.hellodex: {
        const dehydratedHellodexSettings = dehydratedValue?.split('|') || [];

        if (!dehydratedHellodexSettings.length) {
          break;
        }

        dehydratedHellodexSettings.forEach((dehydratedHellodexSetting) => {
          const [
            rawDehydratedHellodexKey,
            ...dehydratedHellodexValues
          ] = dehydratedHellodexSetting?.split('~') || [];

          const dehydratedHellodexKey = rawDehydratedHellodexKey?.toLowerCase();

          if (!dehydratedHellodexKey) {
            return;
          }

          const dehydratedHellodexValue = dehydratedHellodexValues.join('~');
          const hydratedHellodexKey = HydratedHellodexSettingsMap[dehydratedHellodexKey];

          if (!hydratedHellodexKey || !(hydratedHellodexKey in settings.hellodex)) {
            return;
          }

          // currently, only boolean values exist in ShowdexHellodexSettings
          settings.hellodex[hydratedHellodexKey] = ['y', 'n'].includes(dehydratedHellodexValue)
            ? hydrateBoolean(dehydratedHellodexValue)
            : null;
        });

        break;
      }

      case DehydratedShowdexSettingsMap.calcdex: {
        const dehydratedCalcdexSettings = dehydratedValue?.split('|') || [];

        if (!dehydratedCalcdexSettings.length) {
          break;
        }

        dehydratedCalcdexSettings.forEach((dehydratedCalcdexSetting) => {
          const [
            rawDehydratedCalcdexKey,
            ...dehydratedCalcdexValues
          ] = dehydratedCalcdexSetting?.split('~') || [];

          const dehydratedCalcdexKey = rawDehydratedCalcdexKey?.toLowerCase();

          if (!dehydratedCalcdexKey) {
            return;
          }

          const dehydratedCalcdexValue = dehydratedCalcdexValues.join('~');
          const hydratedCalcdexKey = HydratedCalcdexSettingsMap[dehydratedCalcdexKey];

          if (!hydratedCalcdexKey || !(hydratedCalcdexKey in settings.calcdex)) {
            return;
          }

          // thanks TypeScript!
          // (without this declaration, you'll get a type <type> is not assignable to type 'never' error lmfao)
          const calcdexSettings: Partial<Record<typeof hydratedCalcdexKey, ShowdexCalcdexSettings[typeof hydratedCalcdexKey]>> = settings.calcdex;

          // currently, there are no number values in ShowdexCalcdexSettings
          calcdexSettings[hydratedCalcdexKey] = [
            DehydratedCalcdexSettingsMap.nhkoColors,
            DehydratedCalcdexSettingsMap.nhkoLabels,
          ].includes(dehydratedCalcdexKey)
            ? hydrateArray<Extract<ShowdexCalcdexSettings[typeof hydratedCalcdexKey], unknown[]>>(dehydratedCalcdexValue)
            : [
              DehydratedCalcdexSettingsMap.defaultAutoSelect,
              DehydratedCalcdexSettingsMap.defaultAutoMoves,
              // DehydratedCalcdexSettingsMap.defaultShowGenetics,
              DehydratedCalcdexSettingsMap.lockGeneticsVisibility,
            ].includes(dehydratedCalcdexKey)
              ? hydratePerSide(dehydratedCalcdexValue) as ShowdexCalcdexSettings[typeof hydratedCalcdexKey]
              // : ['y', 'n'].includes(dehydratedCalcdexValue)
              //   ? hydrateBoolean(dehydratedCalcdexValue)
              //   : /^\d+$/.test(dehydratedCalcdexValue)
              //     ? hydrateNumber(dehydratedCalcdexValue)
              //     : hydrateString(dehydratedCalcdexValue) as ShowdexCalcdexSettings[typeof hydratedCalcdexKey];
              : hydrateValue(dehydratedCalcdexValue) as ShowdexCalcdexSettings[typeof hydratedCalcdexKey];
        });

        break;
      }

      default: {
        const hydratedKey = HydratedShowdexSettingsMap[dehydratedKey];

        if (!hydratedKey) {
          break;
        }

        /**
         * @todo remove this once developer features are added
         */
        if (hydratedKey === 'developerMode') {
          break;
        }

        settings[hydratedKey] = hydrateValue(dehydratedValue);

        break;
      }
    }
  });

  // some bandaid fixes cause I ended up changing the types of some old settings
  if (typeof settings.calcdex.includeTeambuilder === 'boolean') {
    settings.calcdex.includeTeambuilder = settings.calcdex.includeTeambuilder
      ? 'always' // true
      : 'never'; // false
  }

  return settings;
};
