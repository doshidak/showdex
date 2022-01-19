declare namespace Showdown {
  interface AnimData {
    anim(scene: BattleScene, args: PokemonSprite[]): void;
    prepareAnim?(scene: BattleScene, args: PokemonSprite[]): void;
    residualAnim?(scene: BattleScene, args: PokemonSprite[]): void;
  }

  type AnimTable = { [K: string]: AnimData; };
}
