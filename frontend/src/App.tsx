import { useEffect, useRef, useState } from "react";

function App() {
  const wsRef = useRef(null);

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "error") {
        alert(data.payload.message);
        return;
      }

      if (data.type === "chat" || data.type === "system") {
        setMessages(prev => [...prev, data]);
        setTypingUser("");
      }

      if (data.type === "typing") {
        setTypingUser(data.payload.username);
        setTimeout(() => setTypingUser(""), 1500);
      }
    };

    return () => wsRef.current?.close();
  }, []);

  const joinRoom = (id) => {
    if (!username || !id) return;

    wsRef.current.send(JSON.stringify({
      type: "join",
      payload: { roomId: id, username }
    }));

    setRoomId(id);
    setJoined(true);
  };

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    joinRoom(id);
  };

  const sendMessage = () => {
    if (!message) return;

    wsRef.current.send(JSON.stringify({
      type: "chat",
      payload: { message }
    }));

    setMessage("");
  };

  const handleTyping = () => {
    wsRef.current.send(JSON.stringify({ type: "typing" }));
  };

  return (
    <div className="h-screen bg-neutral-900 flex items-center justify-center text-white">
      <div className="w-[380px] h-[520px] bg-neutral-800 rounded-xl flex flex-col">

        {/* HEADER */}
        <div className="h-14 flex items-center justify-center border-b border-neutral-700">
          {joined ? `Room: ${roomId}` : "Group Chat"}
        </div>

        {/* BODY */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm">
          {!joined ? (
            <div className="space-y-3">
              <input
                placeholder="Username"
                className="w-full bg-neutral-700 p-2 rounded"
                onChange={e => setUsername(e.target.value)}
              />
              <input
                placeholder="Room ID"
                className="w-full bg-neutral-700 p-2 rounded"
                onChange={e => setRoomId(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => joinRoom(roomId)} className="flex-1 bg-blue-600 p-2 rounded">Join</button>
                <button onClick={createRoom} className="flex-1 bg-green-600 p-2 rounded">Create</button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                if (msg.type === "system") {
                  return (
                    <div key={i} className="text-center text-gray-400 text-xs">
                      {msg.payload.message}
                    </div>
                  );
                }

                const isMe = msg.payload.sender === username;
                return (
                  <div
                    key={i}
                    className={`max-w-[75%] p-2 rounded-lg ${
                      isMe
                        ? "ml-auto bg-blue-600"
                        : "mr-auto bg-neutral-700"
                    }`}
                  >
                    {!isMe && (
                      <div className="text-xs text-gray-300">
                        {msg.payload.sender}
                      </div>
                    )}
                    <div>{msg.payload.message}</div>
                  </div>
                );
              })}

              {typingUser && typingUser !== username && (
                <div className="text-xs text-gray-400">
                  {typingUser} is typing...
                </div>
              )}
            </>
          )}
        </div>

        {/* INPUT */}
        {joined && (
          <div className="h-14 flex gap-2 p-2 border-t border-neutral-700">
            <input
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                handleTyping();
              }}
              className="flex-1 bg-neutral-700 px-3 rounded"
              placeholder="Message..."
            />
            <button onClick={sendMessage} className="bg-blue-600 px-4 rounded">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
