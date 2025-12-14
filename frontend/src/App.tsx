import { useEffect, useRef, useState } from "react";

function App() {
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (!message.trim()) return;

    wsRef.current.send(JSON.stringify({
      type: "chat",
      payload: { message }
    }));

    setMessage("");
  };

  const handleTyping = () => {
    wsRef.current.send(JSON.stringify({ type: "typing" }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center text-white p-4">
      <div className="w-full max-w-md h-[600px] bg-neutral-900/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-neutral-800 overflow-hidden">

        {/* HEADER */}
        <div className="h-16 flex items-center justify-center border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
            <span className="font-semibold tracking-wide text-lg">
              {joined ? `Room ${roomId}` : "Group Chat"}
            </span>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 text-sm">
          {!joined ? (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome
                </h2>
                <p className="text-neutral-500 text-sm">Join or create a room to start chatting</p>
              </div>
              
              <input
                placeholder="Enter your username"
                className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-500"
                onChange={e => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && roomId && joinRoom(roomId)}
              />
              
              <input
                placeholder="Room ID (optional)"
                className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-500"
                onChange={e => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && roomId && joinRoom(roomId)}
              />
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => joinRoom(roomId)} 
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 p-3 rounded-xl font-medium shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                >
                  Join Room
                </button>
                <button 
                  onClick={createRoom} 
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 p-3 rounded-xl font-medium shadow-lg border border-neutral-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                >
                  Create Room
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                if (msg.type === "system") {
                  return (
                    <div key={i} className="text-center text-neutral-500 text-xs py-2 animate-fade-in">
                      <span className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
                        {msg.payload.message}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.payload.sender === username;
                return (
                  <div
                    key={i}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} animate-slide-in`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                        isMe
                          ? "bg-neutral-700 rounded-br-sm"
                          : "bg-neutral-800 border border-neutral-700 rounded-bl-sm"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-xs font-medium text-neutral-400 mb-1">
                          {msg.payload.sender}
                        </div>
                      )}
                      <div className="break-words">{msg.payload.message}</div>
                    </div>
                  </div>
                );
              })}

              {typingUser && typingUser !== username && (
                <div className="text-xs text-neutral-500 pl-1 animate-pulse">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium text-neutral-400">{typingUser}</span> is typing
                    <span className="inline-flex gap-0.5">
                      <span className="w-1 h-1 bg-neutral-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                      <span className="w-1 h-1 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    </span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* INPUT */}
        {joined && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-900">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-neutral-800 border border-neutral-700 px-4 py-3 rounded-xl focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-500"
                placeholder="Type a message..."
              />
              <button 
                onClick={sendMessage} 
                className="bg-neutral-700 hover:bg-neutral-600 px-6 rounded-xl font-medium shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(64, 64, 64, 0.5);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(64, 64, 64, 0.7);
        }
      `}</style>
    </div>
  );
}

export default App;