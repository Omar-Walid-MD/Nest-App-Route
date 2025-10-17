import { Controller, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { IUser, RoleEnum, User } from "src/common";
import { Auth } from "src/common/decorators/auth.decorator";
import type { UserDocument } from "src/DB";

@Controller("user")

export class UserController {
    constructor(private readonly userService:UserService){}

    @Get()
    allUsers():{message:string,data:{users:IUser[]}}
    {
        const users: IUser[] = this.userService.allUsers()
        return {message:"Done",data:{users}}
    }

    @Auth([RoleEnum.admin, RoleEnum.user])
    @Get()
    profile(
        @User() user: UserDocument
    )
    {
        console.log({user});
        return {message:"Done"};
    }
}