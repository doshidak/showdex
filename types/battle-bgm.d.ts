/**
 * battle-bgm.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-sound.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleBGM {
    /**
     * May be shared with other BGM objects.
     *
     * * Every battle has its own `BattleBGM` object,
     *   but two battles with the same music will have the same `HTMLAudioElement` object.
     */
    sound?: HTMLAudioElement;

    url: string;
    timer?: number;
    loopstart: number;
    loopend: number;

    /**
     * When multiple battles with BGM are open, they will have `isPlaying` set to `true`,
     * but only the first one will have `isActuallyPlaying` set to `true`.
     *
     * * Additionally, muting volume/setting BGM volume to 0 will set `isActuallyPlaying` to `false`.
     *
     * @default false
     */
    isPlaying: boolean;

    /**
     * See `isPlaying`.
     *
     * @default false
     */
    isActuallyPlaying: boolean;

    /**
     * Whether the sound should rewind when it reaches the end.
     *
     * @default true
     */
    willRewind: boolean;

    (url: string, loopstart: number, loopend: number): this;

    destroy(): void;

    play(): void;
    resume(): void;
    actuallyResume(): void;
    pause(): void;
    actuallyPause(): void;
    stop(): void;

    /**
     * Handles the hard part of looping the sound.
     */
    updateTime(): void;

    static update(): void;
  }
}
