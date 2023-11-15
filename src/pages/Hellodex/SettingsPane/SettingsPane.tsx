import * as React from 'react';
import Svg from 'react-inlinesvg';
import { Form, FormSpy } from 'react-final-form';
// import { useHotkeys } from 'react-hotkeys-hook';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import {
  type BadgeInstance,
  type BaseButtonProps,
  Badge,
  BaseButton,
  Button,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { type ShowdexSettings } from '@showdex/interfaces/app';
import {
  useColorScheme,
  useShowdexSettings,
  useUpdateSettings,
} from '@showdex/redux/store';
import {
  clearStoredItem,
  env,
  getResourceUrl,
  getStoredItem,
  nonEmptyObject,
  readClipboardText,
  writeClipboardText,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { dehydrateSettings, hydrateSettings, possiblyDehydrated } from '@showdex/utils/hydro';
import { CalcdexSettingsPane } from './CalcdexSettingsPane';
import { HellodexSettingsPane } from './HellodexSettingsPane';
import { ShowdexSettingsPane } from './ShowdexSettingsPane';
import { ShowdownSettingsPane } from './ShowdownSettingsPane';
import styles from './SettingsPane.module.scss';

export interface SettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  inBattle?: boolean;
  onRequestClose?: BaseButtonProps['onPress'];
}

const l = logger('@showdex/pages/Hellodex/SettingsPane');

const getPresetCacheSize = () => (getStoredItem('storage-preset-cache-key')?.length ?? 0) * 2;

/**
 * Showdex settings UI.
 *
 * @todo This file is gross. It's over 1500 lines.
 * @warning Also a warning lol.
 * @since 1.0.3
 */
export const SettingsPane = ({
  className,
  style,
  inBattle,
  onRequestClose,
}: SettingsPaneProps): JSX.Element => {
  const colorScheme = useColorScheme();
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

      // const importedSettings = env('build-target') === 'firefox'
      //   // ? await (browser.runtime.sendMessage('clipboardReadText') as Promise<string>)
      //   ? await dispatchShowdexEvent<string>({ type: 'clipboardReadText' })
      //   : await navigator.clipboard.readText();
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

      // await navigator.clipboard.writeText(dehydratedSettings);
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

        await navigator.clipboard.writeText(dehydratedDefaults);
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
  const presetCacheTimeout = React.useRef<NodeJS.Timeout>(null);

  // only updates the state when the size actually changes
  const updatePresetCacheSize = () => {
    const size = getPresetCacheSize();

    if (size === presetCacheSize) {
      return;
    }

    setPresetCacheSize(size);
  };

  // every 30 sec, check the preset cache size lmfao
  React.useEffect(() => {
    if (presetCacheTimeout.current) {
      return;
    }

    presetCacheTimeout.current = setTimeout(updatePresetCacheSize, 30000);
    updatePresetCacheSize();

    return () => {
      if (presetCacheTimeout.current) {
        clearTimeout(presetCacheTimeout.current);
        presetCacheTimeout.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- empty deps are intentional to only run on first mount

  const handleSettingsChange = (values: DeepPartial<ShowdexSettings>) => {
    if (!nonEmptyObject(values)) {
      return;
    }

    const {
      // colorScheme: newColorScheme,
      calcdex,
    } = values;

    /*
    if (newColorScheme && colorScheme !== newColorScheme) {
      // note: Storage is a native Web API (part of the Web Storage API), but Showdown redefines it with its own Storage() function
      // also, Dex.prefs() is an alias of Storage.prefs(), but w/o the `value` and `save` args
      (Storage as unknown as Showdown.ClientStorage)?.prefs?.('theme', newColorScheme, true);

      // this is how Showdown natively applies the theme lmao
      // see: https://github.com/smogon/pokemon-showdown-client/blob/1ea5210a360b64ede48813d9572b59b7f3d7365f/js/client.js#L473
      $?.('html').toggleClass('dark', newColorScheme === 'dark');
    }
    */

    // clear the cache if the user intentionally set preset caching to "never" (i.e., `0` days)
    // intentionally checking 0 as to ignore null & undefined values
    if (presetCacheSize && calcdex?.maxPresetAge === 0) {
      clearStoredItem('storage-preset-cache-key');
      updatePresetCacheSize();
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
