/**
 * client-popup.d.ts
 *
 * Provides generic Popup typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  type ClientPopupType =
    | 'normal'
    | 'modal'
    | 'semimodal';

  type ClientPopupPosition =
    | 'left'
    | 'right';

  class ClientPopup {
    public type: ClientPopupType = 'normal';
    public className = 'ps-popup';
    public events: Record<string, string> = {
      'click button': 'dispatchClickButton',
      'submit form': 'dispatchSubmit',
    };
    public sourceEl: Element;
    public position?: ClientPopupPosition = 'left';
    public buttons?: string;
    public message?: string;
    public htmlMessage?: string;
    public submit: (data: Partial<this>) => void;

    public constructor(data: Partial<this>): this;
    public initialize(data: Partial<this>): void;
    public dispatchClickButton(e: Event): void;
    public dispatchSubmit(e: Event): void;
    public send(data: Partial<this>): void;
    public remove(): void;
    public close(): void;
    public register(): void;
  }
}
