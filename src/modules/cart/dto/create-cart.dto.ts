import { IsMongoId, IsNumber, IsPositive, Min } from "class-validator";
import { Types } from "mongoose";
import { ICartProduct, IProduct } from "src/common";

export class CreateCartDto implements Partial<ICartProduct>
{
    @IsMongoId()
    productId: Types.ObjectId;

    @IsNumber()
    @IsPositive()
    @Min(1)
    quantity: number;
}
