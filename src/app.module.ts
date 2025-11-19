import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { join, resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedAuthenticationModule } from './common/modules/auth.module';
import { S3Service } from './common';
import { BrandModule } from './modules/brand/brand.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { RealtimeModule } from './modules/gateway/gateway.module';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    ConfigModule.forRoot({envFilePath:resolve("./config/.env.dev"),isGlobal:true}),
    MongooseModule.forRoot(process.env.DB_URI as string,{dbName:"nestApp",serverSelectionTimeoutMS:30000}),
    
    
    
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(),"src/schema.gql"),
      graphql: true
    })
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    CategoryModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    CouponModule,
    RealtimeModule
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
