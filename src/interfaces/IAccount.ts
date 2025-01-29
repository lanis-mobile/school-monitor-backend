export interface IAccount {
  id: number,
  github_username: string,
  admin: boolean,
  totp_secret: string,
  created_at: Date,
  last_login: Date
}