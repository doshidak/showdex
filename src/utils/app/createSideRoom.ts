const minWidth = 320;
const maxWidth = 1024;

export const createSideRoom = (id: string, title: string, focus?: boolean): HtmlRoom => {
  if (typeof app?._addRoom !== 'function') {
    console.error('cannot make side room since app._addRoom() is currently unavailable');

    return;
  }

  let room: HtmlRoom;

  if (id in app.rooms) {
    room = <HtmlRoom> app.rooms[id];

    console.log('found existing side room with matching roomId', id);
  } else {
    room = app._addRoom<HtmlRoom>(id, 'html', true, title);
    app.sideRoomList.push(app.roomList.pop());

    console.log('created side room with roomId', room.id, 'and roomType', room.type);
  }

  if (!room?.el) {
    console.error('couldn\'t find or make the side room for roomId', id);

    return;
  }

  // double-check the room's width params
  if (room.minWidth !== minWidth) {
    room.minWidth = minWidth;
  }

  if (room.maxWidth !== maxWidth) {
    room.maxWidth = maxWidth;
  }

  if (focus) {
    app.focusRoomRight(room.id);
    app.topbar.updateTabbar();
  }

  return room;
};
