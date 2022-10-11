import * as React from 'react';
import Svg from 'react-inlinesvg';
import { Field, Form, FormSpy } from 'react-final-form';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { Segmented, Switch, TextField } from '@showdex/components/form';
import {
  Badge,
  BaseButton,
  Button,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { useColorScheme, useShowdexSettings, useUpdateSettings } from '@showdex/redux/store';
import { dispatchShowdexEvent, env, getResourceUrl } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { dehydrateShowdexSettings, hydrateShowdexSettings } from '@showdex/utils/redux';
import type { BadgeInstance, BaseButtonProps } from '@showdex/components/ui';
import type { ShowdexSettings } from '@showdex/redux/store';
import styles from './SettingsPane.module.scss';

export interface SettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  inBattle?: boolean;
  onRequestClose?: BaseButtonProps['onPress'];
}

const DehydratedRegex = /^v:\d+\.\d+\.\d+;[a-z]{1,3}:/;

const l = logger('@showdex/pages/Hellodex/SettingsPane');

export const SettingsPane = ({
  className,
  style,
  inBattle,
  onRequestClose,
}: SettingsPaneProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const settings = useShowdexSettings();
  const updateSettings = useUpdateSettings();

  const handleSettingsChange = (values: DeepPartial<ShowdexSettings>) => {
    // const {
    //   colorScheme: newColorScheme,
    // } = values || {};

    // if (newColorScheme && colorScheme !== newColorScheme) {
    //   // note: Storage is a native Web API (part of the Web Storage API), but Showdown redefines it with its own Storage() function
    //   // also, Dex.prefs() is an alias of Storage.prefs(), but w/o the `value` and `save` args
    //   (Storage as unknown as Showdown.ClientStorage)?.prefs?.('theme', newColorScheme, true);
    //
    //   // this is how Showdown natively applies the theme lmao
    //   // see: https://github.com/smogon/pokemon-showdown-client/blob/1ea5210a360b64ede48813d9572b59b7f3d7365f/js/client.js#L473
    //   $?.('html').toggleClass('dark', newColorScheme === 'dark');
    // }

    if (Object.keys(values || {}).length) {
      updateSettings(values);
    }
  };

  const importBadgeRef = React.useRef<BadgeInstance>(null);
  const importFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const [prevSettings, setPrevSettings] = React.useState<string>(null);
  const importUndoTimeout = React.useRef<NodeJS.Timeout>(null);

  const handleSettingsImport = () => {
    if (typeof navigator === 'undefined') {
      return;
    }

    void (async () => {
      l.debug(
        'Attempting to import settings from clipboard...',
        '\n', 'build-target', env('build-target'),
        // '\n', 'browser global available?', typeof browser !== 'undefined',
      );

      try {
        if (DehydratedRegex.test(prevSettings)) {
          const rehydratedPrev = hydrateShowdexSettings(prevSettings);

          if (importUndoTimeout.current) {
            clearTimeout(importUndoTimeout.current);
            importUndoTimeout.current = null;
          }

          updateSettings(rehydratedPrev);
          setPrevSettings(null);

          return;
        }

        const importedSettings = env('build-target') === 'firefox'
          // ? await (browser.runtime.sendMessage('clipboardReadText') as Promise<string>)
          ? await dispatchShowdexEvent<string>({ type: 'clipboardReadText' })
          : await navigator.clipboard.readText();

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

        const dehydratedCurrent = dehydrateShowdexSettings(settings);

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

        const hydratedSettings = hydrateShowdexSettings(importedSettings);

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
  };

  const exportBadgeRef = React.useRef<BadgeInstance>(null);
  const exportFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const handleSettingsExport = () => {
    if (typeof navigator === 'undefined') {
      return;
    }

    void (async () => {
      try {
        const dehydratedSettings = dehydrateShowdexSettings(settings);

        if (!DehydratedRegex.test(dehydratedSettings)) {
          l.debug(
            'Failed the dehydrated settings regex test!',
            '\n', 'dehydratedSettings', dehydratedSettings,
          );

          exportFailedBadgeRef.current?.show();

          return;
        }

        await navigator.clipboard.writeText(dehydratedSettings);
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
  };

  const defaultsBadgeRef = React.useRef<BadgeInstance>(null);
  const defaultsFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const handleSettingsDefaults = () => {
    if (typeof navigator === 'undefined') {
      return;
    }

    void (async () => {
      try {
        const hydratedDefaults = hydrateShowdexSettings();
        const dehydratedDefaults = dehydrateShowdexSettings(hydratedDefaults);

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
        touch="hold"
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
                          label="Exported"
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
                      onPress={handleSettingsDefaults}
                    />
                  }

                  <div className={styles.closePlaceholder} />
                </div>
              </div>

              <div className={styles.notice}>
                plz excuse the mess, this is a work in progress
                <br />
                <span className={styles.face}>
                  (｡◕‿◕｡)
                </span>
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
                      className={styles.field}
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
                    className={styles.field}
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
                    className={styles.field}
                    label="Show Chatrooms Panel"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Miss Showdown's chatrooms panel when it first opens?
                        <br />
                        <br />
                        This does not affect <em>Single Panel</em> users.
                      </div>
                    )}
                  />
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
                    label="Open When Battle Starts"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Always',
                      tooltip: 'Always open in all battles.',
                      value: 'always',
                    }, {
                      label: 'Playing',
                      tooltip: "Only open in battles you're playing.",
                      value: 'playing',
                    }, {
                      label: 'Spectating',
                      tooltip: "Only open in battles you're spectating.",
                      value: 'spectating',
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
                    label="Open As"
                    labelPosition={inBattle ? 'top' : 'left'}
                    options={[{
                      label: 'Auto',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Uses the <strong>Tabbed Panel</strong> if your Showdown's layout has{' '}
                          <em>Left-Right Panels</em> &amp; the{' '}
                          <strong>Battle Overlay</strong> if it has a <em>Single Panel</em>.
                          <br />
                          <br />
                          Hover over these options to learn more.
                        </div>
                      ),
                      value: 'showdown',
                    }, {
                      label: 'Tabbed Panel',
                      tooltip: (
                        <div className={styles.tooltipContent}>
                          Opens as a tabbed panel on the right, if space permits.
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
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['closeOnEnd']>
                    name="calcdex.closeOnEnd"
                    component={Switch}
                    className={styles.field}
                    label="Close Tab When Battle Ends"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Closes the tab once the battle ends.
                        <br />
                        <br />
                        Unless <em>Clear Memory After Tab Closes</em> is on,
                        the closed tab can be reopened from the Hellodex tab.
                        <br />
                        <br />
                        This does not affect Calcdexes that <em>Open As</em> a{' '}
                        <strong>Battle Overlay</strong> as they are embedded into the battle.
                      </div>
                    )}
                    format={(value) => (values.calcdex?.openAs === 'overlay' ? false : value)}
                    disabled={values.calcdex?.openAs === 'overlay'}
                  />

                  <Field<ShowdexSettings['calcdex']['destroyOnClose']>
                    name="calcdex.destroyOnClose"
                    component={Switch}
                    className={styles.field}
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
                        This does not affect Calcdexes that <em>Open As</em> a{' '}
                        <strong>Battle Overlay</strong> as their memory is cleared as soon as
                        the battle's tab is closed.
                      </div>
                    )}
                    format={(value) => (values.calcdex?.openAs === 'overlay' ? false : value)}
                    disabled={values.calcdex?.openAs === 'overlay'}
                  />

                  <Field<ShowdexSettings['calcdex']['preserveRenderStates']>
                    name="calcdex.preserveRenderStates"
                    component={Switch}
                    className={styles.field}
                    label="Enable Fast Overlay Toggling"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Preserves the UI when closing the overlayed Calcdex,
                        allowing it to show instantaneously when reopened,
                        at the expense of <em>slightly</em> increased memory usage.
                        <br />
                        <br />
                        Disabling this may improve performance on lower-spec machines,
                        but may cause slight delays when opening.
                        <br />
                        <br />
                        This does not affect Calcdexes that <em>Open As</em> a{' '}
                        <strong>Tabbed Panel</strong> as they separately appear in their own panel.
                      </div>
                    )}
                    format={(value) => (values.calcdex?.openAs === 'panel' ? false : value)}
                    disabled={values.calcdex?.openAs === 'panel'}
                  />

                  <div className={styles.settingsGroupTitle}>
                    Sets
                  </div>

                  <Field<ShowdexSettings['calcdex']['downloadSmogonPresets']>
                    name="calcdex.downloadSmogonPresets"
                    component={Switch}
                    className={styles.field}
                    label="Download Smogon Sets"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Downloads freshly updated sets in non-Randoms formats.
                        All sets from all available formats in the gen will be downloaded once
                        per Showdown session.
                        <br />
                        <br />
                        Disabling this may improve performance on lower-spec machines.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['downloadRandomsPresets']>
                    name="calcdex.downloadRandomsPresets"
                    component={Switch}
                    className={styles.field}
                    label="Download Randoms Sets"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Downloads freshly updated special sets in Randoms only,
                        which includes all the pools you can already find on
                        the original Damage Calculator.
                        <br />
                        <br />
                        Disabling this may <em>slightly</em> improve performance on lower-spec machines.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['downloadUsageStats']>
                    name="calcdex.downloadUsageStats"
                    component={Switch}
                    className={styles.field}
                    label="Download Showdown Usage Sets"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Downloads freshly updated Showdown Usage stats, which will be converted
                        into a set called <em>Showdown Usage</em>, in non-Randoms formats.
                        <br />
                        <br />
                        Disabling this may <em>slightly</em> improve performance on lower-spec machines.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['prioritizeUsageStats']>
                    name="calcdex.prioritizeUsageStats"
                    component={Switch}
                    className={styles.field}
                    label="Apply Showdown Usage Sets First"
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

                  <Field<ShowdexSettings['calcdex']['includeTeambuilder']>
                    name="calcdex.includeTeambuilder"
                    component={Switch}
                    className={styles.field}
                    label="Include Teambuilder Sets"
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
                  />

                  <Field<ShowdexSettings['calcdex']['autoExportOpponent']>
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
                  />

                  <div className={styles.settingsGroupTitle}>
                    Interface
                  </div>

                  <Field<ShowdexSettings['calcdex']['authPosition']>
                    name="calcdex.authPosition"
                    component={Segmented}
                    className={cx(
                      styles.field,
                      !inBattle && styles.singleColumn,
                    )}
                    label={`Your Pok${eacute}mon's Location`}
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
                          (You'll typically be <em>Player 1</em>, unless challenged by someone.)
                          <br />
                          <br />
                          This is the default behavior if spectating.
                        </div>
                      ),
                      value: 'auto',
                    }]}
                  />

                  <Field<ShowdexSettings['calcdex']['defaultShowGenetics']['auth']>
                    name="calcdex.defaultShowGenetics.auth"
                    component={Switch}
                    className={styles.field}
                    label={`Show My Pok${eacute}mon's EVs/IVs`}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows your Pok&eacute;mon's EVs &amp; IVs/DVs underneath its moves,
                        until you click on <em>Hide</em>,
                        applied on a <em>per-Pok&eacute;mon</em> basis.
                        <br />
                        <br />
                        However, if your Pok&eacute;mon's spread couldn't be found,
                        the EVs &amp; IVs will be shown regardless of this setting.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['defaultShowGenetics'], HTMLInputElement, boolean>
                    name="calcdex.defaultShowGenetics"
                    component={Switch}
                    className={styles.field}
                    label="Show Opponent's EVs/IVs"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows your opponent's (or spectating players') Pok&eacute;mon's
                        EVs &amp; IVs/DVs underneath its moves, until you click on <em>Hide</em>,
                        applied on a <em>per-Pok&eacute;mon</em> basis.
                        <br />
                        <br />
                        However, if their Pok&eacute;mon's spread couldn't be found,
                        the EVs &amp; IVs will be shown regardless of this setting.
                      </div>
                    )}
                    parse={(value) => ({
                      auth: values?.calcdex?.defaultShowGenetics?.auth,
                      p1: value,
                      p2: value,
                      p3: value,
                      p4: value,
                    })}
                    format={(value) => Object.entries(value || {}).some(([k, v]) => k !== 'auth' && !!v)}
                  />

                  <Field<ShowdexSettings['calcdex']['showPlayerRatings']>
                    name="calcdex.showPlayerRatings"
                    component={Switch}
                    className={styles.field}
                    label="Show Players' ELO Ratings"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows each player's ELO rating, if available, underneath their username.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showNicknames']>
                    name="calcdex.showNicknames"
                    component={Switch}
                    className={styles.field}
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

                  <Field<ShowdexSettings['calcdex']['reverseIconName']>
                    name="calcdex.reverseIconName"
                    component={Switch}
                    className={styles.field}
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
                  />

                  <Field<ShowdexSettings['calcdex']['showAllFormes']>
                    name="calcdex.showAllFormes"
                    component={Switch}
                    className={styles.field}
                    label="Cycle All Possible Formes"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        When switching a Pok&eacute;mon's forme
                        (depending on <em>Swap Icon/Name Behavior</em>),
                        all possible formes will be cycled through,
                        even if its current, non-base forme is revealed.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showAllOptions']>
                    name="calcdex.showAllOptions"
                    component={Switch}
                    className={styles.field}
                    label="Show Illegal Abilities & Moves"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Allows you to select from all possible abilities &amp; moves in
                        legal-locked formats like{' '}
                        <em>OU</em> &amp; <em>Randoms</em>.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['defaultAutoMoves'], HTMLInputElement, boolean>
                    name="calcdex.defaultAutoMoves"
                    component={Switch}
                    className={styles.field}
                    label="Auto-Fill Revealed Moves"
                    // tooltip={(
                    //   <div className={styles.tooltipContent}>
                    //     Selects revealed moves of your opponent's
                    //     (or spectating players') Pok&eacute;mon,
                    //     if not already selected from the applied set.
                    //   </div>
                    // )}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        <em>This is a planned feature.</em>
                        <br />
                        <em>Stay tuned!</em>
                      </div>
                    )}
                    readOnly
                    parse={(value) => ({
                      auth: false,
                      p1: value,
                      p2: value,
                      p3: value,
                      p4: value,
                    })}
                    // format={(value) => Object.values(value || {}).some((v) => !!v)}
                    format={() => false}
                  />

                  <Field<ShowdexSettings['calcdex']['showNonDamageRanges']>
                    name="calcdex.showNonDamageRanges"
                    component={Switch}
                    className={styles.field}
                    label={'Show "N/A" Damage Ranges'}
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows damage ranges that are "N/A", which are typical of status moves.
                        <br />
                        <br />
                        Disabling this will prevent the Matchup Tooltip from showing (if on).
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

                    <div className={styles.customFieldRow}>
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
                          key={`SettingsPane:Field:TextField:nhkoLabel:${i}`}
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

                    {
                      inBattle &&
                      <div className={cx(styles.customFieldRow, styles.centered)}>
                        {Array(2).fill(null).map((_, i) => (
                          <Field<ShowdexSettings['calcdex']['nhkoColors'][typeof i]>
                            key={`SettingsPane:Field:TextField:nhkoLabel:${i + 3}`}
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

                  <div className={styles.settingsGroupTitle}>
                    Tooltips
                  </div>

                  <Field<ShowdexSettings['calcdex']['showFieldTooltips']>
                    name="calcdex.showFieldTooltips"
                    component={Switch}
                    className={styles.field}
                    label="Show Field Tooltips"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows short descriptions when hovering over screens, weather &amp; terrain
                        in the field section located in the middle.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showAbilityTooltip']>
                    name="calcdex.showAbilityTooltip"
                    component={Switch}
                    className={styles.field}
                    label="Show Ability Tooltip"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows a short description of the hovered ability in the dropdown list.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showItemTooltip']>
                    name="calcdex.showItemTooltip"
                    component={Switch}
                    className={styles.field}
                    label="Show Item Tooltip"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows a short description of the hovered item in the dropdown list.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showMoveTooltip']>
                    name="calcdex.showMoveTooltip"
                    component={Switch}
                    className={styles.field}
                    label="Show Move Tooltip"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows a short description &amp; quick stats (e.g., type, category, BP)
                        of the hovered move in the dropdown list.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['showMatchupTooltip']>
                    name="calcdex.showMatchupTooltip"
                    component={Switch}
                    className={styles.field}
                    label="Show Matchup Tooltip"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Shows a description of the move's matchup from the original
                        Damage Calculator when hovering over its damage range.
                      </div>
                    )}
                  />

                  <Field<ShowdexSettings['calcdex']['prettifyMatchupDescription']>
                    name="calcdex.prettifyMatchupDescription"
                    component={Switch}
                    className={styles.field}
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
                    className={styles.field}
                    label="Copy Matchup When Clicked"
                    tooltip={(
                      <div className={styles.tooltipContent}>
                        Clicking on the damage range will copy the <em>unprettied</em> (if on)
                        matchup description to your clipboard.
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
                      !inBattle && styles.singleColumn,
                    )}
                    label="Show Possible Damage Amounts"
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
                          Possible damage amounts will only be shown against <em>NFE</em>{' '}
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
                </div>
              </div>
            </form>
          )}
        </Form>
      </Scrollable>
    </div>
  );
};
