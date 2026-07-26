/**
 * @file `ps-format.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-mainmenu.tsx`.
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file, react/prefer-stateless-function, react/no-unused-class-component-methods */

declare namespace Showdown {
  interface FormatDropdownProps {
    selectType?: SelectType;
    format?: string;
    defaultFormat?: string;
    placeholder?: string;
    onChange?: (event: Event) => void;
  }

  class FormatDropdown extends Preact.Component<FormatDropdownProps> {
    public declare base?: HTMLButtonElement;
    public format = '';

    public change: (event: Event) => void;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teamdropdown.tsx`. */
  class FormatDropdownPanel extends PSRoomPanel {
    public static readonly id = 'formatdropdown' as const;
    public static readonly routes = ['formatdropdown'] as const;
    public static readonly location = 'modal-popup' as const;
    public static readonly noURL = true as const;

    public gen = '' as ID;
    public format?: string = null;
    public search = '';

    public click: (event: MouseEvent) => void;
    /** Internally sets `this.search` to the provided `event.currentTarget.value` & does a `this.forceUpdate()`. */
    public updateSearch: (event: Event) => void;
    /** Internally sets `this.gen` to the provided `event.currentTarget.value` & does a `this.forceUpdate()`. */
    public toggleGen: (event: Event) => void;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  interface FormatResource {
    url: string;
    resources?: {
      resource_name: string;
      url: string;
    }[];
  }
}
