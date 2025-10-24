import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { IMulterFile } from "src/common/interface";
import type {Request} from "express";
import { diskStorage } from "multer";
import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

export const localFileUpload = ({
    folder="public",
    validation=[],
    fileSize = 2
}: {
    folder?: string;
    validation: string[];
    fileSize?:number;
}): MulterOptions => {
    let basePath = `uploads/${folder}`;
    return  {
        storage: diskStorage({

            destination(req:Request,file:Express.Multer.File, callback: Function)
            {
                const fullPath = path.resolve(`./${basePath}`);
                if(existsSync(fullPath))
                {
                    mkdirSync(fullPath,{recursive:true});
                }
                callback(null,fullPath);
            },
            filename(req:Request,file:IMulterFile, callback: Function)
            {
                const filename = randomUUID() + "_" + Date.now() + "_" + file.originalname;
                file.finalPath = basePath + `/${filename}`;
                callback(null,filename);
            }
        }),

        fileFilter(req: Request, file: Express.Multer.File, callback: Function)
        {
            if(!validation.includes(file.mimetype))
            {
                throw callback(new BadRequestException("Invalid file format"));
            }
            return callback(null,true);

        },

        limits: {
            fileSize: fileSize * 1024 * 1024
        }
    }
}