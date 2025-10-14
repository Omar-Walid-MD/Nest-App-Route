import {compare, hash} from "bcrypt";

export const generateHash = async (plaintext:string, saltRound:number = parseInt(process.env.SALT as string)): Promise<string> => {

    return await hash(plaintext,saltRound);
}

export const compareHash = async (plaintext:string, hashValue:string, saltRound:number = parseInt(process.env.SALT as string)): Promise<boolean> => {

    return await compare(plaintext,hashValue);
}