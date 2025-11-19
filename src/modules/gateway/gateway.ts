import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import { Auth, type ISocketAuth, RoleEnum, TokenEnum, User } from "src/common";
import { AuthenticationGuard } from "src/common/guards/authentication/authentication.guard";
import { TokenService } from "src/common/utils/security/token.service";
import { getSocketAuth } from "src/common/utils/socket";
import { connectedSockets, Product, type UserDocument } from "src/DB";

@WebSocketGateway(80,{
    cors: {
        origin: "*"
    },
    namespace: "public"
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    private readonly server: Server;

    constructor(private readonly tokenService: TokenService){}

    afterInit(server: Server) {
        console.log("Realtime gateway started");
    }

    async handleConnection(client: ISocketAuth, ...args: any[]) {

        try {
            const authorization = getSocketAuth(client);
            const {user, decoded} = await this.tokenService.decodeToken({authorization,tokenType:TokenEnum.access});
            client.credentials = {user, decoded};

            const userTabs = connectedSockets.get(user._id.toString()) || [];
            userTabs.push(client.id);
            connectedSockets.set(user._id.toString(),userTabs);


        } catch (error) {
            client.emit("exception",error.message || "Something Went Wrong");
        }
    }

    handleDisconnect(client: ISocketAuth) {
        const userId = client.credentials.user._id.toString() as string;
        let remainingTabs = connectedSockets.get(userId)?.filter((tab:string)=> tab !== client.id) || [];

        if(remainingTabs.length)
        {
            connectedSockets.set(userId,remainingTabs);
        }
        else
        {
            connectedSockets.delete(userId);
            this.server.emit("offline_user",userId);
        }
    }

    @Auth([RoleEnum.admin, RoleEnum.user])
    @SubscribeMessage("sayHi")
    sayHi(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
        @User() user: UserDocument
    ): string
    {
        client.emit("sayHi","NEST TO FE");
        return "Received data";
    }

    changeProductStock(products:{productId: Types.ObjectId, stock: number}[])
    {
        this.server.emit("changeProductStock",products)
    }
}