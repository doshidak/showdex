declare const __DEV__: NodeJS.Global['__DEV__'];

declare module '*.module.scss' {
  const styles: { [className: string]: string; };

  export default styles;
}

declare const app: Showdown.ClientApp;
declare const Config: Showdown.PSConfig;
declare const Dex: Showdown.Dex; /** @todo convert to declare class Dex in battle-dex.d.ts */
declare const BattleAbilities: Showdown.BattleAbilities;
declare const BattleItems: Showdown.BattleItems;
declare const BattleMovedex: Showdown.BattleMovedex;
declare const BattleTeambuilderTable: Showdown.BattleTeambuilderTable;
declare const UserPopup: Showdown.UserPopup;
