import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tokenName } from 'src/common/decorators';
import { RoleEnum, TokenEnum } from 'src/common/enums';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) { }

  canActivate(context: ExecutionContext): boolean {

    const accessRoles: RoleEnum[] = this.reflector.getAllAndOverride<RoleEnum[]>("roles",[context.getHandler(),context.getClass()]) ?? [];

    let req: any;
    let authorization: string = "";
    let role: RoleEnum = RoleEnum.user;
    switch (context.getType()) {
      case "http":
        role = context.switchToHttp().getRequest().credentials.user.role;
        break;
      // case "rpc":
      //   const RPC_ctx = context.switchToRpc();
      //   break;
      // case "ws":
      //   const WS_ctx = context.switchToWs();
      //   break;

      default:
        break;
    }

    return accessRoles.includes(role);
  }
}
