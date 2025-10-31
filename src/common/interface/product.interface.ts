import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { ICategory } from "./category.interface";
import { IBrand } from "./brand.interface";

export interface IProduct
{
    _id?: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    images: string[];

    originalPrice: number;
    discountPercent?: number;
    salePrice: number;

    assetFolderId: string;

    stock: number;
    soldItems: number;

    category: Types.ObjectId | ICategory;
    brand: Types.ObjectId | IBrand;
    
    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt?: Date;
    updatedAt?: Date;

    freezedAt?: Date;
    restoredAt?: Date;

}