import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedAuthenticationModule } from './common/modules/auth.module';
import { S3Service } from './common';
import { BrandModule } from './modules/brand/brand.module';
@Module({
  imports: [
    ConfigModule.forRoot({envFilePath:resolve("./config/.env.dev"),isGlobal:true}),
    MongooseModule.forRoot(process.env.DB_URI as string,{dbName:"nestApp",serverSelectionTimeoutMS:30000}),
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    CategoryModule,
    BrandModule
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
