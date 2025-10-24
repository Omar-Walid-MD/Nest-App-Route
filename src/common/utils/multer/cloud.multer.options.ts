import type { Request } from "express";
import { diskStorage, memoryStorage } from "multer";
import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { StorageEnum } from "src/common";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export const cloudFileUpload = ({
    validation = [],
    fileSize = 2,
    storageApproach = StorageEnum.memory
}: {
    folder?: string;
    validation: string[];
    fileSize?: number;
    storageApproach?: StorageEnum
}): MulterOptions => {
    return {
        storage: storageApproach === StorageEnum.memory
            ? memoryStorage()
            : diskStorage({
                destination: tmpdir(),
                filename: function (req: Request, file: Express.Multer.File, callback) {
                    return callback(null, `${randomUUID()}_${file.originalname}`);
                }
            }),

        fileFilter(req: Request, file: Express.Multer.File, callback: Function) {
            if (!validation.includes(file.mimetype)) {
                throw callback(new BadRequestException("Invalid file format"));
            }
            return callback(null, true);

        },
        limits: {
            fileSize: fileSize * 1024 * 1024
        }
    }
}