import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { GenderEnum, generateHash, ProviderEnum, RoleEnum } from "src/common";
import { OtpDocument } from "./otp.model";

@Schema({
    strictQuery:true,
    timestamps:true,
    toObject:{virtuals:true},
    toJSON: {virtuals:true}
})
export class User
{
    @Prop({type:String,required:true,minlength:2,maxlength:25,trim:true})
    firstName: string;

    @Prop({type:String,required:true,minlength:2,maxlength:25,trim:true})
    lastName: string;

    @Virtual({
        get: function(this:User)
        {
            return this.firstName + " " + this.lastName;
        },
        set: function(value:String)
        {
            const [firstName, lastName] = value.split(" ") || [];
            this.set({firstName,lastName});
        }
    })
    username: string;

    @Prop({type:String,required:true,unique:true})
    email: string;

    @Prop({type:Date,required:false})
    confirmEmail: Date;

    @Prop({type:String,required:false})
    confirmEmailOtp: String;

    @Prop({type:String,required:false})
    resetPasswordOtp: String;

    @Prop({type:Date,required:false})
    changeCredentialsTime: Date;

    @Prop({
        type:String,
        required: function(this:User)
        {
            return this.provider !== ProviderEnum.GOOGLE;
        }
    })
    password: string;

    @Prop({type:String, enum: GenderEnum, default: GenderEnum.male})
    gender: GenderEnum;

    @Prop({type:String, enum: ProviderEnum, default: ProviderEnum.SYSTEM})
    provider: ProviderEnum;

    @Prop({type:String, enum:RoleEnum, default: RoleEnum.user})
    role: RoleEnum

    @Virtual()
    otp: OtpDocument[];
}


const userSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User>;

userSchema.virtual("otp",{
    localField: "_id",
    foreignField: "createdBy",
    ref: "Otp"
})

userSchema.pre("save", async function(next){
    if(this.isModified("password"))
    {
        this.password = await generateHash(this.password)
    }
    next()
});

export const UserModel = MongooseModule.forFeature([
    {name:User.name,schema:userSchema}
]);