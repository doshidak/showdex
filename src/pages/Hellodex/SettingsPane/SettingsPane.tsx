import * as React from 'react';
import Svg from 'react-inlinesvg';
import { Form, FormSpy } from 'react-final-form';
// import { useHotkeys } from 'react-hotkeys-hook';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import {
  type BadgeInstance,
  Badge,
  BaseButton,
  Button,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { type ShowdexSettings } from '@showdex/interfaces/app';
import {
  useColorScheme,
  useHellodexState,
  useShowdexSettings,
  useUpdateSettings,
} from '@showdex/redux/store';
import {
  env,
  getResourceUrl,
  nonEmptyObject,
  readClipboardText,
  writeClipboardText,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { dehydrateSettings, hydrateSettings, possiblyDehydrated } from '@showdex/utils/hydro';
import { clearPresetsDb } from '@showdex/utils/storage';
import { CalcdexSettingsPane } from './CalcdexSettingsPane';
import { HellodexSettingsPane } from './HellodexSettingsPane';
import { ShowdexSettingsPane } from './ShowdexSettingsPane';
import { ShowdownSettingsPane } from './ShowdownSettingsPane';
import styles from './SettingsPane.module.scss';

export interface SettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  onRequestClose?: () => void;
}

const l = logger('@showdex/pages/Hellodex/SettingsPane');

// const getPresetCacheSize = () => (readLocalStorageItem('local-storage-deprecated-preset-cache-key')?.length ?? 0) * 2;

/**
 * Showdex settings UI.
 *
 * @since 1.0.3
 */
