import data from './noindex-routes.json';

/** True when `path` is listed in noindex-routes.json. */
export function isNoindexRoute(path: string): boolean {
  const p = path.endsWith('/') ? path : path + '/';
  return (data.routes as string[]).includes(p);
}
