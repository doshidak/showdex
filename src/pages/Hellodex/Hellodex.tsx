/**
 * @file `Hellodex.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.3
 */

import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { GradientButton } from '@showdex/components/app';
import { BuildInfo } from '@showdex/components/debug';
import { PageContainer, useSandwich } from '@showdex/components/layout';
import {
  BaseButton,
  Button,
  ContextMenu,
  Scrollable,
  useContextMenu,
} from '@showdex/components/ui';
import {
  useAuthUsername,
  useBattleRecord,
  useBattleRecordReset,
  useCalcdexDuplicator,
  useCalcdexSettings,
  useCalcdexState,
  useColorTheme,
  useHellodexSettings,
  useHellodexState,
  useHonkdexSettings,
  useNotedexDuplicator,
  useNotedexState,
  useUpdateSettings,
} from '@showdex/redux/store';
import { usePlayerTitle } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { useRandomUuid, useRoomNavigation } from '@showdex/utils/hooks';
import { BattleRecord } from './BattleRecord';
import { FooterButton } from './FooterButton';
import {
  type InstanceButtonRef,
  type NoteInstanceButtonRef,
  InstanceButton,
  NoteInstanceButton,
} from './InstanceButton';
import { PatronagePane } from './PatronagePane';
import { SettingsPane } from './SettingsPane';
import { useHellodexSize } from './useHellodexSize';
import styles from './Hellodex.module.scss';

export interface HellodexProps {
  onUserPopup?: (username: string) => void;
  onRequestBattles?: () => void;
  onRequestCalcdex?: (battleId: string) => void;
  onRequestHonkdex?: (instanceId?: string) => void;
  onRequestNotedex?: (instanceId?: string) => void;
  onCloseCalcdex?: (battleId: string) => void;
  onRemoveHonkdex?: (instanceId: string) => void;
  onRemoveNotedex?: (instanceId: string) => void;
}

const packageVersion = `v${env('package-version', 'X.X.X')}`;
const versionSuffix = env('package-version-suffix');
const __TEST__ = versionSuffix?.startsWith('test.');
const buildDate = env('build-date');
const buildSuffix = env('build-suffix');
const forumUrl = env('hellodex-forum-url');
const repoUrl = env('hellodex-repo-url');
const communityUrl = env('hellodex-community-url');
const notedexEnabled = env.bool('notedex-enabled');

const l = logger('@showdex/pages/Hellodex');

