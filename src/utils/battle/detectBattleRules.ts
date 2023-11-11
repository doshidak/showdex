import { type CalcdexBattleRules } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';

/*
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
*/

/**
 * Detects the rules of the battle.
 *
 * * Prior to v1.1.7, this used to parse the battle rules directly from the `stepQueue[]`.
 *   - Now it just reads the keys of the `rules` object (that I realized existed this whole time LOL) instead!
 *
 * @since 0.1.3
 */
export const detectBattleRules = (
  // stepQueue: Showdown.Battle['stepQueue'],
  battle: Showdown.Battle,
): CalcdexBattleRules => {
  const ruleIds = Object.keys(battle?.rules || {}).map(formatId);

  const has = (
    rule: string,
  ) => {
    const ruleId = formatId(rule);

    if (!ruleId) {
      return false;
    }

    return ruleIds.some((r) => r.includes(ruleId));
  };

  return {
    boostPasser: has('boostpasser'),
    dynamax: has('dynamax'),
    tera: has('terastal'),
    evasion: has('evasionclause'),
    evasionAbilities: has('evasionabilities'),
    evasionItems: has('evasionitems'),
    evasionMoves: has('evasionmoves'),
    endlessBattle: has('endlessbattle'),
    freeze: has('freeze'),
    hpPercentage: has('hppercentage'),
    megaRayquaza: has('megarayquaza'),
    ohko: has('ohko'),
    sameType: has('sametype'),
    sleep: has('sleep'),
    species: has('species'),
  };
};
