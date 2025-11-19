import { Global, Module } from "@nestjs/common";
import { TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { JwtService } from "@nestjs/jwt";
import { TokenService } from "src/common/utils/security/token.service";
import { createClient } from "redis";

@Global()
@Module({
  imports: [UserModel, TokenModel],
  exports: [UserRepository, JwtService, TokenService, TokenRepository, TokenModel, UserModel,"REDIS_CLIENT"],
  controllers: [],
  providers: [UserRepository, JwtService, TokenService, TokenRepository,
  {
    provide: "REDIS_CLIENT",
    useFactory: async () => {
      const client = createClient({
        username: 'default',
        password: 'YXe3V4S3VyzxEdAphEK0MqbBClBJlH5o',
        socket: {
          host: 'redis-10321.crce177.me-south-1-1.ec2.cloud.redislabs.com',
          port: 10321
        }
      });
      client.on("error",(error)=>console.log("Redis Client Error:",error));
      await client.connect();
      console.log("Redis Connected");
      return client;
    }
  }
  ],
})
export class SharedAuthenticationModule {}
