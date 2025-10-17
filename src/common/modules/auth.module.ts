import { Global, Module } from "@nestjs/common";
import { TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { JwtService } from "@nestjs/jwt";
import { TokenService } from "src/common/utils/security/token.service";

@Global()
@Module({
  imports: [UserModel, TokenModel],
  exports: [UserRepository, JwtService, TokenService, TokenRepository, TokenModel, UserModel],
  controllers: [],
  providers: [UserRepository, JwtService, TokenService, TokenRepository],
})
export class SharedAuthenticationModule {}