export const SettingsPane = ({
  className,
  style,
  onRequestClose,
}: SettingsPaneProps): JSX.Element => {
  const colorScheme = useColorScheme();
  const state = useHellodexState();
  const inBattle = ['xs', 'sm'].includes(state.containerSize);

  const settings = useShowdexSettings();
  const updateSettings = useUpdateSettings();

  const importBadgeRef = React.useRef<BadgeInstance>(null);
  const importFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const [prevSettings, setPrevSettings] = React.useState<string>(null);
  const importUndoTimeout = React.useRef<NodeJS.Timeout>(null);

  const handleSettingsImport = () => void (async () => {
    l.debug(
      'Attempting to import settings from clipboard...',
      '\n', 'build-target', env('build-target'),
      // '\n', 'browser global available?', typeof browser !== 'undefined',
    );

    try {
      if (possiblyDehydrated(prevSettings)) {
        const rehydratedPrev = hydrateSettings(prevSettings);

        if (importUndoTimeout.current) {
          clearTimeout(importUndoTimeout.current);
          importUndoTimeout.current = null;
        }

        updateSettings(rehydratedPrev);
        setPrevSettings(null);

        return;
      }

      const importedSettings = await readClipboardText();

      l.debug(
        'Received dehydrated settings from clipboard',
        '\n', 'importedSettings', importedSettings,
      );

      if (!possiblyDehydrated(importedSettings)) {
        l.debug(
          'Failed the dehydrated settings regex test!',
          '\n', 'importedSettings', importedSettings,
        );

        return void importFailedBadgeRef.current?.show();
      }

      const dehydratedCurrent = dehydrateSettings(settings);

      if (possiblyDehydrated(dehydratedCurrent)) {
        setPrevSettings(dehydratedCurrent);

        if (importUndoTimeout.current) {
          clearTimeout(importUndoTimeout.current);
        }

        importUndoTimeout.current = setTimeout(() => {
          setPrevSettings(null);
          importUndoTimeout.current = null;
        }, 5000);
      }

      const hydratedSettings = hydrateSettings(importedSettings);

      if (!hydratedSettings) {
        l.debug(
          'Got no hydratedSettings back for some reason :o',
          '\n', 'importedSettings', importedSettings,
        );

        return void importFailedBadgeRef.current?.show();
      }

      updateSettings(hydratedSettings);
      importBadgeRef.current?.show();
    } catch (error) {
      if (__DEV__) {
        l.error(
          'Failed to import dehydrated settings from clipboard:',
          '\n', error,
          '\n', '(You will only see this error on development.)',
        );
      }

      importFailedBadgeRef.current?.show();
    }
  })();

  const exportBadgeRef = React.useRef<BadgeInstance>(null);
  const exportFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const handleSettingsExport = () => void (async () => {
    try {
      const dehydratedSettings = dehydrateSettings(settings);

      if (!possiblyDehydrated(dehydratedSettings)) {
        l.debug(
          'Failed the dehydrated settings regex test!',
          '\n', 'dehydratedSettings', dehydratedSettings,
        );

        return void exportFailedBadgeRef.current?.show();
      }

      await writeClipboardText(dehydratedSettings);
      exportBadgeRef.current?.show();
    } catch (error) {
      if (__DEV__) {
        l.error(
          'Failed to export dehydrated settings to clipboard:',
          '\n', error,
          '\n', '(You will only see this error on development.)',
        );
      }

      exportFailedBadgeRef.current?.show();
    }
  })();

  const defaultsBadgeRef = React.useRef<BadgeInstance>(null);
  const defaultsFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const handleSettingsDefaults = () => {
    if (typeof navigator === 'undefined') {
      return;
    }

    void (async () => {
      try {
        const hydratedDefaults = hydrateSettings();
        const dehydratedDefaults = dehydrateSettings(hydratedDefaults);

        if (!possiblyDehydrated(dehydratedDefaults)) {
          l.debug(
            'Failed the dehydrated settings regex test!',
            '\n', 'dehydratedDefaults', dehydratedDefaults,
          );

          return void defaultsFailedBadgeRef.current?.show();
        }

        await writeClipboardText(dehydratedDefaults);
        defaultsBadgeRef.current?.show();
      } catch (error) {
        if (__DEV__) {
          l.error(
            'Failed to export dehydrated settings to clipboard:',
            '\n', error,
            '\n', '(You will only see this error on development.)',
          );
        }

        defaultsFailedBadgeRef.current?.show();
      }
    })();
  };

  /*
  const hotkeysRef = useHotkeys<HTMLDivElement>('esc', (e, handler) => {
    e?.preventDefault?.();

    switch (handler.key) {
      case 'esc': {
        onRequestClose?.(null);

        break;
      }

      default: {
        break;
      }
    }
  }, null, [
    onRequestClose,
  ]);
  */

  const [presetCacheSize, setPresetCacheSize] = React.useState(0);
  const [maxCacheSize, setMaxCacheSize] = React.useState(0);
  // const presetCacheTimeout = React.useRef<NodeJS.Timeout>(null);

  // only updates the state when the size actually changes
  const updatePresetCacheSize = () => void (async () => {
    if (typeof navigator?.storage?.estimate !== 'function') {
      return;
    }

    // const size = getPresetCacheSize();
    const estimates = await navigator.storage.estimate();

    // doesn't appear to be a way to easily measure the size of just Showdex's IndexedDB,
    // but at the time of writing (2023/12/28), next to Permutive's 2 object stores w/ 4 total entries,
    // safe to say majority of the size is from our object stores lmao
    const {
      quota,
      usage,
      // usageDetails: { indexedDB }, // not typed for some reason, but appears on Chrome
    } = estimates || {};

    if ((usage || 0) !== presetCacheSize) {
      setPresetCacheSize(usage);
    }

    if ((quota || 0) !== maxCacheSize) {
      setMaxCacheSize(quota);
    }
  })();

  // check the estimated preset cache size on mount only
  React.useEffect(() => {
    // if (presetCacheTimeout.current) {
    //   return;
    // }

    // presetCacheTimeout.current = setTimeout(updatePresetCacheSize, 30000);
    updatePresetCacheSize();

    // return () => {
    //   if (presetCacheTimeout.current) {
    //     clearTimeout(presetCacheTimeout.current);
    //     presetCacheTimeout.current = null;
    //   }
    // };
  });

  const handleSettingsChange = (values: DeepPartial<ShowdexSettings>) => {
    if (!nonEmptyObject(values)) {
      return;
    }

    const {
      // colorScheme: newColorScheme,
      calcdex,
    } = values;

    // clear the cache if the user intentionally set preset caching to "never" (i.e., `0` days)
    // intentionally checking 0 as to ignore null & undefined values
    if (presetCacheSize && calcdex?.maxPresetAge === 0) {
      void (async () => {
        // purgeLocalStorageItem('local-storage-deprecated-preset-cache-key');
        await clearPresetsDb();
        updatePresetCacheSize();
      })();
    }

    updateSettings(values);
  };

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        inBattle && styles.inBattle,
        className,
      )}
      style={style}
    >
      <Tooltip
        content="Close Showdex Settings"
        offset={[0, 10]}
        delay={[1000, 50]}
        trigger="mouseenter"
        touch={['hold', 500]}
      >
        <BaseButton
          className={styles.closeButton}
          display="inline"
          aria-label="Close Showdex Settings"
          onPress={onRequestClose}
        >
          <Svg
            className={styles.closeIcon}
            src={getResourceUrl('close-circle.svg')}
            description="Close Circle Icon"
          />
        </BaseButton>
      </Tooltip>

      <Scrollable className={styles.contentContainer}>
        <BuildInfo
          position="top-right"
        />

        <Form<ShowdexSettings, DeepPartial<ShowdexSettings>>
          initialValues={settings}
          onSubmit={() => {}}
        >
          {({
            values,
            handleSubmit,
          }) => (
            <form
              className={styles.content}
              onSubmit={(e) => void handleSubmit(e)}
            >
              <FormSpy<ShowdexSettings>
                subscription={{ dirty: true, values: true }}
                onChange={({
                  dirty,
                  values: newValues,
                }) => {
                  if (!dirty) {
                    return;
                  }

                  handleSettingsChange(newValues);
                }}
              />

              <div className={styles.header}>
                <div className={styles.left}>
                  <Svg
                    className={styles.settingsIcon}
                    src={getResourceUrl('cog.svg')}
                    description="Cog Icon"
                  />

                  <div className={styles.title}>
                    Settings
                  </div>
                </div>

                <div className={styles.right}>
                  <Button
                    className={cx(
                      styles.actionButton,
                      styles.importButton,
                      !!prevSettings && styles.undoButton,
                    )}
                    label={prevSettings ? 'Undo?' : 'Import'}
                    tooltip={(
                      <div className={cx(styles.tooltipContent, styles.importTooltip)}>
                        <Badge
                          ref={importBadgeRef}
                          className={styles.importBadge}
                          label="Imported"
                          color="blue"
                        />

                        <Badge
                          ref={importFailedBadgeRef}
                          className={styles.importBadge}
                          label="Failed"
                          color="red"
                        />

                        Import Settings from Clipboard
                      </div>
                    )}
                    tooltipTrigger={['focus', 'mouseenter']}
                    // tooltipDisabled={!!prevSettings}
                    hoverScale={1}
                    onPress={handleSettingsImport}
                  />

                  <Button
                    className={cx(
                      styles.actionButton,
                      styles.exportButton,
                    )}
                    label="Export"
                    tooltip={(
                      <div className={cx(styles.tooltipContent, styles.importTooltip)}>
                        <Badge
                          ref={exportBadgeRef}
                          className={styles.importBadge}
                          label="Copied!"
                          color="green"
                        />

                        <Badge
                          ref={exportFailedBadgeRef}
                          className={styles.importBadge}
                          label="Failed"
                          color="red"
                        />

                        Export Settings to Clipboard
                      </div>
                    )}
                    tooltipTrigger={['focus', 'mouseenter']}
                    hoverScale={1}
                    onPress={handleSettingsExport}
                  />

                  {
                    !inBattle &&
                    <Button
                      className={cx(
                        styles.actionButton,
                        styles.defaultsButton,
                      )}
                      label="Defaults"
                      tooltip={(
                        <div className={cx(styles.tooltipContent, styles.importTooltip)}>
                          <Badge
                            ref={defaultsBadgeRef}
                            className={styles.importBadge}
                            label="Copied!"
                            color="green"
                          />

                          <Badge
                            ref={defaultsFailedBadgeRef}
                            className={styles.importBadge}
                            label="Failed"
                            color="red"
                          />

                          Export Defaults to Clipboard
                        </div>
                      )}
                      tooltipTrigger={['focus', 'mouseenter']}
                      hoverScale={1}
                      onPress={handleSettingsDefaults}
                    />
                  }

                  <div className={styles.closePlaceholder} />
                </div>
              </div>

              <ShowdexSettingsPane
                inBattle={inBattle}
              />

              <HellodexSettingsPane
                value={values?.hellodex}
              />

              <CalcdexSettingsPane
                value={values?.calcdex}
                presetCacheSize={presetCacheSize}
                maxCacheSize={maxCacheSize}
                inBattle={inBattle}
              />

              <ShowdownSettingsPane>
                {/* temporary spacer cause too lazy to do it in CSS lol */}
                <div style={{ height: 5 }} />
              </ShowdownSettingsPane>

              <div className={styles.notice}>
                plz excuse the mess, this is a work in progress
                <br />
                <span className={styles.face}>
                  (｡◕‿◕｡)
                </span>
              </div>
            </form>
          )}
        </Form>
      </Scrollable>
    </div>
  );
};
