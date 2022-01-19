/**
 * battle-sound.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-sound.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleSound {
    /**
     * @default {}
     */
    soundCache: { [url: string]: HTMLAudioElement; };

    /**
     * @default []
     */
    bgm: BattleBGM[];

    /**
     * @default 50
     */
    effectVolume: number;

    /**
     * @default 50
     */
    bgmVolume: number;

    /**
     * @default false
     */
    muted: boolean;

    getSound(url: string): HTMLAudioElement;
    playEffect(url: string): void;
    playSound(url: string, volume: number): void;

    /**
     * `loopstart` and `loopend` are in milliseconds.
     */
    loadBgm(url: string, loopstart: number, loopend: number, replaceBGM?: BattleBGM): BattleBGM;
    deleteBgm(bgm: BattleBGM): void;
    currentBgm(): BattleBGM | false;
    setMute(muted: boolean): void;
    loudnessPercentToAmplitudePercent(loudnessPercent: number): number;
    setBgmVolume(bgmVolume: number): void;
    setEffectVolume(effectVolume: number): void;
  }
}
