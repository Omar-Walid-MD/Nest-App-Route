import { EventEmitter } from "node:events";
import { sendEmail } from "./send.email";
import { verifyEmailTemplate } from "./templates/verify.email.template";
import Mail from "nodemailer/lib/mailer";
import { OtpEnum } from "src/common/enums";
export const emailEvent = new EventEmitter();


interface IOTPEmail extends Mail.Options {
    otp: string;
}

emailEvent.on(OtpEnum.ConfirmEmail,async(data: IOTPEmail)=>{

    try {
        data.subject = OtpEnum.ConfirmEmail;
        data.html = verifyEmailTemplate({
            otp: data.otp,
            title: data.subject
        });
        await sendEmail(data);

    } catch (error) {
        console.log("Failed to send email", error);
    }

})

emailEvent.on(OtpEnum.ResetPassword,async(data: IOTPEmail)=>{

    try {
        data.subject = OtpEnum.ResetPassword;
        data.html = verifyEmailTemplate({
            otp: data.otp,
            title: data.subject
        })
        await sendEmail(data);

    } catch (error) {
        console.log("Failed to send email", error);
    }
});
