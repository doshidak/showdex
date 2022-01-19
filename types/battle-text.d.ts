/**
 * battle-text.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-text-parser.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type Args = [string, ...string[]];
  type KwArgs = Record<string, string>;

  type SideID =
    | 'p1'
    | 'p2'
    | 'p3'
    | 'p4';

  interface BattleTextParser {
    /**
     * @default 'Player 1'
     */
    p1: string;

    /**
     * @default 'Player 2'
     */
    p2: string;

    /**
     * @default 'Player 3'
     */
    p3: string;

    /**
     * @default 'Player 4'
     */
    p4: string;

    perspective: SideID;

    /**
     * @default 7
     */
    gen: number;

    /**
     * @default 0
     */
    turn: number;

    /**
     * @default 'break'
     */
    curLineSection: 'break' | 'preMajor' | 'major' | 'postMajor';

    lowercaseRegExp?: RegExp;

    (perspective?: SideID): this;

    static parseLine(line: string, noDefault?: boolean): Args;
    static parseBattleLine(line: string): { args: Args; kwArgs: KwArgs; };

    static parseNameParts(text: string): {
      group: string;
      name: string;
      away: boolean;
      status: string;
    };

    static upgradeArgs(args: { args: Args; kwArgs: KwArgs; }): { args: Args; kwArgs: KwArgs; };
    extractMessage(buf: string): string;
    fixLowercase(input: string): string;
    static escapeRegExp(input: string): string;
    pokemonName: (pokemon: string) => string;
    pokemon(pokemon: string): string;
    pokemonFull(pokemon: string, details: string): [string, string];
    trainer(side: string): string;
    static allyID(sideid: SideID): SideID | '';
    team(side: string, isFar?: boolean): string;
    own(side: string): 'OWN' | '';
    party(side: string): string;
    static effectId(effect?: string): string;
    effect(effect?: string): string;
    template(type?: string, ...namespaces?: string[]): string;
    maybeAbility(effect?: string, holder: string): string;
    ability(name?: string, holder: string): string;
    static stat(stat: string): string;
    lineSection(args: Args, kwArgs: KwArgs): 'break' | 'preMajor' | 'major' | 'postMajor' | '';
    sectionBreak(args: Args, kwArgs: KwArgs): boolean;
    parseArgs(args: Args, kwArgs: KwArgs, noSectionBreak?: boolean): string;
    parseArgsInner(args: Args, kwArgs: KwArgs): string;
  }
}
