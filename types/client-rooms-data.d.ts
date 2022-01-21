/**
 * client-rooms-data.d.ts
 *
 * Provides rooms data typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  type ClientRoomSectionTitle =
    | 'Official'
    | 'Battle formats'
    | 'Languages'
    | 'Entertainment'
    | 'Gaming'
    | 'Life & hobbies'
    | 'On-site games';

  interface ClientChatRoomData {
    section: string;
    title: string;
    desc: string;
    userCount: number;
  }

  interface ClientRoomsData {
    userCount: number;
    battleCount: number;
    sectionsTitles: ClientRoomSectionTitle[];
    chat: ClientChatRoomData[];
  }
}
