import { Injectable } from "@nestjs/common";
import {compare, hash} from "bcrypt";

@Injectable()
export class SecurityService
{
    constructor(){}


    generateHash = async (plaintext:string, saltRound:number = parseInt(process.env.SALT as string)): Promise<string> => {
    
        return await hash(plaintext,saltRound);
    }
    
    compareHash = async (plaintext:string, hashValue:string, saltRound:number = parseInt(process.env.SALT as string)): Promise<boolean> => {
    
        return await compare(plaintext,hashValue);
    }
}
