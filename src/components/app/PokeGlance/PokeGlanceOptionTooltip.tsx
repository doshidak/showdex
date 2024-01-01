import * as React from 'react';
import { type SelectOptionTooltipProps } from '@showdex/components/form';
import { type PokeGlanceProps, PokeGlance } from './PokeGlance';

export type PokeGlanceOptionTooltipProps =
  & SelectOptionTooltipProps<string>
  & Omit<PokeGlanceProps, 'pokemon' | 'reverseColorScheme'>;

export const PokeGlanceOptionTooltip = ({
  value,
  hidden,
  ...props
}: PokeGlanceOptionTooltipProps): JSX.Element => {
  if (!value || hidden) {
    return null;
  }

  return (
    <PokeGlance
      {...props}
      pokemon={{ speciesForme: value }}
      showAbility
      showBaseStats
      reverseColorScheme
    />
  );
};
