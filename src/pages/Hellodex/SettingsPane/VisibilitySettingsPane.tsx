import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented } from '@showdex/components/form';
import { type ShowdexCalcdexSettings, type ShowdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface VisibilitySettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexSettings;
  inBattle?: boolean;
}

/**
 * Visibility settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const VisibilitySettingsPane = ({
  className,
  style,
  value,
  inBattle,
}: VisibilitySettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.visibility', 'Show / Hide')}
      </div>

      <div className={styles.settingsGroupFields}>
        <Field<ShowdexCalcdexSettings, HTMLDivElement, ('showNonDamageRanges' | 'showNicknames' | 'showPlayerRatings' | 'showLegacyEvs')[]>
          name="calcdex"
          component={Segmented}
          className={cx(styles.field, !inBattle && styles.singleColumn)}
          options={[
            'showNonDamageRanges',
            'showNicknames',
            'showPlayerRatings',
            'showLegacyEvs',
          ].map((option) => ({
            labelStyle: option === 'showLegacyEvs' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.${option}.label`, '').toUpperCase().replace(/([a-z]{2})s/i, '$1s'),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
                components={{ ndash: <span>&ndash;</span> }}
              />
            ),
            value: option,
          }))}
          multi
          unique
          parse={(v) => ({
            ...value?.calcdex,
            showNonDamageRanges: v?.includes('showNonDamageRanges'),
            showNicknames: v?.includes('showNicknames'),
            showPlayerRatings: v?.includes('showPlayerRatings'),
            showLegacyEvs: v?.includes('showLegacyEvs'),
          })}
          format={(v) => [
            v?.showNonDamageRanges && 'showNonDamageRanges',
            v?.showNicknames && 'showNicknames',
            v?.showPlayerRatings && 'showPlayerRatings',
            v?.showLegacyEvs && 'showLegacyEvs',
          ].filter(Boolean) as ('showNonDamageRanges' | 'showNicknames' | 'showPlayerRatings' | 'showLegacyEvs')[]}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.tooltips', 'Tooltips')}
        </div>

        <Field<ShowdexCalcdexSettings, HTMLDivElement, ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[]>
          name="calcdex"
          component={Segmented}
          className={cx(styles.field, !inBattle && styles.singleColumn)}
          fieldStyle={inBattle ? { flexDirection: 'column' } : undefined}
          options={[
            'ui',
            'ability',
            'item',
            'move',
            'matchup',
            'field',
          ].map((option) => ({
            label: t(`calcdex.showTooltips.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.showTooltips.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
            break: option === 'matchup' && inBattle,
          }))}
          multi
          unique
          parse={(v) => ({
            ...value?.calcdex,
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
      </div>
    </div>
  );
};
