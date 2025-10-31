import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { CouponEnum } from "../enums/coupon.enum";

export interface ICoupon
{
    _id?: Types.ObjectId;
    name: string;
    slug: string;
    image: string;
    
    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;
    usedBy?: Types.ObjectId[] | IUser[];

    duration: number;
    startDate: Date;
    endDate: Date;

    discount: number;

    type: CouponEnum;

    createdAt?: Date;
    updatedAt?: Date;

    freezedAt?: Date;
    restoredAt?: Date;

}