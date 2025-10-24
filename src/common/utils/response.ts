import { IResponse } from "../interface";

export const successResponse = <T=any>({data, message="Done",status=200}:IResponse<T>={}) => {

    return {message, status, data};
}