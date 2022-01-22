export const getActiveBattle = (): Showdown.Battle => (<BattleRoom> app?.curRoom)?.battle;
