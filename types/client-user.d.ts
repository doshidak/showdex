/**
 * client-user.d.ts
 *
 * Provides user typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientUserSettings {
    allowFriendNotifications?: boolean;
    blockChallenges?: boolean;
    blockFriendRequests?: boolean;
    blockInvites?: boolean;
    blockPMs?: boolean;
    displayBattlesToFriends?: boolean;
    doNotDisturb?: boolean;
    hiddenNextBattle?: boolean;
    hideBattlesFromTrainerCard?: boolean;
    hideLogins?: boolean;
    ignoreTickets?: boolean;
    inviteOnlyNextBattle?: boolean;
    language?: string;
  }

  interface ClientUserAttributes {
    userid?: string;
    name: string;
    named?: boolean;
    avatar: string;
    status: string;
    away?: boolean;
    registered?: boolean;
    settings?: ClientUserSettings;
  }

  interface ClientUser {
    _changing: boolean;
    _pending: boolean;
    _previousAttributes: ClientUserAttributes;

    attributes: ClientUserAttributes;
    cid: string;
    challstr: string;
    changed: Record<string, unknown>;
    loaded: boolean;
    nameRegExp: RegExp;
    normalizeList: Record<string, RegExp>;
    replaceList: Record<string, RegExp>;

    initialize(): void;
    updateSetting(setting: string, value: string): void;
    getActionPHP(): string;
    finishRename(name: string, assertion: string): void;
    rename(name: string): void;
    passwordRename(name: string, password: string, special: string): void;
    receiveChallstr(challstr: string): void;
    logout(): void;
  }
}