export const Hellodex = ({
  onUserPopup,
  onRequestBattles,
  onRequestCalcdex,
  onRequestHonkdex,
  onRequestNotedex,
  onCloseCalcdex,
  onRemoveHonkdex,
  onRemoveNotedex,
}: HellodexProps): React.JSX.Element => {
  const { t } = useTranslation('hellodex');
  const contentRef = React.useRef<HTMLDivElement>(null);
  const instanceRefs = React.useRef<Record<string, InstanceButtonRef>>({});
  const noteInstanceRefs = React.useRef<Record<string, NoteInstanceButtonRef>>({});

  useHellodexSize(contentRef);

  // globally listen for left/right key presses to mimic native keyboard navigation behaviors
  // (only needs to be loaded once and seems to persist even after closing the Hellodex tab)
  useRoomNavigation();

  const rand = React.useRef(Math.random());
  const colorTheme = useColorTheme();
  const settings = useHellodexSettings();
  const calcdexSettings = useCalcdexSettings();
  const honkdexSettings = useHonkdexSettings();
  const updateSettings = useUpdateSettings();

  const authName = useAuthUsername();
  const authTitle = usePlayerTitle(authName, { showdownUser: true });

  const state = useHellodexState();
  const calcdexState = useCalcdexState();
  const notedexState = useNotedexState();
  const neverOpens = calcdexSettings?.openOnStart === 'never';

  const smolContainer = React.useMemo(
    () => ['xs', 'sm'].includes(state?.containerSize),
    [state?.containerSize],
  );

  const instances = React.useMemo(() => Object.values(calcdexState).reverse().filter((b) => (
    !!b?.battleId
      && (b.operatingMode === 'battle' || honkdexSettings?.visuallyEnabled)
  )), [
    calcdexState,
    honkdexSettings?.visuallyEnabled,
  ]);

  const noteInstances = React.useMemo(() => (
    notedexEnabled
      ? Object.values(notedexState?.notes || {})
        .reverse()
        .filter((n) => !!n?.id)
      : []
  ), [
    notedexState?.notes,
  ]);

  const instancesEmpty = !instances.length && !noteInstances.length;
  const showDonateButton = settings?.showDonateButton;

  const battleRecord = useBattleRecord();
  const resetBattleRecord = useBattleRecordReset();
  const dupeCalcdex = useCalcdexDuplicator();
  const dupeNotedex = useNotedexDuplicator();

  // pane visibilities
  const {
    active: patronageVisible,
    requestOpen: openPatronagePane,
    notifyClose: closePatronagePane,
  } = useSandwich();

  const {
    active: settingsVisible,
    requestOpen: openSettingsPane,
    notifyClose: closeSettingsPane,
  } = useSandwich();

  const toggleSettingsPane = settingsVisible ? closeSettingsPane : openSettingsPane;

  const {
    show: showContextMenu,
    // hideAll: hideContextMenus,
    hideAfter,
  } = useContextMenu();

  const contextMenuId = useRandomUuid();
  const paneMenuId = useRandomUuid();
  const calcdexMenuId = useRandomUuid();
  const honkdexMenuId = useRandomUuid();
  const notedexMenuId = useRandomUuid();
  const recordMenuId = useRandomUuid();

  return (
    <PageContainer
      contentRef={contentRef}
      name="hellodex"
      contentClassName={cx(
        styles.content,
        smolContainer && styles.smol,
        state.containerSize === 'xs' && styles.verySmol,
      )}
      prefix={<BuildInfo position="top-right" />}
      onContextMenu={(e) => void showContextMenu({
        event: e,
        id: patronageVisible || settingsVisible ? paneMenuId : contextMenuId,
      })}
    >
      {
        patronageVisible &&
        <PatronagePane
          onUserPopup={onUserPopup}
          onRequestClose={closePatronagePane}
        />
      }

      {
        settingsVisible &&
        <SettingsPane
          onRequestClose={closeSettingsPane}
        />
      }

      {colorTheme === 'mina' ? (
        <Svg
          className={cx(
            styles.showdexIcon,
            styles.minarexIcon,
            rand.current > 0.5 && styles.shady,
          )}
          description="Minarex Icon"
          src={getResourceUrl('minarex.svg')}
        />
      ) : (
        <Svg
          className={styles.showdexIcon}
          description="Showdex Icon"
          src={getResourceUrl('showdex.svg')}
        />
      )}

      <div className={styles.topContent}>
        <div className={styles.banner}>
          <Trans
            t={t}
            i18nKey="header.title"
            parent="div"
            className={styles.authors}
            shouldUnescape
            components={{
              and: <div className={styles.ampersand} />,
              keith: (
                <Button
                  className={styles.authorButton}
                  labelClassName={styles.label}
                  label="BOT Keith"
                  hoverScale={1}
                  absoluteHover
                  disabled={typeof onUserPopup !== 'function'}
                  onPress={() => void onUserPopup?.(__DEV__ || __TEST__ ? 'showdex_testee' : 'sumfuk')}
                />
              ),
              cameron: (
                <Button
                  className={styles.authorButton}
                  labelClassName={styles.label}
                  label="analogcam"
                  hoverScale={1}
                  absoluteHover
                  disabled={typeof onUserPopup !== 'function'}
                  onPress={() => void onUserPopup?.(__DEV__ || __TEST__ ? 'showdex_tester' : 'camdawgboi')}
                />
              ),
            }}
          />

          <Trans
            t={t}
            i18nKey="header.subtitle"
            parent="div"
            className={styles.presents}
            shouldUnescape
          />

          {/* besides BuildInfo's, this is the only other visually hardcoded "Showdex" not affected by i18n */}
          <div className={styles.extensionName}>
            Showdex
          </div>

          <div className={styles.extensionVersion}>
            {packageVersion}

            <span className={styles.extensionVersionSuffix}>
              {!!versionSuffix && `-${versionSuffix}`}
              {__DEV__ && !!buildDate && `-b${buildDate.slice(-4)}`}
              {!!buildSuffix && `-${buildSuffix}`}
              {__DEV__ && '-dev'}
            </span>
          </div>
        </div>

        <div className={styles.instancesContainer}>
          <div
            className={cx(
              styles.instancesContent,
              !showDonateButton && styles.hiddenDonation,
            )}
          >
            {instancesEmpty ? (
              <div className={styles.empty}>
                <Svg
                  className={styles.emptyIcon}
                  description={neverOpens ? 'Error Circle Icon' : 'Info Circle Icon'}
                  src={getResourceUrl(neverOpens ? 'error-circle.svg' : 'info-circle.svg')}
                />

                <div className={styles.emptyLabel}>
                  <Trans
                    t={t}
                    i18nKey={'instances.empty.' + (
                      (neverOpens && 'openNever')
                        || (calcdexSettings?.openOnStart === 'playing' && 'openPlaying')
                        || (calcdexSettings?.openOnStart === 'spectating' && 'openSpectating')
                        || 'openAlways'
                    )}
                    shouldUnescape
                    components={{
                      settings: (
                        <Button
                          className={styles.spectateButton}
                          labelClassName={styles.spectateButtonLabel}
                          aria-label={t('instances.empty.settingsTooltip')}
                          tooltip={t('instances.empty.settingsTooltip')}
                          hoverScale={1}
                          absoluteHover
                          onPress={openSettingsPane}
                        />
                      ),
                      spectate: (
                        <Button
                          className={cx(
                            styles.spectateButton,
                            typeof onRequestBattles !== 'function' && styles.disabled,
                          )}
                          labelClassName={styles.spectateButtonLabel}
                          aria-label={t('instances.empty.spectateTooltip')}
                          tooltip={t('instances.empty.spectateTooltip')}
                          hoverScale={1}
                          absoluteHover
                          disabled={typeof onRequestBattles !== 'function'}
                          onPress={() => void onRequestBattles?.()}
                        />
                      ),
                    }}
                  />
                </div>

                {
                  honkdexSettings?.visuallyEnabled &&
                  <>
                    <div className={styles.divider}>
                      <div className={styles.dividerLine} />
                      <div className={styles.dividerLabel}>
                        <Trans
                          t={t}
                          i18nKey="instances.honkdex.orSeparator"
                          shouldUnescape
                        />
                      </div>
                      <div className={styles.dividerLine} />
                    </div>

                    <GradientButton
                      className={styles.honkButton}
                      aria-label={t('instances.honkdex.newAria')}
                      hoverScale={1}
                      onPress={() => onRequestHonkdex?.()}
                    >
                      <Trans
                        t={t}
                        i18nKey="instances.honkdex.newLabel.0"
                        shouldUnescape
                      />
                      <i
                        className="fa fa-car"
                        style={{ padding: '0 8px' }}
                      />
                      <Trans
                        t={t}
                        i18nKey="instances.honkdex.newLabel.1"
                        shouldUnescape
                      />
                    </GradientButton>
                  </>
                }
              </div>
            ) : (
              <Scrollable className={styles.scrollableInstances}>
                <div className={styles.instances}>
                  {instances.map((instance) => (
                    <InstanceButton
                      ref={(r) => { instanceRefs.current[instance.battleId] = r; }}
                      key={`Hellodex:InstanceButton:${instance.battleId}`}
                      className={styles.instanceButton}
                      instance={instance}
                      authName={authName}
                      onPress={() => void (
                        instance.operatingMode === 'standalone'
                          ? onRequestHonkdex
                          : onRequestCalcdex
                      )?.(instance.battleId)}
                      onRequestRemove={() => void onRemoveHonkdex?.(instance.battleId)}
                      onContextMenu={(e) => {
                        showContextMenu({
                          id: instance.operatingMode === 'battle' ? calcdexMenuId : honkdexMenuId,
                          event: e,
                          props: { instanceId: instance.battleId },
                        });

                        e.stopPropagation();
                      }}
                    />
                  ))}

                  {noteInstances.map((instance) => (
                    <NoteInstanceButton
                      ref={(r) => { noteInstanceRefs.current[instance.id] = r; }}
                      key={`Hellodex:NoteInstanceButton:${instance.id}`}
                      className={styles.instanceButton}
                      instance={instance}
                      onPress={() => void onRequestNotedex?.(instance.id)}
                      onRequestRemove={() => void onRemoveNotedex?.(instance.id)}
                      onContextMenu={(e) => {
                        showContextMenu({
                          id: notedexMenuId,
                          event: e,
                          props: { instanceId: instance.id },
                        });

                        e.stopPropagation();
                      }}
                    />
                  ))}

                  {
                    honkdexSettings?.visuallyEnabled &&
                    <GradientButton
                      className={cx(
                        styles.instanceButton,
                        styles.newInstanceButton,
                        notedexEnabled && styles.smolSplit,
                      )}
                      display="block"
                      aria-label={t('instances.honkdex.newAria')}
                      hoverScale={1}
                      onPress={() => void onRequestHonkdex()}
                    >
                      <i
                        className="fa fa-plus"
                        style={{ fontSize: 10, lineHeight: 11 }}
                      />
                      <i className="fa fa-car" />
                      <Trans
                        t={t}
                        i18nKey="instances.honkdex.newLabel.1"
                        shouldUnescape
                      />
                    </GradientButton>
                  }

                  {
                    notedexEnabled &&
                    <GradientButton
                      className={cx(
                        styles.instanceButton,
                        styles.newInstanceButton,
                        honkdexSettings?.visuallyEnabled && styles.smolSplit,
                      )}
                      display="block"
                      aria-label={t('instances.notedex.newAria')}
                      hoverScale={1}
                      onPress={() => void onRequestNotedex()}
                    >
                      <i
                        className="fa fa-plus"
                        style={{ fontSize: 10, lineHeight: 11 }}
                      />
                      <i className="fa fa-sticky-note" />
                      <Trans
                        t={t}
                        i18nKey="instances.notedex.newLabel"
                        shouldUnescape
                      />
                    </GradientButton>
                  }

                  {
                    settings?.showBattleRecord &&
                    <div className={styles.battleRecordSpacer} />
                  }
                </div>
              </Scrollable>
            )}
          </div>

          {
            settings?.showBattleRecord &&
            <BattleRecord
              className={styles.battleRecord}
              onContextMenu={(e) => {
                showContextMenu({ id: recordMenuId, event: e });
                e.stopPropagation();
              }}
            />
          }
        </div>

        {
          showDonateButton &&
          <div
            className={cx(
              styles.donations,
              settings?.showBattleRecord && styles.withBattleRecord,
            )}
          >
            <GradientButton
              className={styles.donateButton}
              aria-label={t('donate.aria')}
              onPress={openPatronagePane}
            >
              {authTitle?.title ? (
                <i
                  className="fa fa-heart"
                  style={{ padding: '0 8px' }}
                />
              ) : (
                <Trans
                  t={t}
                  i18nKey="donate.label"
                  shouldUnescape
                />
              )}
            </GradientButton>

            <div
              className={cx(
                styles.donateFootnote,
                !!authTitle?.title && styles.withTitle,
              )}
            >
              <Trans
                t={t}
                i18nKey={`donate.footnote.${authTitle?.title ? 'supporter' : 'default'}`}
                shouldUnescape
              />
            </div>
          </div>
        }
      </div>

      <div className={styles.footer}>
        <div
          className={cx(
            styles.links,
            settingsVisible && styles.settingsVisible,
          )}
        >
          <FooterButton
            className={cx(styles.linkItem, styles.settingsButton)}
            labelClassName={styles.linkButtonLabel}
            iconAsset={settingsVisible ? 'close-circle.svg' : 'cog.svg'}
            iconDescription={settingsVisible ? 'Close Circle Icon' : 'Cog Icon'}
            label={t(`footer.settings.${settingsVisible ? 'closeLabel' : 'openLabel'}`)}
            aria-label={t(`footer.settings.${settingsVisible ? 'closeTooltip' : 'openTooltip'}`)}
            tooltip={t(`footer.settings.${settingsVisible ? 'closeTooltip' : 'openTooltip'}`)}
            onPress={toggleSettingsPane}
          />

          {
            honkdexSettings?.visuallyEnabled &&
            <FooterButton
              className={cx(styles.linkItem, styles.linkButton, styles.newInstanceButton)}
              labelClassName={styles.linkButtonLabel}
              iconAsset="fa-car"
              label={t('footer.newHonkdex.label')}
              aria-label={t('footer.newHonkdex.tooltip')}
              tooltip={t('footer.newHonkdex.tooltip')}
              onPress={() => void onRequestHonkdex()}
            />
          }

          {
            notedexEnabled &&
            <FooterButton
              className={cx(styles.linkItem, styles.linkButton, styles.newInstanceButton)}
              labelClassName={styles.linkButtonLabel}
              iconAsset="fa-sticky-note"
              label={t('footer.newNotedex.label')}
              aria-label={t('footer.newNotedex.tooltip')}
              tooltip={t('footer.newNotedex.tooltip')}
              onPress={() => void onRequestNotedex()}
            />
          }

          {
            state?.containerSize !== 'xs' &&
            <>
              {/*
                (forumUrl || repoUrl || communityUrl).startsWith('https://') &&
                <div
                  className={cx(
                    styles.linkItem,
                    styles.linkSeparator,
                  )}
                />
              */}

              {
                forumUrl?.startsWith('https://') &&
                <FooterButton
                  className={cx(styles.linkItem, styles.linkButton)}
                  iconClassName={styles.signpostIcon}
                  labelClassName={styles.linkButtonLabel}
                  iconAsset="signpost.svg"
                  iconDescription="Signpost Icon"
                  label={t('footer.smogon.label')}
                  aria-label={t('footer.smogon.tooltip')}
                  tooltip={t('footer.smogon.tooltip')}
                  onPress={() => window.open(forumUrl, '_blank', 'noopener,noreferrer')}
                />
              }

              {
                repoUrl?.startsWith('https://') &&
                <FooterButton
                  className={cx(styles.linkItem, styles.linkButton)}
                  labelClassName={styles.linkButtonLabel}
                  iconAsset="github-face.svg"
                  iconDescription="GitHub Octocat Icon"
                  label={t('footer.github.label')}
                  aria-label={t('footer.github.tooltip')}
                  tooltip={t('footer.github.tooltip')}
                  onPress={() => window.open(repoUrl, '_blank', 'noopener,noreferrer')}
                />
              }

              {
                communityUrl?.startsWith('https://') &&
                <FooterButton
                  className={cx(styles.linkItem, styles.linkButton)}
                  labelClassName={styles.linkButtonLabel}
                  iconAsset="discord.svg"
                  iconDescription="Discord Clyde Icon"
                  label={t('footer.discord.label')}
                  aria-label={t('footer.discord.tooltip')}
                  tooltip={t('footer.discord.tooltip')}
                  onPress={() => window.open(communityUrl, '_blank', 'noopener,noreferrer')}
                />
              }
            </>
          }
        </div>

        <BaseButton
          className={cx(styles.tizeButton, styles.hideWhenSmol)}
          aria-label="Tize.io"
          onPress={() => window.open('https://tize.io', '_blank')}
        >
          <Svg
            className={styles.tizeLogo}
            description="Tize.io Logo"
            src={getResourceUrl('tize.svg')}
          />
        </BaseButton>

        <div className={cx(styles.credits, styles.hideWhenSmol)}>
          <Trans
            t={t}
            i18nKey="footer.created"
            shouldUnescape
            components={{ love: <i className="fa fa-heart" /> }}
          />
          <br />
          BOT Keith &amp; analogcam
        </div>
      </div>

      <ContextMenu
        id={contextMenuId}
        itemKeyPrefix="Hellodex:ContextMenu"
        items={[
          {
            key: 'new-honk',
            entity: 'item',
            props: {
              label: t('contextMenu.newHonk', 'New Honk'),
              icon: 'fa-car',
              hidden: !honkdexSettings?.visuallyEnabled,
              onPress: hideAfter(onRequestHonkdex),
            },
          },
          {
            key: 'new-note',
            entity: 'item',
            props: {
              label: t('contextMenu.newNote', 'New Note'),
              icon: 'fa-sticky-note',
              hidden: !notedexEnabled,
              onPress: hideAfter(onRequestNotedex),
            },
          },
          {
            key: 'new-hr',
            entity: 'separator',
            props: { hidden: !honkdexSettings?.visuallyEnabled && !notedexEnabled },
          },
          {
            key: 'spectate-battles',
            entity: 'item',
            props: {
              label: t('contextMenu.spectate', 'Spectate Battles'),
              icon: 'sword',
              iconStyle: { transform: 'scale(1.15)' },
              disabled: typeof onRequestBattles !== 'function',
              onPress: hideAfter(() => void onRequestBattles?.()),
            },
          },
          {
            key: 'settings-hr',
            entity: 'separator',
          },
          {
            key: 'open-settings',
            entity: 'item',
            props: {
              theme: 'default',
              label: t('contextMenu.settings', 'Settings'),
              icon: 'cog',
              iconStyle: { transform: 'scale(1.25)' },
              onPress: hideAfter(toggleSettingsPane),
            },
          },
        ]}
      />

      <ContextMenu
        id={paneMenuId}
        itemKeyPrefix="Hellodex:ContextMenu:Pane"
        items={[
          {
            key: 'close-pane',
            entity: 'item',
            props: {
              theme: 'info',
              label: t('contextMenu.close', 'Close'),
              icon: 'close-circle',
              onPress: hideAfter(settingsVisible ? closeSettingsPane : closePatronagePane),
            },
          },
        ]}
      />

      <ContextMenu
        id={calcdexMenuId}
        itemKeyPrefix="InstanceButton:Calcdex:ContextMenu"
        items={[
          {
            key: 'open-calcdex',
            entity: 'item',
            props: {
              label: t('instances.calcdex.contextMenu.open', 'Open'),
              icon: 'external-link',
              iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
              onPress: ({ props: p }) => void hideAfter(() => {
                const id = (p as Record<'instanceId', string>)?.instanceId;

                if (!id) {
                  return;
                }

                onRequestCalcdex(id);
              })(),
            },
          },
          {
            key: 'dupe-calcdex',
            entity: 'item',
            props: {
              label: t('instances.calcdex.contextMenu.convertHonk', 'Convert to Honk'),
              icon: 'fa-car',
              hidden: !honkdexSettings?.visuallyEnabled,
              onPress: ({ props: p }) => void hideAfter(() => {
                const id = (p as Record<'instanceId', string>)?.instanceId;

                if (!id) {
                  return;
                }

                dupeCalcdex(
                  instances.find((i) => i?.battleId === id)
                    || { battleId: id },
                );
              })(),
            },
          },
          {
            key: 'close-hr',
            entity: 'separator',
            props: { hidden: !calcdexSettings?.destroyOnClose },
          },
          {
            key: 'close-battle',
            entity: 'item',
            props: {
              theme: 'error',
              label: t('instances.calcdex.contextMenu.closeBattle', 'Leave Battle'),
              icon: 'door-exit',
              iconStyle: { transform: 'scale(1.2)' },
              disabled: typeof onCloseCalcdex !== 'function',
              hidden: !calcdexSettings?.destroyOnClose,
              onPress: ({ props: p }) => void hideAfter(() => {
                const id = (p as Record<'instanceId', string>)?.instanceId;

                if (!id || typeof onCloseCalcdex !== 'function') {
                  return;
                }

                onCloseCalcdex(id);
              })(),
            },
          },
        ]}
      />

      {
        honkdexSettings?.visuallyEnabled &&
        <ContextMenu
          id={honkdexMenuId}
          itemKeyPrefix="InstanceButton:Honkdex:ContextMenu"
          items={[
            {
              key: 'open-honkdex',
              entity: 'item',
              props: {
                label: t('instances.honkdex.contextMenu.open', 'Open'),
                icon: 'external-link',
                iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
                onPress: ({ props: p }) => void hideAfter(() => {
                  const id = (p as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  onRequestHonkdex(id);
                })(),
              },
            },
            {
              key: 'dupe-honkdex',
              entity: 'item',
              props: {
                label: t('instances.honkdex.contextMenu.dupe', 'Duplicate'),
                icon: 'copy-plus',
                iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
                onPress: ({ props: p }) => hideAfter(() => {
                  const id = (p as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  dupeCalcdex(
                    instances.find((i) => i?.battleId === id)
                      || { battleId: id },
                  );
                })(),
              },
            },
            {
              key: 'remove-hr',
              entity: 'separator',
            },
            {
              key: 'remove-honkdex',
              entity: 'item',
              props: {
                theme: 'error',
                label: t('instances.honkdex.contextMenu.remove', 'Delete'),
                // icon: 'fa-times-circle',
                icon: 'trash-close',
                iconStyle: { transform: 'scale(1.2)' },
                onPress: ({ props: data }) => void hideAfter(() => {
                  const id = (data as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  instanceRefs.current[id]?.queueRemoval();
                })(),
              },
            },
          ]}
        />
      }

      {
        notedexEnabled &&
        <ContextMenu
          id={notedexMenuId}
          itemKeyPrefix="InstanceButton:Notedex:ContextMenu"
          items={[
            {
              key: 'open-notedex',
              entity: 'item',
              props: {
                label: t('instances.notedex.contextMenu.open', 'Open'),
                icon: 'external-link',
                iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
                onPress: ({ props: p }) => void hideAfter(() => {
                  const id = (p as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  onRequestNotedex(id);
                })(),
              },
            },
            {
              key: 'dupe-notedex',
              entity: 'item',
              props: {
                label: t('instances.notedex.contextMenu.dupe', 'Duplicate'),
                icon: 'copy-plus',
                iconStyle: { strokeWidth: 3, transform: 'scale(1.2)' },
                onPress: ({ props: p }) => void hideAfter(() => {
                  const id = (p as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  dupeNotedex({
                    scope: `${l.scope}:ContextMenu:dupe-notedex~ContextMenuItem:props.onPress()`,
                    id,
                  });
                })(),
              },
            },
            {
              key: 'remove-hr',
              entity: 'separator',
            },
            {
              key: 'remove-notedex',
              entity: 'item',
              props: {
                theme: 'error',
                label: t('instances.notedex.contextMenu.remove', 'Delete'),
                icon: 'trash-close',
                iconStyle: { transform: 'scale(1.2)' },
                onPress: ({ props: data }) => void hideAfter(() => {
                  const id = (data as Record<'instanceId', string>)?.instanceId;

                  if (!id) {
                    return;
                  }

                  noteInstanceRefs.current[id]?.queueRemoval();
                })(),
              },
            },
          ]}
        />
      }

      {
        settings?.showBattleRecord &&
        <ContextMenu
          id={recordMenuId}
          itemKeyPrefix="BattleRecord:ContextMenu"
          items={[
            {
              key: 'reset-record',
              entity: 'item',
              props: {
                label: t('battleRecord.contextMenu.reset', 'Reset'),
                icon: 'fa-refresh',
                disabled: !battleRecord?.wins && !battleRecord?.losses,
                onPress: hideAfter(resetBattleRecord),
              },
            },
            {
              key: 'hide-separator',
              entity: 'separator',
            },
            {
              key: 'hide-record',
              entity: 'item',
              props: {
                theme: 'warning',
                label: t('battleRecord.contextMenu.hide', 'Hide'),
                icon: 'close-circle',
                disabled: !settings?.showBattleRecord,
                onPress: hideAfter(() => updateSettings({
                  hellodex: { showBattleRecord: false },
                })),
              },
            },
          ]}
        />
      }
    </PageContainer>
  );
};
