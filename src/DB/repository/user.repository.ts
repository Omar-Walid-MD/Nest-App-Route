import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { User, UserDocument as TDocument } from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UserRepository extends DatabaseRepository<TDocument>
{
    constructor(@InjectModel(User.name) protected override readonly model: Model<TDocument>)
    {
        super(model);
    }
}
