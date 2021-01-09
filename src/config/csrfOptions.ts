import { CookieOptions } from 'csurf';
import { Request } from 'express';
import ms from 'ms';

interface CsurfOptions {
  value?: (req: Request) => string;
  cookie?: CookieOptions | boolean;
  ignoreMethods?: string[];
  sessionKey?: string;
}

const csurfOptions: CsurfOptions = {
  cookie: {
    // TODO if your server is running on HTTPS then you can enable secure options
    /* secure: true, */
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ms('1h') / 1000,
  },
};

export default csurfOptions;
