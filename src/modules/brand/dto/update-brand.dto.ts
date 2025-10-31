import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { Types } from "mongoose";
import { CreateBrandDto } from "./create-brand.dto";
import { PartialType } from "@nestjs/mapped-types";
import { ContainField } from "src/common";
import { Type } from "class-transformer";

@ContainField()
export class UpdateBrandDto extends PartialType(CreateBrandDto)
{

}

export class BrandParamsDto
{
    @IsMongoId()
    brandId: Types.ObjectId;
}