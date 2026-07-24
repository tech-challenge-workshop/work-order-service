import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { JwtPayload, RequestWithUser } from './jwt-payload'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    return ctx.switchToHttp().getRequest<RequestWithUser>().user
  },
)
