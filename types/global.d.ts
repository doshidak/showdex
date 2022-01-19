/// <reference types="node" />

declare namespace NodeJS {
  interface Global {
    readonly __DEV__: boolean;
  }
}

declare const __DEV__: typeof global.__DEV__;

declare const app: {
  user: Showdown.PSUser;
  roomList: Showdown.PSRoom[];
  rooms: { [roomid: string]: Showdown.PSRoom; };
  curRoom: Showdown.PSRoom;
  curSideRoom?: Showdown.PSRoom;
  sideRoomList: Showdown.PSRoom[];
  sideRoom?: Showdown.PSRoom;
  focused: boolean;
  hostCheckInterval: number;
};
