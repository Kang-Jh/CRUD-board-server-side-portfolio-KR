import jwt from 'jsonwebtoken';

export function promisifyJWTSign(
  payload: string | any | Buffer,
  secretOrPrivateKey: jwt.Secret,
  options?: jwt.SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (options) {
      jwt.sign(payload, secretOrPrivateKey, options, (err, encoded) => {
        if (err) {
          reject(err);
          return;
        }

        if (encoded) {
          resolve(encoded);
        }
      });
      return;
    }

    jwt.sign(
      payload,
      secretOrPrivateKey,
      (err: Error | null, encoded: string | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        if (encoded) {
          resolve(encoded);
        }
      }
    );
  });
}

export function promisifyJWTVerify(
  token: string,
  secretOrPrivateKey: jwt.Secret,
  options?: jwt.SignOptions
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (options) {
      jwt.verify(token, secretOrPrivateKey, options, (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }

        if (decoded) {
          resolve(decoded);
        }
      });
      return;
    }

    jwt.verify(token, secretOrPrivateKey, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }

      if (decoded) {
        resolve(decoded);
      }
    });
  });
}
