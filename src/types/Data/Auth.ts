/**
 * AccessToken is jwt token
 */
export type AccessToken = string;
export type RefreshToken = string;

export interface DecodedToken {
  _id: string;
}
