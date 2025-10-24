import { Body, Controller, HttpCode, HttpException, HttpStatus, ParseIntPipe, Patch, Post, Query, Redirect, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthenticationService } from "./auth.service";
import { ConfirmEmailBodyDTO, LoginBodyDTO, ResendConfirmEmailBodyDTO, ResetForgotPasswordBodyDTO, SendForgotPasswordBodyDTO, SignupBodyDTO, VerifyForgotPasswordBodyDTO } from "./dto/signup.dto";
import { IResponse, LoginCredentialsResponse, successResponse } from "src/common";
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
    ): Promise<IResponse>
    {
        await this.authenticationService.signup(body);
        return successResponse();
    }


    @HttpCode(HttpStatus.OK)
    @Post("/login")
    async login(@Body() body: LoginBodyDTO): Promise<IResponse<LoginResponse>>
    {
        const credentials = await this.authenticationService.login(body);
        return successResponse<LoginResponse>({data:{credentials}});
    }

    @HttpCode(HttpStatus.OK)
    @Patch("/confirm-email")
    async confirmEmail(@Body() body: ConfirmEmailBodyDTO): Promise<IResponse>
    {
        await this.authenticationService.confirmEmail(body);
        return successResponse();
    }

    @HttpCode(HttpStatus.OK)
    @Patch("/resend-confirm-email")
    async resendConfirmEmail(@Body() body: ResendConfirmEmailBodyDTO): Promise<IResponse>
    {
        await this.authenticationService.resendConfirmEmail(body);
        return successResponse();
    }

    @HttpCode(201)
    @Patch("/send-forgot-password")
    async sendForgotPasswordCode(@Body() body: SendForgotPasswordBodyDTO): Promise<IResponse>
    {
        await this.authenticationService.sendForgotPasswordCode(body);
        return successResponse();
    }

    @HttpCode(201)
    @Patch("/verify-forgot-password")
    async verifyForgotPasswordCode(@Body() body: VerifyForgotPasswordBodyDTO): Promise<IResponse>
    {
        await this.authenticationService.verifyForgotPasswordCode(body);
        return successResponse();
    }

    @HttpCode(201)
    @Patch("/reset-forgot-password")
    async resetForgotPassword(@Body() body: ResetForgotPasswordBodyDTO): Promise<IResponse>
    {
        await this.authenticationService.resetForgotPassword(body);
        return successResponse();
    }
}