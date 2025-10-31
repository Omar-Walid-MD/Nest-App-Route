import { Injectable } from "@nestjs/common";
import { IUser, S3Service, StorageEnum } from "src/common";
import { UserDocument, UserRepository } from "src/DB";

@Injectable()
export class UserService {
    constructor(
        private readonly s3Service: S3Service,
        private readonly userRepository: UserRepository
    ){}

    async profile(user: UserDocument): Promise<UserDocument>
    {
        const profile = await this.userRepository.findOne({
            filter: {_id: user._id},
            options: {
                populate: [{path:"wishlist"}]
            }
        }) as UserDocument;
        return profile;
    }

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