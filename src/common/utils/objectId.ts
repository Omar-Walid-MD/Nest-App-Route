import { Types } from "mongoose";

export const parseObjectId = (id: string): Types.ObjectId => {
    return Types.ObjectId.createFromHexString(id);
}