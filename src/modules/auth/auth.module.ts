import { Module } from "@nestjs/common";
import { AuthenticationController } from "./auth.controller";
import { AuthenticationService } from "./auth.service";
import { OtpModel, OtpRepository, TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { SharedAuthenticationModule } from "src/common/modules/auth.module";
import { SecurityService } from "src/common";

@Module({
  imports: [SharedAuthenticationModule, OtpModel],
  exports: [],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, OtpRepository, SecurityService],
})
export class AuthenticationModule {}
