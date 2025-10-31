import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { IProduct } from "./product.interface";
import { OrderStatusEnum, PaymentEnum } from "../enums";
import { ICoupon } from "./coupon.interface";

export interface IOrderProduct
{
    _id?: Types.ObjectId;
    productId: Types.ObjectId | IProduct;

    name: string;
    quantity: number;
    unitPrice: number;
    finalPrice: number;

    createdAt?: Date;
    updatedAt?: Date;
}

export interface IOrder
{
    _id?: Types.ObjectId;
    orderId: string;

    address: string;
    phone: string;
    note?: string;

    products: IOrderProduct[];

    coupon?: Types.ObjectId | ICoupon;
    subtotal?: number;
    discount?: number;
    total: number;

    paymentType: PaymentEnum;
    status: OrderStatusEnum;
    cancelReason?:string;

    paidAt?: Date;
    paymentIntent?: string;

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt?: Date;
    updatedAt?: Date;

    freezedAt?: Date;
    restoredAt?: Date;

}