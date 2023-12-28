import * as React from 'react';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented, Switch, TextField } from '@showdex/components/form';
import { eacute } from '@showdex/consts/core';
import { type ShowdexCalcdexSettings } from '@showdex/interfaces/app';
import { env } from '@showdex/utils/core';
import { fileSize } from '@showdex/utils/humanize';
import styles from './SettingsPane.module.scss';

export interface CalcdexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexCalcdexSettings;
  presetCacheSize?: number;
  maxCacheSize?: number;
  inBattle?: boolean;
}

export const CalcdexSettingsPane = ({
  className,
  style,
  value,
  presetCacheSize,
  maxCacheSize,
  inBattle,
}: CalcdexSettingsPaneProps): JSX.Element => (
  <div
    className={cx(styles.settingsGroup, className)}
    style={style}
  >
    <div className={styles.settingsGroupTitle}>
      Calcdex
    </div>

    <div className={styles.settingsGroupFields}>
      <Field<ShowdexCalcdexSettings['openOnStart']>
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

      <Field<ShowdexCalcdexSettings['openAs']>
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

      <Field<ShowdexCalcdexSettings['openOnPanel']>
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
        disabled={value?.openAs === 'overlay'}
      />

      <Field<ShowdexCalcdexSettings['closeOn']>
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
        format={(v) => (value?.openAs === 'overlay' ? 'never' : v)}
        disabled={value?.openAs === 'overlay'}
      />

      <Field<ShowdexCalcdexSettings['destroyOnClose']>
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
        format={(v) => (value?.openAs === 'overlay' ? false : v)}
        disabled={value?.openAs === 'overlay'}
      />

      <div className={styles.settingsGroupTitle}>
        Sets
      </div>

      <Field<ShowdexCalcdexSettings, HTMLDivElement, ('smogon' | 'randoms' | 'usage')[]>
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
        parse={(v) => ({
          ...value,
          downloadSmogonPresets: !!v?.includes('smogon'),
          downloadRandomsPresets: !!v?.includes('randoms'),
          downloadUsageStats: !!v?.includes('usage'),
        })}
        format={(v) => ([
          v?.downloadSmogonPresets && 'smogon',
          v?.downloadRandomsPresets && 'randoms',
          v?.downloadUsageStats && 'usage',
        ] as ('smogon' | 'randoms' | 'usage')[]).filter(Boolean)}
      />

      <Field<ShowdexCalcdexSettings['maxPresetAge'], HTMLDivElement, number>
        name="calcdex.maxPresetAge"
        component={Segmented}
        className={cx(
          styles.field,
          !inBattle && styles.singleColumn,
        )}
        label={[
          'Cache Sets',
          !!presetCacheSize && `(~${fileSize(presetCacheSize, {
            precision: 1,
            omitSymbolPrefix: true,
          })}${maxCacheSize ? '' : ')'}`,
          !!presetCacheSize && !!maxCacheSize && `of ${fileSize(maxCacheSize, {
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
          label: '3 Days',
          tooltip: (
            <div className={styles.tooltipContent}>
              Downloads sets &amp; reuses them for <strong>3 Days</strong>,
              persisting between Showdown sessions.
              <br />
              <br />
              Enabling this may improve Calcdex initialization performance.
            </div>
          ),
          value: 3,
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
        }, /* {
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
        }, */ {
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
              <br />
              (By the way, you're on v{env('package-version', 'icoden')}!)
            </div>
          ),
          value: 0,
        }]}
        disabled={(
          !value?.downloadSmogonPresets
            && !value?.downloadRandomsPresets
            && !value?.downloadUsageStats
        )}
      />

      <Field<ShowdexCalcdexSettings['includeTeambuilder']>
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

      <Field<ShowdexCalcdexSettings['prioritizeUsageStats']>
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
        format={(v) => (!value?.downloadUsageStats ? false : v)}
        disabled={!value?.downloadUsageStats}
      />

      <Field<ShowdexCalcdexSettings['autoImportTeamSheets']>
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

      {/* <Field<ShowdexCalcdexSettings['autoExportOpponent']>
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

      <Field<ShowdexCalcdexSettings['authPosition']>
        name="calcdex.authPosition"
        component={Segmented}
        className={cx(
          styles.field,
          // !inBattle && styles.singleColumn,
        )}
        // label={`My Pok${eacute}mon's Location`}#252836
        label="My Location"
        labelPosition={inBattle ? 'top' : 'left'}
        options={[{
          label: 'Top',
          tooltip: (
            <div className={styles.tooltipContent}>
              When playing, your Pok&eacute;mon will be located in the <strong>top half</strong>,
              regardless of Showdown's assigned player order.
              <br />
              <br />
              Has no effect if spectating, in which case, Showdown's ordering will be used.
              Hover over the <strong>Auto</strong> option to learn more.
            </div>
          ),
          value: 'top',
        }, {
          label: 'Bottom',
          tooltip: (
            <div className={styles.tooltipContent}>
              When playing, your Pok&eacute;mon will be located in the <strong>bottom half</strong>,
              regardless of Showdown's assigned player order.
              <br />
              <br />
              Has no effect if spectating, in which case, Showdown's ordering will be used.
              Hover over the <strong>Auto</strong> option to learn more.
            </div>
          ),
          value: 'bottom',
        }, {
          label: 'Auto',
          tooltip: (
            <div className={styles.tooltipContent}>
              Your Pok&eacute;mon will be located based on Showdown's assigned player order,
              with <em>Player 1</em> at the top & <em>Player 2</em> at the bottom.
              <br />
              <br />
              This is the behavior when spectating any game, as the other options only apply when you're
              playing a game.
              <br />
              <br />
              (Pro-Tip: Selecting <em>Switch Sides</em> in the spectator battle controls will also swap
              the player locations in the Calcdex!)
            </div>
          ),
          value: 'auto',
        }]}
      />

      <Field<ShowdexCalcdexSettings['defaultAutoSelect'], HTMLDivElement, ('auth' | 'player')[]>
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
        parse={(v) => ({
          auth: !!v?.includes('auth'),
          p1: !!v?.includes('player'),
          p2: !!v?.includes('player'),
          p3: !!v?.includes('player'),
          p4: !!v?.includes('player'),
        })}
        format={(v) => ([
          v?.auth && 'auth',
          (v?.p1 || v?.p2 || v?.p3 || v?.p4) && 'player',
        ].filter(Boolean) as ('auth' | 'player')[])}
      />

      <Field<ShowdexCalcdexSettings['lockGeneticsVisibility']['auth']>
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
          disabled: value?.showBaseStats === 'never',
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

      <Field<ShowdexCalcdexSettings['lockGeneticsVisibility'], HTMLDivElement, ShowdexCalcdexSettings['lockGeneticsVisibility']['p1']>
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
          disabled: value?.showBaseStats === 'never',
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
        parse={(v) => ({
          ...value?.lockGeneticsVisibility,
          p1: v,
          p2: v,
          p3: v,
          p4: v,
        })}
        format={(v) => [...(v?.p1 || [])]}
      />

      <Field<ShowdexCalcdexSettings['showPlayerRatings']>
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

      <Field<ShowdexCalcdexSettings['openSmogonPage']>
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

      <Field<ShowdexCalcdexSettings['showNicknames']>
        name="calcdex.showNicknames"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label={`Show Pok${eacute}mon Nicknames`}
        tooltip={(
          <div className={styles.tooltipContent}>
            Shows the Pok&eacute;mon's nickname, if any, instead of its forme.
            <br />
            <br />
            ("but why tho?" &ndash;<em>analogcam</em>, 2022)
          </div>
        )}
      />

      <Field<ShowdexCalcdexSettings['forceNonVolatile']>
        name="calcdex.forceNonVolatile"
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

      <Field<ShowdexCalcdexSettings['showSpreadsFirst']>
        name="calcdex.showSpreadsFirst"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Show Available Spreads First"
        tooltip={(
          <div className={styles.tooltipContent}>
            Shows the spread dropdown (in place of the nature dropdown) for the currently selected
            Pok&eacute;mon if it has any spreads available from its currently applied set or
            corresponding usage stats.
            <br />
            <br />
            A toggle button will appear next to the dropdown letting you switch between the spread
            &amp; nature dropdowns.
          </div>
        )}
      />

      <Field<ShowdexCalcdexSettings['defaultAutoMoves'], HTMLInputElement, boolean>
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
        parse={(v) => ({
          auth: false,
          p1: v,
          p2: v,
          p3: v,
          p4: v,
        })}
        format={(va) => Object.values(va || {}).some((v) => !!v)}
      />

      <Field<ShowdexCalcdexSettings['enableQuickEditor']>
        name="calcdex.enableQuickEditor"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Quick-Edit Multihit Moves"
        tooltip={(
          <div className={styles.tooltipContent}>
            Allows you to quickly edit the number of hits for multihitting moves,
            such as <em>Icicle Spear</em>.
            <br />
            <br />
            If <em>Edit Moves</em> is enabled for the current battle,
            you'll be able to edit this value in the moves editor as well.
          </div>
        )}
      />

      <Field<ShowdexCalcdexSettings['showNonDamageRanges']>
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

      <Field<ShowdexCalcdexSettings, HTMLDivElement, ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[]>
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
        parse={(v) => ({
          ...value,
          showUiTooltips: !!v?.includes('ui'),
          showFieldTooltips: !!v?.includes('field'),
          showAbilityTooltip: !!v?.includes('ability'),
          showItemTooltip: !!v?.includes('item'),
          showMoveTooltip: !!v?.includes('move'),
          showMatchupTooltip: !!v?.includes('matchup'),
        })}
        format={(v) => ([
          v?.showUiTooltips && 'ui',
          v?.showFieldTooltips && 'field',
          v?.showAbilityTooltip && 'ability',
          v?.showItemTooltip && 'item',
          v?.showMoveTooltip && 'move',
          v?.showMatchupTooltip && 'matchup',
        ].filter(Boolean) as ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[])}
      />

      <div className={styles.settingsGroupTitle}>
        Matchups
      </div>

      <Field<ShowdexCalcdexSettings['prettifyMatchupDescription']>
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
        format={(v) => (!value?.showMatchupTooltip ? false : v)}
        disabled={!value?.showMatchupTooltip}
      />

      <Field<ShowdexCalcdexSettings['copyMatchupDescription']>
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
        format={(v) => (!value?.showMatchupTooltip ? false : v)}
        disabled={!value?.showMatchupTooltip}
      />

      <Field<ShowdexCalcdexSettings['showMatchupDamageAmounts']>
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
        format={(v) => (!value?.showMatchupTooltip ? 'never' : v)}
        disabled={!value?.showMatchupTooltip}
      />

      <Field<ShowdexCalcdexSettings['formatMatchupDamageAmounts']>
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
        format={(v) => (
          !value?.showMatchupTooltip
            || value?.showMatchupDamageAmounts === 'never'
            ? false
            : v
        )}
        disabled={(
          !value?.showMatchupTooltip
            || value?.showMatchupDamageAmounts === 'never'
        )}
      />

      <div className={styles.settingsGroupTitle}>
        Advanced
      </div>

      <Field<ShowdexCalcdexSettings['editPokemonTypes']>
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

      <Field<ShowdexCalcdexSettings['showMoveEditor']>
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
              Edits are unique to each move of each Pok&eacute;mon.
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

      <Field<ShowdexCalcdexSettings['allowIllegalSpreads']>
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

      <Field<ShowdexCalcdexSettings['showBaseStats']>
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

      <Field<ShowdexCalcdexSettings['resetDirtyBoosts']>
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

      <Field<ShowdexCalcdexSettings['showLegacyEvs']>
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

      <Field<ShowdexCalcdexSettings['lockUsedTera']>
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

      <Field<ShowdexCalcdexSettings['showAllOptions']>
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
            <Field<ShowdexCalcdexSettings['nhkoLabels'][typeof i]>
              key={`SettingsPane:Field:TextField:nhkoLabel:${i}`}
              name={`calcdex.nhkoLabels[${i}]`}
              component={TextField}
              className={cx(
                styles.customFieldInput,
                styles.textField,
                styles.nhkoLabelField,
              )}
              style={[4, 7].includes(value?.nhkoColors?.[i]?.length) ? {
                color: value.nhkoColors[i],
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
              parse={(v) => v?.replace(/[^A-Z 0-9]/i, '')}
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
            <Field<ShowdexCalcdexSettings['nhkoColors'][typeof i]>
              key={`SettingsPane:Field:TextField:nhkoColor:${i}`}
              name={`calcdex.nhkoColors[${i}]`}
              component={TextField}
              className={cx(
                styles.customFieldInput,
                styles.textField,
                styles.nhkoColorField,
              )}
              style={[4, 7].includes(value?.nhkoColors?.[i]?.length) ? {
                color: value.nhkoColors[i],
              } : undefined}
              inputClassName={styles.textFieldInput}
              aria-label={`Custom Color for ${i === 4 ? '5+' : i + 1}HKO`}
              hint={`${i === 4 ? '5+' : i + 1}HKO`}
              tooltip={`${i === 4 ? '5+' : i + 1}HKO`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={7}
              parse={(v) => (
                (v?.startsWith('#') ? v : `#${v}`)
                  .toUpperCase()
                  .replace(/[^#0-9A-F]/g, '')
              )}
              format={(v) => v?.replace(/#/g, '').slice(0, 6)}
            />
          ))}
        </div>

        {/** @todo clean this up; use CSS for handling inBattle overflow instead of this dumb af copy paste */}
        {
          inBattle &&
          <div className={cx(styles.customFieldRow, styles.centered)}>
            {Array(2).fill(null).map((_, i) => (
              <Field<ShowdexCalcdexSettings['nhkoColors'][typeof i]>
                key={`SettingsPane:Field:TextField:nhkoColor:${i + 3}`}
                name={`calcdex.nhkoColors[${i + 3}]`}
                component={TextField}
                className={cx(
                  styles.customFieldInput,
                  styles.textField,
                  styles.nhkoColorField,
                )}
                style={[4, 7].includes(value?.nhkoColors?.[i + 3]?.length) ? {
                  color: value.nhkoColors[i + 3],
                } : undefined}
                inputClassName={styles.textFieldInput}
                aria-label={`Custom Color for ${i === 0 ? '4' : '5+'}HKO`}
                hint={`${i === 0 ? '4' : '5+'}HKO`}
                tooltip={`${i === 0 ? '4' : '5+'}HKO`}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={7}
                parse={(v) => (
                  (v?.startsWith('#') ? v : `#${v}`)
                    .toUpperCase()
                    .replace(/[^#0-9A-F]/g, '')
                )}
                format={(v) => v?.replace(/#/g, '').slice(0, 6)}
              />
            ))}
          </div>
        }
      </div>
    </div>
  </div>
);
