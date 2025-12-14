import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
  username: string;
}

let allSockets: User[] = [];

function broadcast(room: string, data: any) {
  allSockets
    .filter(u => u.room === room)
    .forEach(u => u.socket.send(JSON.stringify(data)));
}

wss.on("connection", (socket) => {

  socket.on("message", (message) => {
    const parsed = JSON.parse(message.toString());

    // JOIN
    if (parsed.type === "join") {
      const { roomId, username } = parsed.payload;

      // ❌ prevent duplicate username in same room
      const exists = allSockets.find(
        u => u.room === roomId && u.username === username
      );
      if (exists) {
        socket.send(JSON.stringify({
          type: "error",
          payload: { message: "Username already taken in this room" }
        }));
        return;
      }

      allSockets.push({ socket, room: roomId, username });

      // ✅ system message: joined
      broadcast(roomId, {
        type: "system",
        payload: { message: `${username} joined the room` }
      });
    }

    // CHAT
    if (parsed.type === "chat") {
      const sender = allSockets.find(u => u.socket === socket);
      if (!sender) return;

      broadcast(sender.room, {
        type: "chat",
        payload: {
          sender: sender.username,
          message: parsed.payload.message
        }
      });
    }

    // TYPING
    if (parsed.type === "typing") {
      const sender = allSockets.find(u => u.socket === socket);
      if (!sender) return;

      allSockets
        .filter(u => u.room === sender.room && u.socket !== socket)
        .forEach(u =>
          u.socket.send(JSON.stringify({
            type: "typing",
            payload: { username: sender.username }
          }))
        );
    }
  });

  // LEAVE
  socket.on("close", () => {
    const user = allSockets.find(u => u.socket === socket);
    if (!user) return;

    allSockets = allSockets.filter(u => u.socket !== socket);

    broadcast(user.room, {
      type: "system",
      payload: { message: `${user.username} left the room` }
    });
  });
});
