import { Socket } from "socket.io";

export const getSocketAuth = (client: Socket): string => {

    const authorization = client.handshake.auth.authorization ?? client.handshake.headers.authorization;
    if(!authorization)
    {
        client.emit("exception","Missing Authorization")
    }
    return authorization;
}
