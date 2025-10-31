import { Types } from "mongoose";
import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from "../enums";
import { OtpDocument } from "src/DB";
import { IProduct } from "./product.interface";

export interface IUser {
    _id?: Types.ObjectId;
    firstName: string;
    lastName: string;
    username?: string;
    email: string;

    confirmedAt?: Date;
    password?: string;

    provider: ProviderEnum;
    gender: GenderEnum;
    role: RoleEnum;

    changeCredentialsTime?: Date;
    otp?: OtpDocument[];
    preferredLanguage: LanguageEnum;

    profileImage?: string;

    createdAt?: Date;
    updatedAt?: Date;

    wishlist?: Types.ObjectId[] | IProduct[];
}
