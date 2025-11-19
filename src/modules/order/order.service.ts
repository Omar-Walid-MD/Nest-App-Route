import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartRepository, CouponRepository, OrderDocument, OrderProduct, OrderRepository, ProductDocument, UserDocument } from 'src/DB';
import { ProductRepository } from 'src/DB/repository/product.repository';
import { CouponEnum, GetAllDto, GetAllGraphDto, IOrderProduct, OrderStatusEnum, OrderStatusNameEnum, PaymentEnum, PaymentService } from 'src/common';
import { randomUUID } from 'crypto';
import { CartService } from '../cart/cart.service';
import { Types } from 'mongoose';
import Stripe from 'stripe';
import type { Request } from 'express';
import { RealtimeGateway } from '../gateway/gateway';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class OrderService {

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
    private readonly cartService: CartService,
    private readonly couponRepository: CouponRepository,
    private readonly paymentService: PaymentService,
    private readonly realtimeGateway :RealtimeGateway

  ){}


  async webhook(req: Request)
  {
    const event = await this.paymentService.webhook(req);
    const orderId = event.data.object.metadata as {orderId: string};
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId as unknown as string),
        status: OrderStatusEnum.Pending,
        paymentType: PaymentEnum.Card
      },
      update: {
        paidAt: new Date(),
        status: OrderStatusEnum.Placed
      }
    });

    if(!order)
    {
      throw new NotFoundException("Failed to find matching order");
    }

    await this.paymentService.confirmPaymentIntent(order.paymentIntent as string);

    return;
  }

  async create(createOrderDto: CreateOrderDto, user: UserDocument): Promise<OrderDocument> {

    const cart = await this.cartService.findOne(user);

    if(!cart?.products?.length)
    {
      throw new BadRequestException("User cart is empty");
    }

    let coupon: any;
    if(createOrderDto.coupon)
    {
      coupon = await this.couponRepository.findOne({
        filter: {_id: createOrderDto.coupon._id}
      });

      if(!coupon) throw new NotFoundException("Failed to find matching coupon");

      if(coupon.duration <= (coupon.usedBy?.filter((ele)=>{return ele.toString() === user._id.toString()}) || []).length)
      {
        throw new ConflictException("Sorry, you have reached the maximum limit of usage for this coupon");
      }
    }
    
    let discount = 0;
    let total = 0;
    const products: OrderProduct[] = [];

    for (const product of cart.products) {
      const checkProduct = await this.productRepository.findOne({
        filter: {_id: product.productId,stock: {$gte:product.quantity}}
      });

      if(!checkProduct) throw new BadRequestException(`Failed to find matching product for id: ${product.productId}`);
    
      const finalPrice = product.quantity * checkProduct.salePrice;
      products.push({
        name: checkProduct.name,
        productId: checkProduct._id,
        quantity: product.quantity,
        unitPrice: checkProduct.salePrice,
        finalPrice
      });
      total += finalPrice;
    }

    if(coupon)
    {
      discount = coupon.type === CouponEnum.Percent ? coupon.discount/100 : coupon.discount/total;
    }

    delete createOrderDto.coupon;

    const [order] = await this.orderRepository.create({
      data: [{
        ...createOrderDto,
        orderId: randomUUID().slice(0,8),
        products,
        total,
        discount,
        createdBy: user._id,
        coupon: coupon?._id
      }]
    });


    if(!order)
    {
      throw new BadRequestException("Failed to create this order instance");
    }

    const stockProducts: {productId: Types.ObjectId; stock: number}[] = []

    for (const product of cart.products) {
      const updatedProduct = await this.productRepository.findOneAndUpdate({
        filter: {_id: product.productId,stock: {$gte:product.quantity}},
        update: {
          $inc: {__v:1, stock:-product.quantity}
        }
      }) as ProductDocument;
      stockProducts.push({productId: updatedProduct._id, stock: updatedProduct?.stock});
    }

    this.realtimeGateway.changeProductStock(stockProducts);

    await this.cartService.remove(user);

    return order;
  }

  async checkout(orderId: Types.ObjectId, user: UserDocument) {

    const order = await this.orderRepository.findOne({
      filter: {
        _id: orderId,
        createdBy: user._id,
        paymentType: PaymentEnum.Card,
        status: OrderStatusEnum.Pending
      },
      options: {
        populate: [{path:"products.productId",select:"name"}]
      }
    });
    
    if(!order) throw new NotFoundException("Failed to find matching order");

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    if(order.discount)
    {
      const coupon = await this.paymentService.createCoupon({
        duration: "once",
        currency: "egp",
        percent_off: order.discount * 100
      });
      discounts.push({coupon: coupon.id});
    }

    const session = this.paymentService.checkoutSession({
      customer_email: user.email,
      metadata: {orderId: order.orderId.toString()},
      discounts,
      line_items: order.products.map((product) => {
        return {
          quantity: product.quantity,
          price_data: {
            currency: "egp",
            product_data: {
              name: (product.productId as unknown as ProductDocument).name
            },
            unit_amount: product.unitPrice * 100
          }
        }
      })
    });

    const paymentMethod = await this.paymentService.createPaymentMethod({
      type: "card",
      card: {
        token:"tok_visa"
      }
    })

    const paymentIntent = await this.paymentService.createPaymentIntent({
      amount: order.subtotal*100,
      currency: "egp",
      payment_method: paymentMethod.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });

    order.paymentIntent = paymentIntent.id;
    await order.save();  

    return session;
    
  }

  async cancel(orderId: Types.ObjectId, user: UserDocument): Promise<OrderDocument> {

    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: orderId,
        status: {$lt: OrderStatusEnum.Cancelled}
      },
      update: {
        status: OrderStatusEnum.Cancelled,
        updatedBy: user._id
      }
    });

    if(!order)
    {
      throw new NotFoundException("Failed to find matching order");
    }

    for (const product of order.products) {
      await this.productRepository.updateOne({
        filter: {_id: product.productId,stock: {$gte:product.quantity}},
        update: {
          $inc: {__v:1, stock:product.quantity}
        }
      });
    }

    if(order.coupon)
    {
      await this.couponRepository.updateOne({
        filter: {_id: order.coupon},
        update: {
          $pull: {usedBy:order.createdBy}
        }
      })
    }

    if(order.paymentType == PaymentEnum.Card)
    {
      await this.paymentService.refund(order.paymentIntent as string)
    }

    return order as OrderDocument;
  }

  async findAll(data: GetAllGraphDto, archive: boolean=false): Promise<{
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number|undefined;
        result: OrderDocument[] | Lean<OrderDocument>[];
    }> {
    const {page,size,search} = data;
    const result = await this.orderRepository.paginate({
      filter: {
        ...(archive?{paranoid:false,freezedAt:{$exists:true}}:{})
      },
      page,
      size
    })

    return result;
  }

}
