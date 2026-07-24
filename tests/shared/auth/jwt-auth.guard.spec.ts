import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { JwtAuthGuard } from '../../../src/shared/auth/jwt-auth.guard'

function contextWith(authorization?: string): ExecutionContext {
  const request = { headers: { authorization }, user: undefined }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext
}

function guard(isPublic: boolean, verify: jest.Mock): JwtAuthGuard {
  const reflector = { getAllAndOverride: () => isPublic } as unknown as Reflector
  const jwtService = { verify } as unknown as JwtService
  return new JwtAuthGuard(reflector, jwtService)
}

describe('JwtAuthGuard', () => {
  it('allows public routes without a token', () => {
    const verify = jest.fn()
    expect(guard(true, verify).canActivate(contextWith())).toBe(true)
    expect(verify).not.toHaveBeenCalled()
  })

  it('rejects a request without a bearer token', () => {
    expect(() => guard(false, jest.fn()).canActivate(contextWith())).toThrow(UnauthorizedException)
  })

  it('accepts a valid token and attaches the payload', () => {
    const verify = jest.fn().mockReturnValue({ sub: 'u-1', role: 'admin' })
    const context = contextWith('Bearer good-token')

    expect(guard(false, verify).canActivate(context)).toBe(true)
    expect(verify).toHaveBeenCalledWith('good-token')
  })

  it('rejects an invalid token', () => {
    const verify = jest.fn().mockImplementation(() => {
      throw new Error('bad')
    })
    expect(() => guard(false, verify).canActivate(contextWith('Bearer bad'))).toThrow(
      UnauthorizedException,
    )
  })
})
