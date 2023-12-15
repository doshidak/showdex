export const getActiveBattle = (): Showdown.Battle => (app?.curRoom as Showdown.BattleRoom)?.battle;
