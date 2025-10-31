import { MiddlewareConsumer, Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PreAuth } from "src/common/middleware/authentication.middleware";
import { SharedAuthenticationModule } from "src/common/modules/auth.module";
import { S3Service } from "src/common";

@Module({
    imports:[],
    exports:[],
    providers:[UserService, S3Service],
    controllers:[UserController]
})

export class UserModule {}