import * as React from 'react';
import cx from 'classnames';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type SelectOptionTooltipProps } from '@showdex/components/form';
import { exportPokePaste, flattenAlt } from '@showdex/utils/presets';
import styles from './PokePresetOptionTooltip.module.scss';

export interface PokePresetOptionTooltipProps extends SelectOptionTooltipProps<string> {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  presets?: CalcdexPokemonPreset[];
}

export const PokePresetOptionTooltip = ({
  className,
  style,
  format,
  presets,
  value,
  hidden,
}: PokePresetOptionTooltipProps): JSX.Element => {
  const preset = React.useMemo(
    () => (presets || []).find((p) => p?.calcdexId === value),
    [presets, value],
  );

  const pokePaste = React.useMemo(() => exportPokePaste({
    ...preset,
    name: preset?.nickname,
    teraType: flattenAlt(preset?.teraTypes?.[0]),
  }, format), [
    format,
    preset,
  ]);

  if (!pokePaste || hidden) {
    return null;
  }

  return (
    <div
      className={cx(styles.container, className)}
      style={style}
    >
      {pokePaste}
    </div>
  );
};
