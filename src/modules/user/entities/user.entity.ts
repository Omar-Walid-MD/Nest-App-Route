import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { GenderEnum, IProduct, IResponse, IUser, LanguageEnum, ProviderEnum, RoleEnum } from "src/common";
import { OtpDocument } from "src/DB";

export class ProfileResponse
{
    profile: IUser;
}

registerEnumType(RoleEnum,{name:"RoleEnum"})
registerEnumType(GenderEnum,{name:"GenderEnum"})
registerEnumType(ProviderEnum,{name:"ProviderEnum"})
registerEnumType(LanguageEnum,{name:"LanguageEnum"})


@ObjectType()
export class OneUserResponse implements IUser
{
    @Field(()=>ID)
    _id: Types.ObjectId;

    @Field(()=>String)
    firstName: string;

    @Field(()=>String)
    lastName: string;

    @Field(()=>String,{nullable:true})
    username?: string;

    @Field(()=>String)
    email: string;

    @Field(()=>Date,{nullable:true})
    confirmedAt?: Date;

    @Field(()=>String,{nullable:true})
    password?: string;

    @Field(()=>String)
    provider: ProviderEnum;

    @Field(()=>String)
    gender: GenderEnum;

    @Field(()=>String)
    role: RoleEnum;

    @Field(()=>Date,{nullable:true})
    changeCredentialsTime?: Date;

    otp?: OtpDocument[];

    @Field(()=>String)
    preferredLanguage: LanguageEnum;

    @Field(()=>String,{nullable:true})
    profileImage?: string;

    @Field(()=>Date,{nullable:true})
    createdAt?: Date;

    @Field(()=>Date,{nullable:true})
    updatedAt?: Date;

    @Field(()=>[ID],{nullable:true})
    wishlist?: Types.ObjectId[] | IProduct[];

}