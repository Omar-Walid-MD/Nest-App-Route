import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
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
    switch (context.getType<string>()) {
      case "http":
        role = context.switchToHttp().getRequest().credentials.user.role;
        break;
      // case "rpc":
      //   const RPC_ctx = context.switchToRpc();
      //   break;
      case "ws":
        role = context.switchToWs().getClient().credentials.user.role;
        break;
      case "graphql":
        req = GqlExecutionContext.create(context).getContext().req;
        authorization = req.headers.authorization;
        break;

      default:
        break;
    }

    return accessRoles.includes(role);
  }
}
