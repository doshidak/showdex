/**
 * client-user-popup.d.ts
 *
 * Provides UserPopup typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  class UserPopup extends ClientPopup {
    public name?: string;
    public userid?: string;
    public events: Record<string, string> = {
      'click button': 'dispatchClickButton',
      'submit form': 'dispatchSubmit',
      'click .ilink': 'clickLink',
      'click .trainersprite.yours': 'avatars',
    };

    public update(data?: Partial<this>): void;
    public clickLink(e: Event): void;
    public avatars(): void;
    public challenge(): void;
    public pm(): void;
    public login(): void;
    public logout(): void;
    public userOptions(): void;
  }
}
