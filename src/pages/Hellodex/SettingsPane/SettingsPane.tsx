import * as React from 'react';
import Svg from 'react-inlinesvg';
import { Field, Form, FormSpy } from 'react-final-form';
// import { useHotkeys } from 'react-hotkeys-hook';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { Segmented, Switch, TextField } from '@showdex/components/form';
import {
  type BadgeInstance,
  type BaseButtonProps,
  Badge,
  BaseButton,
  Button,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import {
  type ShowdexSettings,
  useAuthUsername,
  useColorScheme,
  useShowdexSettings,
  useUpdateSettings,
} from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
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
import { fileSize } from '@showdex/utils/humanize';
import { dehydrateSettings, hydrateSettings } from '@showdex/utils/hydro';
import styles from './SettingsPane.module.scss';

export interface SettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  inBattle?: boolean;
  onRequestClose?: BaseButtonProps['onPress'];
}

const DehydratedRegex = /^v:\d+\.\d+\.\d+;[a-z]{1,3}:/;

const l = logger('@showdex/pages/Hellodex/SettingsPane');

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
  const authName = useAuthUsername();
  const authTitle = findPlayerTitle(authName, true);

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
      if (DehydratedRegex.test(prevSettings)) {
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

      if (!DehydratedRegex.test(importedSettings)) {
        l.debug(
          'Failed the dehydrated settings regex test!',
          '\n', 'importedSettings', importedSettings,
        );

        importFailedBadgeRef.current?.show();

        return;
      }

      const dehydratedCurrent = dehydrateSettings(settings);

      if (DehydratedRegex.test(dehydratedCurrent)) {
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

        importFailedBadgeRef.current?.show();

        return;
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

      if (!DehydratedRegex.test(dehydratedSettings)) {
        l.debug(
          'Failed the dehydrated settings regex test!',
          '\n', 'dehydratedSettings', dehydratedSettings,
        );

        exportFailedBadgeRef.current?.show();

        return;
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

        if (!DehydratedRegex.test(dehydratedDefaults)) {
          l.debug(
            'Failed the dehydrated settings regex test!',
            '\n', 'dehydratedDefaults', dehydratedDefaults,
          );

          defaultsFailedBadgeRef.current?.show();

          return;
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

  // const hotkeysRef = useHotkeys<HTMLDivElement>('esc', (e, handler) => {
  //   e?.preventDefault?.();
  //
  //   switch (handler.key) {
  //     case 'esc': {
  //       onRequestClose?.(null);
  //
  //       break;
  //     }
  //
  //     default: {
  //       break;
  //     }
  //   }
  // }, null, [
  //   onRequestClose,
  // ]);

  const [presetCacheSize, setPresetCacheSize] = React.useState(0);
  const presetCacheTimeout = React.useRef<NodeJS.Timeout>(null);

  const getPresetCacheSize = () => (getStoredItem('storage-preset-cache-key')?.length ?? 0) * 2;

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

    // if (newColorScheme && colorScheme !== newColorScheme) {
    //   // note: Storage is a native Web API (part of the Web Storage API), but Showdown redefines it with its own Storage() function
    //   // also, Dex.prefs() is an alias of Storage.prefs(), but w/o the `value` and `save` args
    //   (Storage as unknown as Showdown.ClientStorage)?.prefs?.('theme', newColorScheme, true);
    //
    //   // this is how Showdown natively applies the theme lmao
    //   // see: https://github.com/smogon/pokemon-showdown-client/blob/1ea5210a360b64ede48813d9572b59b7f3d7365f/js/client.js#L473
    //   $?.('html').toggleClass('dark', newColorScheme === 'dark');
    // }

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

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>
                  Showdex
                </div>

                <div className={styles.settingsGroupFields}>
                  <Field<ShowdexSettings['forcedColorScheme']>
                    name="forcedColorScheme"
                    component={Segmented}
                    className={styles.field}
                    label="Color Theme"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Showdown',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Matches Showdown's graphics theme.
                        </div>
                      ),
                      value: 'showdown',
                    }, {
                      label: 'Light',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Forces a light theme for everything Showdex,
                          regardless of Showdown's graphics theme.
                        </div>
                      ),
                      value: 'light',
                    }, {
                      label: 'Dark',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Forces a dark theme for everything Showdex,
                          regardless of Showdown's graphics theme.
                        </div>
                      ),
                      value: 'dark',
                    }]}
                  />

                  {/* congrats you found a secret setting! coming soon tho */}
                  {
                    __DEV__ &&
                    <Field<ShowdexSettings['developerMode']>
                      name="developerMode"
                      component={Switch}
                      className={cx(styles.field, styles.switchField)}
                      label="Developer Mode"
                      tooltip={(
                        <div className={styles.tooltipContent}>
                          <em>This is a planned feature.</em>
                          <br />
                          <em>If you're a geek, stay tuned!</em>
                        </div>
                      )}
                      readOnly
                      format={() => false}
                    />
                  }
                </div>
              </div>

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>
                  Hellodex
                </div>

                <div className={styles.settingsGroupFields}>
                  <Field<ShowdexSettings['hellodex']['openOnStart']>
                    name="hellodex.openOnStart"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Open When Showdown Starts"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        <em>
                          This is actually a planned feature!
                          <br />
                          If you're like wtf how would I access these settings again after
                          disabling this, the answer is...
                          <br />
                          Stay tuned!
                        </em>
                      </div>
                    )}
                    readOnly
                  />

                  <Field<ShowdexSettings['hellodex']['focusRoomsRoom']>
                    name="hellodex.focusRoomsRoom"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Show Chatrooms Panel"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Miss the default chatrooms panel when Showdown first starts?
                        Disabling this won't auto-focus the Hellodex tab.
                        <br />
                        <br />
                        This does not affect <em>Single Panel</em> users.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['hellodex']['showBattleRecord']>
                    name="hellodex.showBattleRecord"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Show Win/Loss Counter"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Displays a Win/Loss counter in the Hellodex for <em>funsies</em>.
                        <br />
                        <br />
                        Only records games that you've played (i.e., ignores spectating games).
                        Won't appear if there are no recorded wins or losses.
                        <br />
                        <br />
                        Recorded amounts don't persist between sessions; i.e., will reset back to 0W-0L
                        as soon as you refresh the page.
                      </div>
                    )}
                  />

                  {
                    (!!authTitle || !values?.hellodex?.showDonateButton) &&
                    <>
                      <div className={styles.settingsGroupTitle}>
                        Special
                      </div>

                      <Field<ShowdexSettings['hellodex']['showDonateButton']>
                        name="hellodex.showDonateButton"
                        component={Switch}
                        className={cx(styles.field, styles.switchField)}
                        label="Show Donate Button"
                        tooltip={(
                          <div className={styles.tooltipContent}>
                            Shows the donate button in the Hellodex.
                            <br />
                            <br />
                            If you're seeing this, you're either very special to us or you're a 1337 hax0r.
                            Either way, feel free to turn this off.
                          </div>
                        )}
                      />
                    </>
                  }
                </div>
              </div>

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>
                  Calcdex
                </div>

                <div className={styles.settingsGroupFields}>
                  <Field<ShowdexSettings['calcdex']['openOnStart']>
                    name="calcdex.openOnStart"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Open When"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Playing',
                      tooltip: "Only open in battles you're playing.",
                      value: 'playing',
                    }, {
                      label: 'Spectating',
                      tooltip: "Only open in battles you're spectating.",
                      value: 'spectating',
                    }, {
                      label: 'Both',
                      tooltip: 'Always open in all battles.',
                      value: 'always',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never open the Calcdex under <strong>any</strong> circumstances...
                          <br />
                          ... <em>but why tho ?</em>
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['openAs']>
                    name="calcdex.openAs"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Open as"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Panel Tab',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens as a panel tab on the right, if space permits.
                          Otherwise, opening the tab will fill up the screen.
                          Syncing will occur as long as the battle's tab is open.
                          <br />
                          <br />
                          Recommended for <em>Left-Right Panel</em> users.
                        </div>
                      ),
                      value: 'panel',
                    }, {
                      label: 'Battle Overlay',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens as an overlay over the battle's chat.
                          Initially hidden until you click on <em>Open Calcdex</em>{' '}
                          in the battle controls.
                          <br />
                          <br />
                          Once the battle's tab is closed,
                          the embedded Calcdex will be cleared from memory,
                          at which point it cannot be reopened from the Hellodex tab.
                          <br />
                          <br />
                          Recommended for <em>Single Panel</em> users or
                          those who chill in chatrooms while they play.
                        </div>
                      ),
                      value: 'overlay',
                    }, {
                      label: 'Auto',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Uses the <strong>Panel Tab</strong> if your Showdown's layout has{' '}
                          <em>Left-Right Panels</em> &amp; the{' '}
                          <strong>Battle Overlay</strong> if it has a <em>Single Panel</em>.
                          <br />
                          <br />
                          Hover over these options to learn more.
                        </div>
                      ),
                      value: 'showdown',
                    }]}
                  />

                  <div className={styles.settingsGroupTitle}>
                    Panel Tab
                  </div>

                  <Field<ShowdexSettings['calcdex']['openOnPanel']>
                    name="calcdex.openOnPanel"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Open Tab on"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Left Panel',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens the Calcdex panel tab on the <strong>Left</strong>,
                          regardless of the side that the battle is configured to open on.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'left',
                    }, {
                      label: 'Right Panel',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens the Calcdex panel tab on the <strong>Right</strong>,
                          regardless of the side that the battle is configured to open on.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'right',
                    }, {
                      label: 'Auto',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens the Calcdex panel tab on the <strong>Right</strong>{' '}
                          if Showdown opens battles on the <em>left</em> (default),
                          or vice versa, based on your battle options.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'showdown',
                    }]}
                    disabled={values.calcdex?.openAs === 'overlay'}
                  />

                  <Field<ShowdexSettings['calcdex']['closeOn']>
                    name="calcdex.closeOn"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Close Tab When"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Battle Ends',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Closes the Calcdex panel tab once the battle ends.
                          <br />
                          <br />
                          Unless <em>Clear Memory After Tab Closes</em> is on,
                          the closed tab can be reopened from the Hellodex.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'battle-end',
                    }, {
                      label: 'Battle Closes',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Closes the Calcdex panel tab when the battle is closed.
                          <br />
                          <br />
                          Unless <em>Clear Memory After Tab Closes</em> is on,
                          the closed tab can be reopened from the Hellodex.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'battle-tab',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Disables auto-closing of the Calcdex panel tab based on
                          the battle's state.
                          <br />
                          Instead, the Calcdex must be manually closed every time.
                          <br />
                          <br />
                          Unless <em>Clear Memory After Tab Closes</em> is on,
                          the closed tab can be reopened from the Hellodex.
                          <br />
                          <br />
                          This does not affect Calcdexes that <em>Open as</em> a{' '}
                          <strong>Battle Overlay</strong>.
                        </div>
                      ),
                      value: 'never',
                    }]}
                    format={(value) => (values.calcdex?.openAs === 'overlay' ? 'never' : value)}
                    disabled={values.calcdex?.openAs === 'overlay'}
                  />

                  <Field<ShowdexSettings['calcdex']['destroyOnClose']>
                    name="calcdex.destroyOnClose"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Clear Memory After Tab Closes"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Clears memory used by the Calcdex after the tab closes,
                        but cannot be reopened from the Hellodex tab.
                        <br />
                        <br />
                        Enabling this may improve performance on lower-spec machines.
                        <br />
                        <br />
                        This does not affect Calcdexes that <em>Open as</em> a{' '}
                        <strong>Battle Overlay</strong> as their memory is cleared as soon as
                        the battle's tab is closed.
                      </div>
                    )}
                    format={(value) => (values.calcdex?.openAs === 'overlay' ? false : value)}
                    disabled={values.calcdex?.openAs === 'overlay'}
                  />

                  <div className={styles.settingsGroupTitle}>
                    Sets
                  </div>

                  <Field<ShowdexSettings['calcdex'], HTMLDivElement, ('smogon' | 'randoms' | 'usage')[]>
                    name="calcdex"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Download Sets"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Smogon',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads freshly updated sets in non-Randoms formats.
                          All sets from all available formats in the gen will be downloaded once
                          per Showdown session.
                          <br />
                          <br />
                          Disabling this may improve performance on lower-spec machines.
                        </div>
                      ),
                      value: 'smogon',
                    }, {
                      label: 'Randoms',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads freshly updated special sets in Randoms only,
                          which includes all the pools you can already find on
                          the original Damage Calculator.
                          <br />
                          <br />
                          Disabling this may <em>slightly</em> improve performance on lower-spec machines.
                        </div>
                      ),
                      value: 'randoms',
                    }, {
                      label: 'Usage',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads freshly updated Showdown usage stats, which will display probabilities
                          for abilities, items &amp; moves.
                          <br />
                          <br />
                          In non-Randoms formats, an additional set called <em>Showdown Usage</em> will be
                          available, converted from the usage stats.
                          <br />
                          <br />
                          Disabling this may <em>slightly</em> improve performance on lower-spec machines.
                        </div>
                      ),
                      value: 'usage',
                    }]}
                    multi
                    unique
                    parse={(value) => ({
                      ...values.calcdex,
                      downloadSmogonPresets: !!value?.includes('smogon'),
                      downloadRandomsPresets: !!value?.includes('randoms'),
                      downloadUsageStats: !!value?.includes('usage'),
                    })}
                    format={(value) => ([
                      value?.downloadSmogonPresets && 'smogon',
                      value?.downloadRandomsPresets && 'randoms',
                      value?.downloadUsageStats && 'usage',
                    ] as ('smogon' | 'randoms' | 'usage')[]).filter(Boolean)}
                  />

                  <Field<ShowdexSettings['calcdex']['maxPresetAge'], HTMLDivElement, number>
                    name="calcdex.maxPresetAge"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label={[
                      'Cache Sets',
                      presetCacheSize && `(${fileSize(presetCacheSize, {
                        precision: 1,
                        omitSymbolPrefix: true,
                      })})`,
                      'for',
                    ].filter(Boolean).join(' ')}
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: '1 Day',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads sets &amp; reuses them for <strong>1 Day</strong>,
                          persisting between Showdown sessions.
                          <br />
                          <br />
                          Enabling this may improve Calcdex initialization performance.
                        </div>
                      ),
                      value: 1,
                    }, {
                      label: '1 Week',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads sets &amp; reuses them for <strong>1 Week</strong> (7 days),
                          persisting between Showdown sessions.
                          <br />
                          <br />
                          Enabling this may improve Calcdex initialization performance.
                        </div>
                      ),
                      value: 7,
                    }, {
                      label: '2 Weeks',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads sets &amp; reuses them for <strong>2 Weeks</strong> (14 days),
                          persisting between Showdown sessions.
                          <br />
                          <br />
                          Enabling this may improve Calcdex initialization performance.
                        </div>
                      ),
                      value: 14,
                    }, {
                      label: '1 Month',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads sets &amp; reuses them for <strong>1 Month</strong> (30 days),
                          persisting between Showdown sessions.
                          <br />
                          <br />
                          Enabling this may improve Calcdex initialization performance.
                        </div>
                      ),
                      value: 30,
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Downloads sets once per session, but doesn't store them in-between.
                          This means sets will be downloaded again the next time you open Showdown.
                          <br />
                          <br />
                          Selecting this option with sets already in the cache will <strong>clear</strong>{' '}
                          the cache entirely.
                          <br />
                          <br />
                          This is the default behavior prior to v1.1.6.
                        </div>
                      ),
                      value: 0,
                    }]}
                    disabled={(
                      !values.calcdex?.downloadSmogonPresets
                        && !values.calcdex?.downloadRandomsPresets
                        && !values.calcdex?.downloadUsageStats
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['includeTeambuilder']>
                    name="calcdex.includeTeambuilder"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Include Teambuilder"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Teams',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Includes your locally-stored Teambuilder teams only, but not boxes.
                          These sets will be available in the dropdown for your &amp; your opponent's
                          (or spectating players') Pok&eacute;mon.
                          <br />
                          <br />
                          Teams that start with "Untitled" or Pok&eacute;mon with an empty moveset or
                          incomplete EV distribution (if applicable) will be ignored.
                          <br />
                          <br />
                          For your Pok&eacute;mon, your Teambuilder sets will be used to match the
                          server-reported stats before guessing, in which case you won't see the{' '}
                          <em>Yours</em> set if a match was found.
                        </div>
                      ),
                      value: 'teams',
                    }, {
                      label: 'Boxes',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Includes your locally-stored Teambuilder boxes only, but not teams.
                          These sets will be available in the dropdown for your &amp; your opponent's
                          (or spectating players') Pok&eacute;mon.
                          <br />
                          <br />
                          Pok&eacute;mon in these boxes with an empty moveset or incomplete EV distribution
                          (if applicable) will be ignored.
                          <br />
                          <br />
                          For your Pok&eacute;mon, sets derived from your Teambuilder teams will still
                          be used to match the server-reported stats before guessing, in which case you
                          won't see the <em>Yours</em> set if a match was found.
                        </div>
                      ),
                      value: 'boxes',
                    }, {
                      label: 'Both',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Includes <em>both</em> of your locally-stored Teambuilder teams &amp; boxes.
                          These sets will be available in the dropdown for your &amp; your opponent's
                          (or spectating players') Pok&eacute;mon.
                          <br />
                          <br />
                          Teams that start with "Untitled" or Pok&eacute;mon with an empty moveset or
                          incomplete EV distribution (if applicable) will be ignored.
                          <br />
                          <br />
                          For your Pok&eacute;mon, your Teambuilder sets will be used to match the
                          server-reported stats before guessing, in which case you won't see the{' '}
                          <em>Yours</em> set if a match was found.
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never includes locally-stored Teambuilder teams &amp; boxes.
                          <br />
                          <br />
                          For your Pok&eacute;mon, the Calcdex will guess your spread every time as the server
                          only reports stats after the spread has been applied, but not the exact spread.
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['prioritizeUsageStats']>
                    name="calcdex.prioritizeUsageStats"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Apply Usage Sets First"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Prioritizes applying the <em>Showdown Usage</em> set, if available,
                        to your opponent's (or spectating players') Pok&eacute;mon
                        in non-Randoms formats.
                        <br />
                        <br />
                        Otherwise, the first set of the closest matching format will be applied.
                      </div>
                    )}
                    format={(value) => (!values.calcdex?.downloadUsageStats ? false : value)}
                    disabled={!values.calcdex?.downloadUsageStats}
                  />

                  <Field<ShowdexSettings['calcdex']['autoImportTeamSheets']>
                    name="calcdex.autoImportTeamSheets"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Auto-Import Team Sheets"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Imports &amp; applies sets to your opponent's (or spectating players') Pok&eacute;mon
                        derived from open team sheets (typical of VGC 2023 formats) or the !showteam chat command.
                        <br />
                        <br />
                        Note that open team sheets may omit spreads, i.e., the EVs, IVs &amp; nature.
                        In those cases, team sheets won't be converted into sets, but the provided info will be
                        marked as revealed, allowing spreads from other sets, such as from{' '}
                        <em>Showdown Usage</em>, to apply.
                      </div>
                    )}
                  />

                  {/* <Field<ShowdexSettings['calcdex']['autoExportOpponent']>
                    name="calcdex.autoExportOpponent"
                    component={Switch}
                    className={styles.field}
                    label="Auto-Export Opponent's Team"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        <em>
                          This is a planned feature.
                          <br />
                          Stay tuned!
                        </em>
                      </div>
                    )}
                    readOnly
                    format={() => false}
                  /> */}

                  <div className={styles.settingsGroupTitle}>
                    Interface
                  </div>

                  <Field<ShowdexSettings['calcdex']['authPosition']>
                    name="calcdex.authPosition"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      // !inBattle && styles.singleColumn,
                    )}
                    // label={`My Pok${eacute}mon's Location`}
                    label="My Location"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Top',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Your Pok&eacute;mon will always be located in the top half &amp;
                          your opponent's in the bottom half.
                        </div>
                      ),
                      value: 'top',
                    }, {
                      label: 'Bottom',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Your Pok&eacute;mon will always be located in the bottom half &amp;
                          your opponent's in the top half.
                        </div>
                      ),
                      value: 'bottom',
                    }, {
                      label: 'Auto',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          If you're <em>Player 1</em>,
                          your Pok&eacute;mon will be located in the top half,
                          otherwise, in the bottom half.
                          <br />
                          <br />
                          This is the default behavior if spectating.
                        </div>
                      ),
                      value: 'auto',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['defaultAutoSelect'], HTMLDivElement, ('auth' | 'player')[]>
                    name="calcdex.defaultAutoSelect"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      // !inBattle && styles.singleColumn,
                    )}
                    label={`Auto-Swap Pok${eacute}mon`}
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Mine',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Auto-swaps to your Pok&eacute;mon that's currently active on the field.
                          <br />
                          <br />
                          Disabling this does not prevent auto-selection from being re-enabled,
                          just initially disables the auto-selection until toggled on.
                        </div>
                      ),
                      value: 'auth',
                    }, {
                      label: 'Opponent',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Auto-swaps to your opponent's (or spectating players') Pok&eacute;mon that's
                          currently active on the field.
                          <br />
                          <br />
                          Disabling this does not prevent auto-selection from being re-enabled,
                          just initially disables the auto-selection until toggled on.
                        </div>
                      ),
                      value: 'player',
                    }]}
                    multi
                    unique
                    parse={(value) => ({
                      auth: !!value?.includes('auth'),
                      p1: !!value?.includes('player'),
                      p2: !!value?.includes('player'),
                      p3: !!value?.includes('player'),
                      p4: !!value?.includes('player'),
                    })}
                    format={(value) => ([
                      value?.auth && 'auth',
                      (value?.p1 || value?.p2 || value?.p3 || value?.p4) && 'player',
                    ].filter(Boolean) as ('auth' | 'player')[])}
                  />

                  <Field<ShowdexSettings['calcdex']['showPlayerRatings']>
                    name="calcdex.showPlayerRatings"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Show Players' Elo Ratings"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows each player's Elo rating, if available, by their username.
                      </div>
                    )}
                  />

                  {/* <Field<ShowdexSettings['calcdex']['reverseIconName']>
                    name="calcdex.reverseIconName"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Swap Icon/Name Behavior"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Swaps the behavior of the Pok&eacute;mon icon &amp; name when clicked on.
                        <br />
                        <br />
                        By default (off), clicking on the icon will open its Smogon page &amp;
                        clicking on the name will switch its forme, if any.
                      </div>
                    )}
                  /> */}

                  <Field<ShowdexSettings['calcdex']['openSmogonPage']>
                    name="calcdex.openSmogonPage"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Link to Smogon Dex Entries"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Opens the Pok&eacute;mon's Smogon Dex entry as a popup window when
                        the Pok&eacute;mon's icon is clicked on.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showNicknames']>
                    name="calcdex.showNicknames"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label={`Show Pok${eacute}mon Nicknames`}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows the Pok&eacute;mon's nickname, if any, instead of its forme.
                        <br />
                        <br />
                        ("but why tho?" &ndash;<em>camdawgboi</em>, 2022)
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['alwaysShowNonVolatile']>
                    name="calcdex.alwaysShowNonVolatile"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label={`Always Show Pok${eacute}mon Statuses`}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Always shows the Pok&eacute;mon's non-volatile status (e.g., BRN, PAR, SLP, etc.),
                        regardless if it has one. In those cases, the status will display "OK".
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['defaultAutoMoves'], HTMLInputElement, boolean>
                    name="calcdex.defaultAutoMoves"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Auto-Fill Revealed Moves"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Selects revealed moves of your opponent's (or spectating players') Pok&eacute;mon,
                        if not already selected from the applied set.
                      </div>
                    )}
                    parse={(value) => ({
                      auth: false,
                      p1: value,
                      p2: value,
                      p3: value,
                      p4: value,
                    })}
                    format={(value) => Object.values(value || {}).some((v) => !!v)}
                  />

                  <Field<ShowdexSettings['calcdex']['showNonDamageRanges']>
                    name="calcdex.showNonDamageRanges"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label={'Show "N/A" Damage Ranges'}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows damage ranges that are "N/A" or "IMMUNE", typical of status moves
                        or <em>Earthquake</em> against a Flying-type Pok&eacute;mon, for instance.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['lockGeneticsVisibility']['auth']>
                    name="calcdex.lockGeneticsVisibility.auth"
                    component={Segmented}
                    className={styles.field}
                    label={`Show My Pok${eacute}mon's`}
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Base',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your Pok&eacute;mon's base stats.
                          <br />
                          <br />
                          Disabling this will cause the base stats row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'base',
                      disabled: values.calcdex.showBaseStats === 'never',
                    }, {
                      labelStyle: { textTransform: 'none' },
                      label: 'IVs',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your Pok&eacute;mon's IVs.
                          Applies to DVs in legacy gens as well.
                          <br />
                          <br />
                          Disabling this will cause the IVs row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'iv',
                    }, {
                      labelStyle: { textTransform: 'none' },
                      label: 'EVs',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your Pok&eacute;mon's EVs.
                          Has no effect in legacy gens, unless <em>Show EVs in Legacy Gens</em> is enabled.
                          <br />
                          <br />
                          Disabling this will cause the EVs row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'ev',
                    }]}
                    multi
                    unique
                  />

                  <Field<ShowdexSettings['calcdex']['lockGeneticsVisibility'], HTMLDivElement, ShowdexSettings['calcdex']['lockGeneticsVisibility']['p1']>
                    name="calcdex.lockGeneticsVisibility"
                    component={Segmented}
                    className={styles.field}
                    label="Show Opponent's"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Base',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your opponent's (or spectating players') Pok&eacute;mon's base stats.
                          <br />
                          <br />
                          Disabling this will cause the base stats row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'base',
                      disabled: values.calcdex.showBaseStats === 'never',
                    }, {
                      labelStyle: { textTransform: 'none' },
                      label: 'IVs',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your opponent's (or spectating players') Pok&eacute;mon's IVs.
                          Applies to DVs in legacy gens as well.
                          <br />
                          <br />
                          Disabling this will cause the IVs row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'iv',
                    }, {
                      labelStyle: { textTransform: 'none' },
                      label: 'EVs',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always shows your opponent's (or spectating players') Pok&eacute;mon's EVs.
                          Has no effect in legacy gens, unless <em>Show EVs in Legacy Gens</em> is enabled.
                          <br />
                          <br />
                          Disabling this will cause the EVs row to remain hidden
                          until you click on <em>Show</em>.
                        </div>
                      ),
                      value: 'ev',
                    }]}
                    multi
                    unique
                    parse={(value) => ({
                      ...values.calcdex.lockGeneticsVisibility,
                      p1: value,
                      p2: value,
                      p3: value,
                      p4: value,
                    })}
                    format={(value) => [...(value?.p1 || [])]}
                  />

                  <Field<ShowdexSettings['calcdex'], HTMLDivElement, ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[]>
                    name="calcdex"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label="Show Tooltips"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'UI Info',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows explainer tooltips for buttons in the UI when hovered over.
                          <br />
                          <br />
                          Disable this if you're a Calcdex pro &amp; know what everything does already.
                        </div>
                      ),
                      value: 'ui',
                    }, {
                      label: 'Ability',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows a short description of the hovered ability in the dropdown list.
                        </div>
                      ),
                      value: 'ability',
                    }, {
                      label: 'Item',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows a short description of the hovered item in the dropdown list.
                        </div>
                      ),
                      value: 'item',
                    }, {
                      label: 'Move',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows a short description &amp; quick stats (e.g., type, category, BP)
                          of the hovered move in the dropdown list.
                        </div>
                      ),
                      value: 'move',
                    }, {
                      label: 'Matchup',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows a description of the move's matchup from the original
                          Damage Calculator when hovering over its damage range.
                        </div>
                      ),
                      value: 'matchup',
                      break: inBattle,
                    }, {
                      label: 'Field',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Shows short descriptions when hovering over screens, weather &amp; terrain
                          in the field section located in the middle.
                        </div>
                      ),
                      value: 'field',
                    }]}
                    multi
                    unique
                    parse={(value) => ({
                      ...values?.calcdex,
                      showUiTooltips: !!value?.includes('ui'),
                      showFieldTooltips: !!value?.includes('field'),
                      showAbilityTooltip: !!value?.includes('ability'),
                      showItemTooltip: !!value?.includes('item'),
                      showMoveTooltip: !!value?.includes('move'),
                      showMatchupTooltip: !!value?.includes('matchup'),
                    })}
                    format={(value) => ([
                      value?.showUiTooltips && 'ui',
                      value?.showFieldTooltips && 'field',
                      value?.showAbilityTooltip && 'ability',
                      value?.showItemTooltip && 'item',
                      value?.showMoveTooltip && 'move',
                      value?.showMatchupTooltip && 'matchup',
                    ].filter(Boolean) as ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[])}
                  />

                  <div className={styles.settingsGroupTitle}>
                    Matchups
                  </div>

                  <Field<ShowdexSettings['calcdex']['prettifyMatchupDescription']>
                    name="calcdex.prettifyMatchupDescription"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Prettify Matchup Description"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Makes the matchup description easier to quickly scan
                        by applying some gentle formatting &amp; spacing.
                      </div>
                    )}
                    format={(value) => (!values.calcdex?.showMatchupTooltip ? false : value)}
                    disabled={!values.calcdex?.showMatchupTooltip}
                  />

                  <Field<ShowdexSettings['calcdex']['copyMatchupDescription']>
                    name="calcdex.copyMatchupDescription"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Copy Matchup When Clicked"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Clicking on the damage range will copy the <em>unprettied</em> (if on)
                        matchup description to your clipboard.
                        <br />
                        <br />
                        Disable this if you like to highlight what you're reading on screen.
                      </div>
                    )}
                    format={(value) => (!values.calcdex?.showMatchupTooltip ? false : value)}
                    disabled={!values.calcdex?.showMatchupTooltip}
                  />

                  <Field<ShowdexSettings['calcdex']['showMatchupDamageAmounts']>
                    name="calcdex.showMatchupDamageAmounts"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      // !inBattle && styles.singleColumn,
                    )}
                    label="Show Damage Amounts"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Possible damage amounts will always be shown in the Matchup Tooltip.
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'NFE',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Possible damage amounts will only be shown against NFE{' '}
                          (Not Fully Evolved) Pok&eacute;mon in the Matchup Tooltip.
                        </div>
                      ),
                      value: 'nfe',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Possible damage amounts will never be shown in the Matchup Tooltip.
                        </div>
                      ),
                      value: 'never',
                    }]}
                    format={(value) => (!values.calcdex?.showMatchupTooltip ? 'never' : value)}
                    disabled={!values.calcdex?.showMatchupTooltip}
                  />

                  <Field<ShowdexSettings['calcdex']['formatMatchupDamageAmounts']>
                    name="calcdex.formatMatchupDamageAmounts"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Percentify Damage Amounts"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Combines the list of damage amounts into unique amounts with percentages.
                        <br />
                        <br />
                        If there are more than 5 unique damage amounts, no percentages will be shown
                        to avoid lengthy lists.
                      </div>
                    )}
                    format={(value) => (
                      !values.calcdex?.showMatchupTooltip
                        || values.calcdex?.showMatchupDamageAmounts === 'never'
                        ? false
                        : value
                    )}
                    disabled={(
                      !values.calcdex?.showMatchupTooltip
                        || values.calcdex?.showMatchupDamageAmounts === 'never'
                    )}
                  />

                  <div className={styles.settingsGroupTitle}>
                    Advanced
                  </div>

                  <Field<ShowdexSettings['calcdex']['editPokemonTypes']>
                    name="calcdex.editPokemonTypes"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      // !inBattle && styles.singleColumn,
                    )}
                    // label={`Editable Pok${eacute}mon Types`}
                    label="Edit Types"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always allow the Pok&eacute;mon's types to be edited when clicked on.
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'Meta',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Only allow the Pok&eacute;mon's types to be edited in nonstandard metagame
                          formats when clicked on.
                          <br />
                          <br />
                          <em>This option is not affiliated with Meta, the Social Metaverse Company.</em>
                        </div>
                      ),
                      value: 'meta',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never allow the Pok&eacute;mon's types to be edited.
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['showMoveEditor']>
                    name="calcdex.showMoveEditor"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      // !inBattle && styles.singleColumn,
                    )}
                    label="Edit Moves"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always show the <em>Edit</em> button in the Pok&eacute;mon's moves table.
                          <br />
                          <br />
                          You can edit the move's type, category (if damaging) &amp;
                          BP (including separate BPs for Z &amp; Max moves when activated).
                          Edits are unique to each move of the Pok&eacute;mon.
                          <br />
                          <br />
                          Additionally, if space permits, you can override the attacking stat (ATK/SPA)
                          &amp; the defending stat (DEF/SPD).
                          <br />
                          <br />
                          (Note: There's currently no setting to show stat overrides on smaller screens.)
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'Meta',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Only show the <em>Edit</em> button in nonstandard metagame formats.
                          <br />
                          <br />
                          Hover over the <strong>Always</strong> option to learn more about move editing.
                        </div>
                      ),
                      value: 'meta',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never show the <em>Edit</em> button in the Pok&eacute;mon's moves table.
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['allowIllegalSpreads']>
                    name="calcdex.allowIllegalSpreads"
                    component={Segmented}
                    className={styles.field}
                    label="Allow Illegal Spreads"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always allow illegal values for a Pok&eacute;mon's EVs/IVs.
                          <br />
                          <br />
                          This does not apply to DVs in legacy gens, where a limit of 15 will still be enforced.
                          <br />
                          <br />
                          Lowest possible EV/IV value is <strong>0</strong> &amp;
                          highest is arbitrarily set at <strong>999</strong>.
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'Meta',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Only allow illegal values for a Pok&eacute;mon's EVs/IVs in nonstandard metagame formats.
                          <br />
                          <br />
                          Hover over the <strong>Always</strong> option to learn more about illegal EV/IV values.
                        </div>
                      ),
                      value: 'meta',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never allow illegal values for a Pok&eacute;mon's EVs/IVs.
                          <br />
                          <br />
                          Lowest possible EV/IV value is <strong>0</strong> &amp;
                          highest is <strong>252</strong> for EVs &amp; <strong>31</strong> for IVs.
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['showBaseStats']>
                    name="calcdex.showBaseStats"
                    component={Segmented}
                    className={styles.field}
                    label="Edit Base Stats"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Always show the Pok&eacute;mon's base stats in its stats table,
                          allowing its values to be edited.
                          <br />
                          <br />
                          Lowest possible base stat value is <strong>1</strong> &amp;
                          highest is arbitrarily set at <strong>999</strong>.
                        </div>
                      ),
                      value: 'always',
                    }, {
                      label: 'Meta',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Only show the Pok&eacute;mon's base stats in nonstandard metagame formats.
                          <br />
                          <br />
                          Hover over the <strong>Always</strong> option to learn more about base stat editing.
                        </div>
                      ),
                      value: 'meta',
                    }, {
                      label: 'Never',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Never show the Pok&eacute;mon's base stats.
                        </div>
                      ),
                      value: 'never',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['resetDirtyBoosts']>
                    name="calcdex.resetDirtyBoosts"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Reset Stage Boosts on Sync"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Resets all modified stage boosts to the reported boosts in-battle
                        during a battle sync. This has the same effect as clicking on every
                        blue-colored stage boost value for each Pok&eacute;mon, except
                        performed automatically.
                        <br />
                        <br />
                        Enable this if you tend to forget to reset your Pok&eacute;mon's
                        stage boosts between turns.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showLegacyEvs']>
                    name="calcdex.showLegacyEvs"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Show EVs in Legacy Gens"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows EVs in legacy gens, allowing you to edit them for each Pok&eacute;mon.
                        <br />
                        <br />
                        Some sets (most notably in Randoms) will specify 0 EVs for some stats,
                        which may be helpful to be aware of.
                        <br />
                        <br />
                        Though introduced in gen 3, EVs technically existed in prior legacy gens,
                        colloquially referred to as <em>stat experience</em>. Resulting damages
                        influenced by this legacy system &amp; modern EVs are more-or-less the same,
                        due to rounding effects in the damage formulas.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['lockUsedTera']>
                    name="calcdex.lockUsedTera"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Lock Terastallization After Use"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Locks the <em>Tera</em> toggle button in the Moves table once used
                        by a player during a battle, preventing you from toggling
                        Terastallization for that player until the battle ends.
                        <br />
                        <br />
                        This may be helpful in remembering whether a player is still able
                        to Terastallize.
                        <br />
                        <br />
                        Has no effect in formats where Terastallization is unavailable or
                        in battles that have ended.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showAllOptions']>
                    name="calcdex.showAllOptions"
                    component={Switch}
                    className={cx(styles.field, styles.switchField)}
                    label="Show Illegal Abilities & Moves"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Allows you to select from all possible abilities &amp; moves in
                        legal-locked formats like{' '}
                        <em>OU</em> &amp; <em>Randoms</em>.
                      </div>
                    )}
                  />

                  <div
                    className={cx(
                      styles.field,
                      styles.customField,
                      !inBattle && styles.singleColumn,
                    )}
                  >
                    <div className={cx(styles.customFieldLabel, styles.bottom)}>
                      Guaranteed NHKO Labels
                    </div>

                    <div
                      className={cx(
                        styles.customFieldRow,
                        inBattle && styles.centered,
                      )}
                    >
                      {Array(4).fill(null).map((_, i) => (
                        <Field<ShowdexSettings['calcdex']['nhkoLabels'][typeof i]>
                          key={`SettingsPane:Field:TextField:nhkoLabel:${i}`}
                          name={`calcdex.nhkoLabels[${i}]`}
                          component={TextField}
                          className={cx(
                            styles.customFieldInput,
                            styles.textField,
                            styles.nhkoLabelField,
                          )}
                          style={[4, 7].includes(values.calcdex?.nhkoColors?.[i]?.length) ? {
                            color: values.calcdex.nhkoColors[i],
                          } : undefined}
                          inputClassName={styles.textFieldInput}
                          aria-label={`Custom Label for ${i + 1}HKO`}
                          hint={`${i + 1}HKO`}
                          tooltip={`${i + 1}HKO`}
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          maxLength={10}
                          // monospace={false}
                          parse={(value) => value?.replace(/[^A-Z 0-9]/i, '')}
                        />
                      ))}
                    </div>
                  </div>

                  <div
                    className={cx(
                      styles.field,
                      styles.customField,
                      !inBattle && styles.singleColumn,
                    )}
                  >
                    <div className={cx(styles.customFieldLabel, styles.bottom)}>
                      NHKO Hexadecimal Colors
                    </div>

                    <div
                      className={cx(
                        styles.customFieldRow,
                        inBattle && styles.centered,
                      )}
                    >
                      {Array(inBattle ? 3 : 5).fill(null).map((_, i) => (
                        <Field<ShowdexSettings['calcdex']['nhkoColors'][typeof i]>
                          key={`SettingsPane:Field:TextField:nhkoColor:${i}`}
                          name={`calcdex.nhkoColors[${i}]`}
                          component={TextField}
                          className={cx(
                            styles.customFieldInput,
                            styles.textField,
                            styles.nhkoColorField,
                          )}
                          style={[4, 7].includes(values.calcdex?.nhkoColors?.[i]?.length) ? {
                            color: values.calcdex.nhkoColors[i],
                          } : undefined}
                          inputClassName={styles.textFieldInput}
                          aria-label={`Custom Color for ${i === 4 ? '5+' : i + 1}HKO`}
                          hint={`${i === 4 ? '5+' : i + 1}HKO`}
                          tooltip={`${i === 4 ? '5+' : i + 1}HKO`}
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          maxLength={7}
                          parse={(value) => (
                            value?.startsWith('#')
                              ? value
                              : `#${value}`
                          ).toUpperCase().replace(/[^#0-9A-F]/g, '')}
                          format={(value) => value?.replace(/#/g, '').slice(0, 6)}
                        />
                      ))}
                    </div>

                    {/** @todo clean this up; use CSS for handling inBattle overflow instead of this dumb af copy paste */}
                    {
                      inBattle &&
                      <div className={cx(styles.customFieldRow, styles.centered)}>
                        {Array(2).fill(null).map((_, i) => (
                          <Field<ShowdexSettings['calcdex']['nhkoColors'][typeof i]>
                            key={`SettingsPane:Field:TextField:nhkoColor:${i + 3}`}
                            name={`calcdex.nhkoColors[${i + 3}]`}
                            component={TextField}
                            className={cx(
                              styles.customFieldInput,
                              styles.textField,
                              styles.nhkoColorField,
                            )}
                            style={[4, 7].includes(values.calcdex?.nhkoColors?.[i + 3]?.length) ? {
                              color: values.calcdex.nhkoColors[i + 3],
                            } : undefined}
                            inputClassName={styles.textFieldInput}
                            aria-label={`Custom Color for ${i === 0 ? '4' : '5+'}HKO`}
                            hint={`${i === 0 ? '4' : '5+'}HKO`}
                            tooltip={`${i === 0 ? '4' : '5+'}HKO`}
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            maxLength={7}
                            parse={(value) => (
                              value?.startsWith('#')
                                ? value
                                : `#${value}`
                            ).toUpperCase().replace(/[^#0-9A-F]/g, '')}
                            format={(value) => value?.replace(/#/g, '').slice(0, 6)}
                          />
                        ))}
                      </div>
                    }
                  </div>

                  {/* temporary spacer cause too lazy to do it in CSS lol */}
                  <div style={{ height: 5 }} />
                </div>
              </div>

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
