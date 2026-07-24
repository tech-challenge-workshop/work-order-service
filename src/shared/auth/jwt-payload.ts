export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export interface JwtPayload {
  sub: string
  role: UserRole
}

export interface RequestWithUser {
  user?: JwtPayload
  headers: Record<string, string | undefined>
}
