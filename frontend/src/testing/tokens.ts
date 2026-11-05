import { Role } from '../app/core/models';

/** Fabrique un JWT non signe, suffisant pour les tests du front (qui ne verifie pas la signature). */
export function fakeToken(username: string, roles: Role[] = ['ROLE_USER'], expiresInSeconds = 3600): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'HS256' })}.${encode({ sub: username, roles, exp })}.signature`;
}
