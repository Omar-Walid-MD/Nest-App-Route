import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsStrongPassword, Length, Matches, MinLength, registerDecorator, ValidateIf, ValidationOptions } from "class-validator";
import { IsMatch } from "src/common";

export class LoginBodyDTO
{
    @IsEmail()
    email:string;
    @IsStrongPassword()
    password:string;
}

export class SignupBodyDTO extends LoginBodyDTO {

    @Length(2,52,{message:"Username min length is 2 and max length is 52"})
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    username: string;

    @ValidateIf((data:SignupBodyDTO)=>{
        return Boolean(data.password)
    })

    @IsMatch(["password"],{message:"Password mismatch"})
    confirmPassword: string;
}

export class ResendConfirmEmailBodyDTO
{
    @IsEmail()
    email:string;
}

export class ConfirmEmailBodyDTO extends ResendConfirmEmailBodyDTO
{
    @Matches(/^\d{6}$/)
    @IsString()
    code:string;
}



export class SendForgotPasswordBodyDTO extends ResendConfirmEmailBodyDTO
{

}

export class VerifyForgotPasswordBodyDTO extends ConfirmEmailBodyDTO
{
    
}

export class ResetForgotPasswordBodyDTO extends VerifyForgotPasswordBodyDTO
{
    @IsStrongPassword()
    password:string;

    confirmPassword: string;
}