export function getAccessToken(
  authorizationHeader: string | undefined
): string {
  if (!authorizationHeader) {
    return '';
  }

  return authorizationHeader.split(' ')[1];
}
