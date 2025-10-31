import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Request } from "express";
import Stripe from "stripe";

@Injectable()
export class PaymentService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET as string)
    }

    async checkoutSession({
        customer_email,
        success_url=process.env.SUCCESS_URL as string,
        cancel_url=process.env.CANCEL_URL as string,
        metadata={},
        discounts=[],
        mode="payment",
        line_items }: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session>
    {
        const session = await this.stripe.checkout.sessions.create({customer_email, success_url, cancel_url, metadata, discounts, mode, line_items});
        return session;
    }

    async createCoupon(data: Stripe.CouponCreateParams): Promise<Stripe.Coupon>
    {
        const coupon = await this.stripe.coupons.create(data);
        console.log({coupon});
        return coupon;
    }

    async webhook(req: Request)
    {
        const endpointSecret = process.env.STRIPE_HOOK_SECRET as unknown as string;
        const sig = req.headers["stripe-signature"];
        let event: Stripe.Event = this.stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);

        if(event.type !== "checkout.session.completed")
        {
            throw new BadRequestException("Payment failed");
        }

        return event;

    }

    async createPaymentIntent(data: Stripe.PaymentIntentCreateParams): Promise<Stripe.Response<Stripe.PaymentIntent>>
    {
        const paymentIntent = await this.stripe.paymentIntents.create(data);
        return paymentIntent;
    }

    async createPaymentMethod(data: Stripe.PaymentMethodCreateParams): Promise<Stripe.Response<Stripe.PaymentMethod>>
    {
        const paymentMethod = await this.stripe.paymentMethods.create(data);
        return paymentMethod;
    }

    async retreiveIntent(id: string): Promise<Stripe.Response<Stripe.PaymentIntent>>
    {
        const intent = await this.stripe.paymentIntents.retrieve(id);
        return intent;
    }

    async confirmPaymentIntent(id: string): Promise<Stripe.Response<Stripe.PaymentIntent>>
    {
        const intent = await this.retreiveIntent(id);
        if(intent?.status !== "requires_confirmation")
        {
            throw new NotFoundException("Failed to find matching payment intent");
        }
        const confirm = await this.stripe.paymentIntents.confirm(id);
        return confirm;
    }

    async refund(id: string): Promise<Stripe.Response<Stripe.Refund>>
    {
        const intent = await this.retreiveIntent(id);
        if(intent?.status !== "succeeded")
        {
            throw new NotFoundException("Failed to find matching payment intent");
        }
        const refund = await this.stripe.refunds.create({payment_intent: intent.id});
        return refund;
    }

}