import { all } from "axios";
import { WebSocketServer,WebSocket } from "ws";

const wss =new WebSocketServer({port : 8080});

interface User{
    socket : WebSocket;
    room : string;
}
let allSockets: User[] = []

wss.on("connection",(socket)=>{

    socket.on("message",(message)=>{
        //@ts-ignore
        const parsedMessage =JSON.parse(message);
        console.log("USer Joined Room " + parsedMessage.payload.roomId)
        if(parsedMessage.type === "join"){
            allSockets.push({
                socket,
                room : parsedMessage.payload.roomId
            })
        }

        if (parsedMessage.type=="chat"){
            console.log("User wants to chat")
            const user = allSockets.find((x)=>x.socket==socket);
            if (!user) return;
            const currentUserRoom = user.room;
            
            for(let i=0 ;i<allSockets.length;i++){
                const user = allSockets[i];
                if(user && user.room == currentUserRoom){
                    user.socket.send(parsedMessage.payload?.message)

                }
            }
        }

        
    })
    
    
})