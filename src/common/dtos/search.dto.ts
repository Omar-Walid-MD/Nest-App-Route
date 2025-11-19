import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class GetAllDto
{
    @Type(()=>Number)
    @IsInt()
    @IsPositive()
    @IsNumber()
    @IsOptional()
    page: number;

    @Type(()=>Number)
    @IsInt()
    @IsPositive()
    @IsNumber()
    @IsOptional()
    size: number;

    @IsString()
    @IsOptional()
    search: string;
}

@InputType()
export class GetAllGraphDto
{
    @Field(()=>Number,{nullable:true})
    @IsInt()
    @IsPositive()
    @IsNumber()
    @IsOptional()
    page?: number;

    @Field(()=>Number,{nullable:true})
    @IsInt()
    @IsPositive()
    @IsNumber()
    @IsOptional()
    size?: number;

    @Field(()=>String,{nullable:true})
    @IsString()
    @IsOptional()
    search?: string;
}