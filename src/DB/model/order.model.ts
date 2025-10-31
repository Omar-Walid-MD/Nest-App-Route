import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import { ICoupon, IOrder, IOrderProduct, IProduct } from "src/common";
import { OrderStatusEnum, PaymentEnum } from "src/common/enums";



@Schema({ timestamps: true, strictQuery: true, toObject: { virtuals: true }, toJSON: {virtuals: true} })
export class OrderProduct implements IOrderProduct {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: "Product", required: true })
    productId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    quantity: number;

    @Prop({ type: Number, required: true })
    unitPrice: number;

    @Prop({ type: Number, required: true })
    finalPrice: number;
}


@Schema({ timestamps: true, strictQuery: true, toObject: { virtuals: true }, toJSON: {virtuals: true} })
export class Order implements IOrder {
    @Prop({ type: String, required: true })
    orderId: string;

    @Prop({ type: String, required: true })
    address: string;

    @Prop({ type: String })
    cancelReason?: string;

    @Prop({ type: String })
    note?: string;

    @Prop({ type: String, required: true })
    phone: string;

    @Prop({ type: Types.ObjectId, ref: "Coupon" })
    coupon?: Types.ObjectId;

    @Prop({ type: Number })
    discount: number;

    @Prop({ type: Number })
    subtotal: number;

    @Prop({ type: Number, required: true })
    total: number;

    @Prop({ type: String, enum: PaymentEnum, default: PaymentEnum.Cash })
    paymentType: PaymentEnum;

    @Prop({
        type: String, enum: OrderStatusEnum, default: function (this: Order) {
            return this.paymentType === PaymentEnum.Card ? OrderStatusEnum.Pending : OrderStatusEnum.Placed;
        }
    })
    status: OrderStatusEnum;

    @Prop({ type: Date })
    paidAt?: Date;

    @Prop({ type: String })
    paymentIntent?: string;

    @Prop([OrderProduct])
    products: OrderProduct[];

    @Prop({ type: Types.ObjectId, required: true, ref: "User" })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "User" })
    updatedBy: Types.ObjectId;

    @Prop({ type: Date })
    freezedAt?: Date;

    @Prop({ type: Date })
    restoredAt?: Date;
}

export type OrderProductDocument = HydratedDocument<OrderProduct>;
export type OrderDocument = HydratedDocument<Order>;
const orderSchema = SchemaFactory.createForClass(Order);

orderSchema.pre("save", function (next) {
    if (this.isModified("total")) {
        this.subtotal = Number((this.total * (1 - (this.discount ?? 0) / 100)).toFixed(2));
    }
    next();
});


orderSchema.pre(["findOne","find"],async function(next)
{
    const query = this.getQuery();

    if(query.paranoid === false)
    {
        this.setQuery({...query});
    }
    else
    {
        this.setQuery({...query,freezedAt:{$exists:false}});
    }
        
    next();
});

orderSchema.pre(["updateOne","findOneAndUpdate"],async function(next)
{
    const query = this.getQuery();

    if(query.paranoid === false)
    {
        this.setQuery({...query});
    }
    else
    {
        this.setQuery({...query,freezedAt:{$exists:false}});
    }
        
    next();
});


export const OrderModel = MongooseModule.forFeature([{ name: Order.name, schema: orderSchema }]);