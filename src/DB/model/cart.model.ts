import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import slugify from "slugify";
import { ICart, ICartProduct, IProduct } from "src/common";


@Schema({timestamps:true, strictQuery:true})
export class CartProduct implements ICartProduct
{
   
    @Prop({type:Types.ObjectId, required: true, ref: "Product"})
    productId: Types.ObjectId;

    @Prop({type:Number,required:true})
    quantity: number;
}

@Schema({timestamps:true, strictQuery:true})
export class Cart implements ICart
{
   
    @Prop({type:Types.ObjectId, required: true, ref: "User", unique:true})
    createdBy: Types.ObjectId;

    @Prop([CartProduct])
    products: CartProduct[];
}

export type CartDocument = HydratedDocument<Cart>;
export type CartProductDocument = HydratedDocument<CartProduct>;
const cartSchema = SchemaFactory.createForClass(Cart);

export const CartModel = MongooseModule.forFeature([{name:Cart.name,schema:cartSchema}]);