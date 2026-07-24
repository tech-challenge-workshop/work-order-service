import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from './public.decorator'
import { JwtPayload, RequestWithUser } from './jwt-payload'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const token = this.extractToken(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedException('Missing bearer token')
    }

    try {
      request.user = this.jwtService.verify<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
    return true
  }

  private extractToken(header: string | undefined): string | null {
    if (!header) {
      return null
    }
    const [scheme, value] = header.split(' ')
    return scheme === 'Bearer' && value ? value : null
  }
}
