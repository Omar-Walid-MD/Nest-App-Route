import { IsEnum, IsMongoId, IsOptional, IsString, Matches } from "class-validator";
import { Types } from "mongoose";
import { ICoupon, IOrder, PaymentEnum } from "src/common";

export class OrderParamDto
{
    @IsMongoId()
    orderId: Types.ObjectId;
}

export class CreateOrderDto implements Partial<IOrder>{

    @IsString()
    address: string;

    @IsString()
    @IsOptional()
    note: string;

    @IsMongoId()
    @IsOptional()
    coupon?: Types.ObjectId;

    // @Matches()
    @IsString()
    phone: string;

    @IsEnum(PaymentEnum)
    paymentType?: PaymentEnum;

}
