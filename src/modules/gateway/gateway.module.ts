import { Module } from "@nestjs/common";
import { RealtimeGateway } from "./gateway";

@Module({
    providers: [RealtimeGateway]
})
export class RealtimeModule
{

}