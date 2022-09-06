declare const __DEV__: NodeJS.Global['__DEV__'];

declare module '*.module.scss' {
  const styles: { [className: string]: string; };

  export default styles;
}

declare const app: Showdown.ClientApp;
declare const Dex: Showdown.Dex; /** @todo convert to declare class Dex in battle-dex.d.ts */
declare const BattleAbilities: { [abilityid: string]: Showdown.Ability; };
declare const BattleMovedex: { [moveid: string]: Showdown.Move; };
declare const UserPopup: Showdown.UserPopup;
