import { Injectable } from "@nestjs/common";
import { IUser } from "src/common";

@Injectable()
export class UserService {
    constructor(){}

    allUsers(): IUser[]
    {
        return [
            {id:"1",username:"owmd",email:"owmd@email.com",password:"1234"}
        ]
    }
}