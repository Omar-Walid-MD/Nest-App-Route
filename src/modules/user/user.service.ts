import { Injectable } from "@nestjs/common";
import { IUser, S3Service, StorageEnum } from "src/common";
import { UserDocument } from "src/DB";

@Injectable()
export class UserService {
    constructor(private readonly s3Service: S3Service){}

    async profileImage(file: Express.Multer.File, user: UserDocument): Promise<UserDocument>
    {
        user.profileImage = await this.s3Service.uploadFile({
            file,
            path: `user/${user._id.toString()}`,
            storageApproach: StorageEnum.disk
        });
        await user.save();
        return user;
    }
}