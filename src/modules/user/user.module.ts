import { MiddlewareConsumer, Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PreAuth } from "src/common/middleware/authentication.middleware";
import { SharedAuthenticationModule } from "src/common/modules/auth.module";

@Module({
    imports:[SharedAuthenticationModule],
    exports:[],
    providers:[UserService],
    controllers:[UserController]
})

export class UserModule {
    configure(consumer: MiddlewareConsumer)
    {
        consumer.apply(PreAuth)
        .forRoutes(UserController);
    }
}