import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { compareHash, generateHash, IUser, ProviderEnum } from "src/common";
import { User, UserDocument } from "src/DB/model";
import { ConfirmEmailBodyDTO, LoginBodyDTO, ResendConfirmEmailBodyDTO, ResetForgotPasswordBodyDTO, SendForgotPasswordBodyDTO, SignupBodyDTO, VerifyForgotPasswordBodyDTO } from "./dto/signup.dto";
import { UserRepository } from "src/DB";
import { createLoginCredentials } from "src/common/utils/security/token.security";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { generateNumberOtp } from "src/common/utils/otp";
import { emailEvent } from "src/common/events/email.events";

@Injectable()
export class AuthenticationService
{
    private users: IUser[] = [];
    constructor(
        private readonly userRepository:UserRepository
    ){}

    async signup(data:SignupBodyDTO): Promise<string>
    {
        const {email, password, username} = data;
        const checkUserExist = await this.userRepository.findOne({
            filter: {email}
        });
        if(checkUserExist)
        {
            throw new ConflictException("Email already exists");
        }

        const otp = generateNumberOtp();

        const [user] = await this.userRepository.create({
            data: [{
                username,
                email,
                password,
                confirmEmailOtp: await generateHash(String(otp))
            }]
        });

        if(!user)
        {
            throw new BadRequestException("Failed to signup this account. Please try again later");
        }

        emailEvent.emit("confirmEmail",{
            to: email,
            otp
        });

        return "Done";
    }

    login = async (data: LoginBodyDTO): Promise<{access_token:string;refresh_token:string;}> =>
    {    
        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                provider: ProviderEnum.SYSTEM,
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid Login data");
        }

        if(!user.confirmEmail)
        {
            throw new BadRequestException("Please verify your account first");
        }
        
        if(!await compareHash(data.password,user.password))
        {
            throw new NotFoundException("Invalid Login data");
        }

        
        const credentials = await createLoginCredentials(user as UserDocument);
        return credentials;
        

    };

    private async verifyGmailAccount(idToken: string): Promise<TokenPayload>
    {
        const client = new OAuth2Client();
        
        const ticket = await client.verifyIdToken({
            idToken,
            audience: (process.env.WEB_CLIENT_IDS as string).split(",") || [],  // Specify the WEB_CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();

        if(!payload?.email_verified)
        {
            throw new BadRequestException("Failed to verify this google account");
        }

        return payload;
    }

    loginWithGmail = async (data:any): Promise<{access_token:string;refresh_token:string;}> => {

        const {email}: Partial<TokenPayload> = await this.verifyGmailAccount(data.id);

        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.GOOGLE
            },
        });

        if(!user)
        {
            throw new NotFoundException("Not registered account or registered with another provider");
        }

        const credentials = await createLoginCredentials(user as UserDocument);

        return credentials;
    }

    signupWithGmail = async (data:any): Promise<{access_token:string;refresh_token:string;}> => {

        const {email, family_name, given_name, picture}: Partial<TokenPayload> = await this.verifyGmailAccount(data.id);

        const user = await this.userRepository.findOne({
            filter: {email},
        });

        if(user)
        {
            if(user.provider === ProviderEnum.GOOGLE)
            {
                return await this.loginWithGmail(data);
            }
            throw new ConflictException(`Email exists with another provider: ${user.provider}`);
        }

        const [newUser] = await this.userRepository.create({
            data: [{
                email: email as string,
                firstName:given_name as string,
                lastName: family_name as string,
                confirmEmail: new Date(),
                provider: ProviderEnum.GOOGLE
            }]
        }) || [];

        if(!newUser) throw new BadRequestException("Faile to signup with Gmail. Please try again later.");

        const credentials = await createLoginCredentials(newUser);

        return credentials;
    }


    confirmEmail = async (data: ConfirmEmailBodyDTO): Promise<string> =>
    {
        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                confirmEmail: {
                    $exists: false
                },
                confirmEmailOtp: {
                    $exists: true
                }
            }
        });

        if(!user) throw new NotFoundException("Invalid account or already verified");


        if(!await compareHash(data.otp,String(user.confirmEmailOtp)))
        {

            throw new ConflictException("Invalid confirmation code");
        }

        const updatedUser = await this.userRepository.updateOne({
            filter: {email:data.email},
            update: {
                confirmEmail: new Date(),
                $unset: {confirmEmailOtp: true}
            }
        });

        if(!updatedUser) throw new BadRequestException("Fail to confirm user email");

        return "Done";

    };


    resendConfirmEmail = async (data: ResendConfirmEmailBodyDTO) => {


        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                confirmedAt: {
                    $exists: false
                },
                confirmEmailOtp: {
                    $exists: true
                }
            }
        });

        if(!user) throw new NotFoundException("Invalid account or already verified");

        const otp = generateNumberOtp();

        await this.userRepository.updateOne({
            filter: {email:data.email},
            update: {
                confirmEmailOtp: await generateHash(String(otp))
            }
        });

        emailEvent.emit("confirmEmail",{
            to: data.email,
            otp
        });

        return "Done";

    };

    sendForgotPasswordCode = async (data: SendForgotPasswordBodyDTO): Promise<string> =>
    {    
        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        const otp = generateNumberOtp();

        const result = await this.userRepository.updateOne({
            filter: {email:data.email},
            update: {
                resetPasswordOtp: await generateHash(String(otp))
            }
        });

        if(!result.matchedCount)
        {
            throw new BadRequestException("Failed to send reset code. Please try again later");
        }

        emailEvent.emit("sendResetPassword",{to:data.email,otp})

        return "Done";

    };

    verifyForgotPasswordCode = async (data: VerifyForgotPasswordBodyDTO): Promise<string> =>
    {    
        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true},
                resetPasswordOtp: {$exists: true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        if(!await compareHash(data.otp, user.resetPasswordOtp as string))
        {
            throw new ConflictException("Invalid OTP");
        }

        return "Done";
    };

    resetForgotPassword = async (data: ResetForgotPasswordBodyDTO): Promise<string> =>
    {    
        const user = await this.userRepository.findOne({
            filter: {
                email: data.email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true},
                resetPasswordOtp: {$exists: true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        if(!await compareHash(data.otp, user.resetPasswordOtp as string))
        {
            throw new ConflictException("Invalid OTP");
        }

        const result = await this.userRepository.updateOne({
            filter: {email:data.email},
            update: {
                $unset: {resetPasswordOtp: true},
                changeCredentialsTime: new Date(),
                password: await generateHash(data.password)
            }
        });

        if(!result.matchedCount)
        {
            throw new BadRequestException("Failed to reset password");
        }

        return "Done";
    };
}