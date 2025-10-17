import { BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { IAuthRequest } from '../interface/token.interface';

export const PreAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    return async(req: IAuthRequest, res: Response, next: NextFunction) => {
        if(!(req.headers.authorization?.split(" ")?.length == 2))
        {
            throw new BadRequestException("Missing authorization key");
        }
        next();
    }
}