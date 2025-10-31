import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderParamDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Auth, IResponse, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB';
import { OrderResponse } from './entities/order.entity';
import { endpoint } from './authorization';
import type { Request } from 'express';

@UsePipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true}))
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}


  @Auth(endpoint.create)
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: UserDocument
  ): Promise<IResponse<OrderResponse>> {
    const order = await this.orderService.create(createOrderDto, user);
    return successResponse<OrderResponse>({status:201,data:{order}});
  }

  @Auth(endpoint.create)
  @Post(":orderId")
  async checkout(
    @Param() params: OrderParamDto,
    @User() user: UserDocument
  ): Promise<IResponse> {
    const session = await this.orderService.checkout(params.orderId, user);
    return successResponse({status:201,data:{session}});
  }

  @Post("webhook")
  async webhook(
    @Req() req: Request
  )
  {
    await this.orderService.webhook(req);
    return successResponse();
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(":orderId")
  async cancel(
    @Param() params: OrderParamDto,
    @User() user: UserDocument
  ): Promise<IResponse<OrderResponse>> {
    const order = await this.orderService.cancel(params.orderId, user);
    return successResponse<OrderResponse>({data:{order}});
  }
  
}
