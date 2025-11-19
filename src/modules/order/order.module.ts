import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModel, CartRepository, OrderModel, OrderRepository, ProductModel } from 'src/DB';
import { ProductRepository } from 'src/DB/repository/product.repository';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common';
import { RealtimeGateway } from '../gateway/gateway';

@Module({
  imports: [ProductModel, CartModel, OrderModel],
  controllers: [OrderController],
  providers: [OrderService, CartRepository, ProductRepository, OrderRepository, CartService, PaymentService, RealtimeGateway],
})
export class OrderModule {}
