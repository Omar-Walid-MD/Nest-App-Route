import { Controller, Get, MaxFileSizeValidator, ParseFilePipe, Patch, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { cloudFileUpload, fileValidation, IUser, localFileUpload, RoleEnum, successResponse, User } from "src/common";
import type { IResponse } from "src/common";
import { Auth } from "src/common/decorators/auth.decorator";
import type { UserDocument } from "src/DB";
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor, NoFilesInterceptor } from "@nestjs/platform-express";
import { StorageEnum } from "src/common/enums/multer.enum";
import { ProfileResponse } from "./entities/user.entity";

@Auth([])
@Controller("user")

export class UserController {
    constructor(private readonly userService:UserService){}

    
    @Get()
    async profile(
        @User() user: UserDocument
    ): Promise<IResponse<ProfileResponse>>
    {
        const profile = await this.userService.profile(user);
        return successResponse<ProfileResponse>({data:{profile}});
    }

    @UseInterceptors(
        FileInterceptor("profileImage",cloudFileUpload({
            storageApproach:StorageEnum.disk,
            validation:fileValidation.image,
            fileSize:2
        }))
    )
    @Patch("profile-image")
    async profileImage(
        @User() user: UserDocument,
        @UploadedFile(new ParseFilePipe({
            validators: [new MaxFileSizeValidator({maxSize:2*1024*1024})],
            fileIsRequired: true
        })) file: Express.Multer.File
    ): Promise<IResponse<ProfileResponse>>
    {
        const profile = await this.userService.profileImage(file,user);
        return successResponse<ProfileResponse>({data:{profile}});
    }
    

}