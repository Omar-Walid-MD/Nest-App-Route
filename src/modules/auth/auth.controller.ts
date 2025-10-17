import { Body, Controller, HttpCode, HttpException, HttpStatus, ParseIntPipe, Patch, Post, Query, Redirect, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthenticationService } from "./auth.service";
import { ConfirmEmailBodyDTO, LoginBodyDTO, ResendConfirmEmailBodyDTO, ResetForgotPasswordBodyDTO, SendForgotPasswordBodyDTO, SignupBodyDTO, VerifyForgotPasswordBodyDTO } from "./dto/signup.dto";
import { LoginCredentialsResponse } from "src/common";
import { LoginResponse } from "./entities/auth.entity";



@Controller("auth")
export class AuthenticationController
{
    constructor(private readonly authenticationService: AuthenticationService){}

    @HttpCode(201)
    @Post("signup")
    async signup(
        @Body()
        body: SignupBodyDTO
    ): Promise<{message:string;}>
    {
        await this.authenticationService.signup(body);
        return {message:"Done"};
    }


    @HttpCode(HttpStatus.OK)
    @Post("/login")
    async login(@Body() body: LoginBodyDTO): Promise<LoginResponse>
    {
        const data = await this.authenticationService.login(body);
        return {message:"Done",data};
    }

    @HttpCode(HttpStatus.OK)
    @Patch("/confirm-email")
    async confirmEmail(@Body() body: ConfirmEmailBodyDTO)
    {
        await this.authenticationService.confirmEmail(body);
        return {message:"Done"};
    }

    @HttpCode(HttpStatus.OK)
    @Patch("/resend-confirm-email")
    async resendConfirmEmail(@Body() body: ResendConfirmEmailBodyDTO)
    {
        await this.authenticationService.resendConfirmEmail(body);
        return {message:"Done"};
    }

    @HttpCode(201)
    @Patch("/send-forgot-password")
    async sendForgotPasswordCode(@Body() body: SendForgotPasswordBodyDTO)
    {
        await this.authenticationService.sendForgotPasswordCode(body);
        return {message:"Done"};
    }

    @HttpCode(201)
    @Patch("/verify-forgot-password")
    async verifyForgotPasswordCode(@Body() body: VerifyForgotPasswordBodyDTO)
    {
        await this.authenticationService.verifyForgotPasswordCode(body);
        return {message:"Done"};
    }

    @HttpCode(201)
    @Patch("/reset-forgot-password")
    async resetForgotPassword(@Body() body: ResetForgotPasswordBodyDTO)
    {
        await this.authenticationService.resetForgotPassword(body);
        return {message:"Done"};
    }
}