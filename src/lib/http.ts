/**
 * Origine publique d'une requête. Derrière Cloud Run, request.url vaut
 * http://0.0.0.0:8080 : il faut reconstruire l'origine vue par le
 * navigateur depuis les en-têtes x-forwarded-* posés par le proxy.
 */
export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
