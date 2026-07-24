import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from './public.decorator'
import { ROLES_KEY } from './roles.decorator'
import { RequestWithUser, UserRole } from './jwt-payload'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles || roles.length === 0) {
      return true
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role')
    }
    return true
  }
}
