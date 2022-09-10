import { formatId } from '@showdex/utils/app';
import type { CalcdexBattleRules } from '@showdex/redux/store';

const createBattleRuleDetector = (
  stepQueue: Showdown.Battle['stepQueue'],
): (rule: string) => boolean => {
  const rules = stepQueue
    ?.filter?.((step) => !!step && step.startsWith('|rule|')) // only rule steps: ['|rule|Dynamax Clause: You cannot dynamax', ...]
    .map((step) => formatId(step.replace('|rule|', '').split(':')[0])) // remove step type & rule description: ['dynamaxclause', ...]
    .filter(Boolean)
    ?? [];

  return (rule) => rules.some((r) => r.includes(formatId(rule)));
};

export const detectBattleRules = (
  stepQueue: Showdown.Battle['stepQueue'],
): CalcdexBattleRules => {
  const hasRule = createBattleRuleDetector(stepQueue);

  return {
    boostPasser: hasRule('boostpasser'),
    dynamax: hasRule('dynamax'),
    evasionItems: hasRule('evasionitems'),
    evasionMoves: hasRule('evasionmoves'),
    endlessBattle: hasRule('endlessbattle'),
    freeze: hasRule('freeze'),
    hpPercentage: hasRule('hppercentage'),
    megaRayquaza: hasRule('megarayquaza'),
    ohko: hasRule('ohko'),
    sameType: hasRule('sametype'),
    sleep: hasRule('sleep'),
    species: hasRule('species'),
  };
};
