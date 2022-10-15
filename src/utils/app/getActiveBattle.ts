export const getActiveBattle = (): Showdown.Battle => (<Showdown.BattleRoom> app?.curRoom)?.battle;
