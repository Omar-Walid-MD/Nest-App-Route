import { MiddlewareConsumer, Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PreAuth } from "src/common/middleware/authentication.middleware";
import { SharedAuthenticationModule } from "src/common/modules/auth.module";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { localFileUpload, S3Service } from "src/common";

@Module({
    imports:[SharedAuthenticationModule],
    exports:[],
    providers:[UserService, S3Service],
    controllers:[UserController]
})

export class UserModule {
    configure(consumer: MiddlewareConsumer)
    {
        consumer.apply(PreAuth)
        .forRoutes(UserController);
    }
}