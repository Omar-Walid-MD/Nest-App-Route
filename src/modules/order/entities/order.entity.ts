import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { IOrder, IOrderProduct, type IUser, OrderStatusEnum, PaymentEnum } from "src/common";
import { OneUserResponse } from "src/modules/user/entities/user.entity";

export class OrderResponse {
    order: IOrder
}

registerEnumType(PaymentEnum,{name:"PaymentEnum"})
registerEnumType(OrderStatusEnum,{name:"OrderStatusEnum"})


@ObjectType()
export class OneOrderProductResponse implements IOrderProduct
{
    @Field(()=>ID)
    _id: Types.ObjectId;

    @Field(()=>ID)
    productId: Types.ObjectId;

    @Field(()=>String)    
    name: string;

    @Field(()=>Number)
    quantity: number;

    @Field(()=>Number)
    unitPrice: number;

    @Field(()=>Number)
    finalPrice: number;

    @Field(()=>Date,{nullable:true})
    createdAt?: Date;

    @Field(()=>Date,{nullable:true})
    updatedAt?: Date;

}

@ObjectType({description:"One order response"})
export class OneOrderResponse implements IOrder
{
    @Field(()=>ID)
    _id: Types.ObjectId;

    @Field(()=>String)
    orderId: string;

    @Field(()=>String)
    address: string;

    @Field(()=>String)
    phone: string;

    @Field(()=>String,{nullable:true})
    note?: string;

    @Field(()=>[OneOrderProductResponse])
    products: IOrderProduct[];

    @Field(()=>ID,{nullable:true})
    coupon?: Types.ObjectId;

    @Field(()=>Number,{nullable:false})
    subtotal: number;

    @Field(()=>Number,{nullable:true})
    discount?: number;

    @Field(()=>Number,{nullable:true})
    total: number;

    @Field(()=>String)
    paymentType: PaymentEnum;

    @Field(()=>String)
    status: OrderStatusEnum;

    @Field(()=>String,{nullable:true})
    cancelReason?:string;

    @Field(()=>Date,{nullable:true})
    paidAt?: Date;

    @Field(()=>String,{nullable:true})
    paymentIntent?: string;

    @Field(()=>OneUserResponse)
    createdBy: IUser;

    @Field(()=>ID,{nullable:true})
    updatedBy?: Types.ObjectId;

    @Field(()=>Date,{nullable:true})
    createdAt?: Date;

    @Field(()=>Date,{nullable:true})
    updatedAt?: Date;

    @Field(()=>Date,{nullable:true})
    freezedAt?: Date;

    @Field(()=>Date,{nullable:true})
    restoredAt?: Date;

}

@ObjectType()
export class AllOrdersResponse {

    @Field(()=>Number,{nullable:true})
    docsCount?: number;

    @Field(()=>Number,{nullable:true})
    limit?: number;

    @Field(()=>Number,{nullable:true})
    pages?: number;

    @Field(()=>Number,{nullable:true})
    currentPage?: number;

    @Field(()=>[OneOrderResponse])
    result: IOrder[];
}