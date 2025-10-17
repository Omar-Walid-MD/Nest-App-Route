import { SetMetadata } from "@nestjs/common"
import { RoleEnum, TokenEnum } from "../enums"

export const roleName = "roles";
export const Roles = (roles: RoleEnum[]) => {
    return SetMetadata(roleName,roles);
}