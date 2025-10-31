import { Type } from "class-transformer";
import { IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Length } from "class-validator";
import { Types } from "mongoose";
import { IBrand, ICategory, IProduct } from "src/common";

export class CreateProductDto implements Partial<IProduct>{
    
    @Length(2, 2000)
    @IsString()
    name: string;

    @Length(2, 50000)
    @IsString()
    @IsOptional()
    description: string;

    @Type(()=>Number)
    @IsPositive()
    @IsNumber()
    originalPrice: number;
    
    @Type(()=>Number)
    @IsPositive()
    @IsNumber()
    @IsOptional()
    discountPercent: number;

    @IsMongoId()
    brand: Types.ObjectId | IBrand;
    
    @IsMongoId()
    category: Types.ObjectId | ICategory;
    
    @Type(()=>Number)
    @IsPositive()
    @IsNumber()
    stock: number;
}
