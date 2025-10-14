import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    ConfigModule.forRoot({envFilePath:resolve("./config/.env.dev"),isGlobal:true}),
    MongooseModule.forRoot(process.env.DB_URI as string,{dbName:"nestApp",serverSelectionTimeoutMS:30000}),
    AuthenticationModule,
    UserModule,
    CategoryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
