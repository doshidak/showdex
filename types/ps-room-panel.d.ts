/**
 * ps-room-panel.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panels.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface PSRoomPanel<T extends PSRoom = PSRoom> {
    room: T;

    /**
     * @default []
     */
    subscriptions: PSSubscription[];

    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;

    receiveLine(args: Args): void;

    /**
     * PS has "fake select menus," i.e., buttons that act like `<select>` dropdowns.
     *
     * * This is used by the popups they open to change the button values.
     */
    chooseParentValue(value: string): void;

    focus(): void;

    render(): JSX.Element;
  }
}
