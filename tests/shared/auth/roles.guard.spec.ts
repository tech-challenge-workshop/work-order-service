import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from '../../../src/shared/auth/roles.guard'
import { UserRole } from '../../../src/shared/auth/jwt-payload'
import { IS_PUBLIC_KEY } from '../../../src/shared/auth/public.decorator'

function contextWith(user?: { role: UserRole }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext
}

function guard(roles: UserRole[] | undefined, isPublic = false): RolesGuard {
  const reflector = {
    getAllAndOverride: (key: string) => (key === IS_PUBLIC_KEY ? isPublic : roles),
  } as unknown as Reflector
  return new RolesGuard(reflector)
}

describe('RolesGuard', () => {
  it('allows public routes even when a role is required', () => {
    expect(guard([UserRole.ADMIN], true).canActivate(contextWith())).toBe(true)
  })

  it('allows routes without a role requirement', () => {
    expect(guard(undefined).canActivate(contextWith())).toBe(true)
    expect(guard([]).canActivate(contextWith({ role: UserRole.CUSTOMER }))).toBe(true)
  })

  it('allows a user whose role is accepted', () => {
    expect(guard([UserRole.ADMIN]).canActivate(contextWith({ role: UserRole.ADMIN }))).toBe(true)
  })

  it('rejects a user with an insufficient role', () => {
    expect(() =>
      guard([UserRole.ADMIN]).canActivate(contextWith({ role: UserRole.CUSTOMER })),
    ).toThrow(ForbiddenException)
  })

  it('rejects when there is no authenticated user', () => {
    expect(() => guard([UserRole.ADMIN]).canActivate(contextWith())).toThrow(ForbiddenException)
  })
})
