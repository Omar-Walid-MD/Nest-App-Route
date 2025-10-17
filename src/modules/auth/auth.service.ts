import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { compareHash, generateHash, IUser, LoginCredentialsResponse, OtpEnum, ProviderEnum } from "src/common";
import { User, UserDocument } from "src/DB/model";
import { ConfirmEmailBodyDTO, LoginBodyDTO, ResendConfirmEmailBodyDTO, ResetForgotPasswordBodyDTO, SendForgotPasswordBodyDTO, SignupBodyDTO, VerifyForgotPasswordBodyDTO } from "./dto/signup.dto";
import { OtpRepository, UserRepository } from "src/DB";
// import { createLoginCredentials } from "src/common/utils/security/token.service";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { createNumericalOtp } from "src/common/utils";
import { emailEvent } from "src/common/utils/email/email.event";
import { Types } from "mongoose";
import { TokenService } from "src/common/utils/security/token.service";

@Injectable()
export class AuthenticationService
{
    private users: IUser[] = [];
    constructor(
        private readonly userRepository:UserRepository,
        private readonly otpRepository:OtpRepository,
        private readonly tokenService: TokenService
    ){}

    private async createConfirmEmailOtp(userId: Types.ObjectId)
    {
        await this.otpRepository.create({
            data: [{
                code: createNumericalOtp(),
                expiredAt: new Date(Date.now()+2*60*1000),
                createdBy: userId,
                type: OtpEnum.ConfirmEmail

            }]
        });
    }

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

        const [user] = await this.userRepository.create({
            data: [{
                username,
                email,
                password
            }]
        });

        if(!user)
        {
            throw new BadRequestException("Failed to signup this account. Please try again later");
        }

        await this.createConfirmEmailOtp(user._id);

        return "Done";
    }

    login = async (data: LoginBodyDTO): Promise<LoginCredentialsResponse> =>
    {
        const {email, password} = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmEmail: {$exists:true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid Login data");
        }
        
        if(!await compareHash(password,user.password))
        {
            throw new NotFoundException("Invalid Login data");
        }
 
      
        return await this.tokenService.createLoginCredentials(user as UserDocument);

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

        return await this.tokenService.createLoginCredentials(user as UserDocument);
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

        return await this.tokenService.createLoginCredentials(newUser);
    }


    confirmEmail = async (data: ConfirmEmailBodyDTO): Promise<string> =>
    {
        const {email, code} = data;

        const user = await this.userRepository.findOne({
            filter: {
                email,
                confirmedAt: {
                    $exists: false
                }
            },
            options: {
                populate: [{path:"otp",match:{type:OtpEnum.ConfirmEmail}}]
            }
        });

        if(!user) throw new NotFoundException("Failed to find matching account");

        if(!user.otp?.length || !(await compareHash(code,user.otp[0].code)))
        {
            throw new BadRequestException("Invalid OTP");
        }
        
        user.confirmEmail = new Date();
        await user.save();
        await this.otpRepository.deleteOne({
            filter:{_id:user.otp[0]._id}
        });


        return "Done";

    };


    resendConfirmEmail = async (data: ResendConfirmEmailBodyDTO) => {

        const {email} = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                confirmedAt: {
                    $exists: false
                }
            },
            options: {
                populate: [{path:"otp",match:{type:OtpEnum.ConfirmEmail}}]
            }
        });

        if(!user) throw new NotFoundException("Failed to find matching account");

        if(user.otp?.length) throw new NotFoundException("Sorry we cannot create new OTP while there is still a valid OTP");

        await this.createConfirmEmailOtp(user._id);

        return "Done";

    };

    sendForgotPasswordCode = async (data: SendForgotPasswordBodyDTO): Promise<string> =>
    {
        const {email} = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        await this.otpRepository.create({
            data: [{
                code: createNumericalOtp(),
                expiredAt: new Date(Date.now()+2*60*1000),
                createdBy: user._id,
                type: OtpEnum.ResetPassword

            }]
        });

        return "Done";

    };

    verifyForgotPasswordCode = async (data: VerifyForgotPasswordBodyDTO): Promise<string> =>
    {
        const {code, email} = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true},
            },
            options: {
                populate: [{path:"otp",match:{type:OtpEnum.ResetPassword}}]
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        if(!user.otp?.length || !(await compareHash(code,user.otp[0].code)))
        {
            throw new BadRequestException("Invalid OTP");
        }

        return "Done";
    };

    resetForgotPassword = async (data: ResetForgotPasswordBodyDTO): Promise<string> =>
    {
        const {code, email, password} = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmedAt: {$exists: true},
                resetPasswordOtp: {$exists: true}
            }
        });

        if(!user)
        {
            throw new NotFoundException("Invalid account");
        }

        if(!user.otp?.length || !(await compareHash(code,user.otp[0].code)))
        {
            throw new BadRequestException("Invalid OTP");
        }
        
        await this.otpRepository.deleteOne({
            filter:{_id:user.otp[0]._id}
        });

        const result = await this.userRepository.updateOne({
            filter: {email},
            update: {
                $unset: {resetPasswordOtp: true},
                changeCredentialsTime: new Date(),
                password: await generateHash(password)
            }
        });

        if(!result.matchedCount)
        {
            throw new BadRequestException("Failed to reset password");
        }

        return "Done";
    };
}