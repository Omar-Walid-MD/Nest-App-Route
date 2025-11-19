import { UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { AllOrdersResponse } from "./entities/order.entity";
import { OrderService } from "./order.service";
import { Args, Query, Resolver } from "@nestjs/graphql";
import { Auth, GetAllGraphDto, RoleEnum, User } from "src/common";
import { AuthenticationGuard } from "src/common/guards/authentication/authentication.guard";
import { type UserDocument } from "src/DB";

@UsePipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true}))
@Resolver()
export class OrderResolver
{
    constructor(private readonly orderService: OrderService){}

    @Query(()=>String,{
        name: "welcome",
        description: "say hi"
    })
    sayHi(): string
    {
        return "Hello graphql from nestjs";
    }

    @Auth([RoleEnum.admin])
    @Query(()=>AllOrdersResponse)
    async allOrders(
        @User() user: UserDocument,
        @Args("data",{nullable:true}) getAllGraphDto: GetAllGraphDto
    ): Promise<AllOrdersResponse>
    {
        const result = await this.orderService.findAll(getAllGraphDto,false);
        return result;
    }
}