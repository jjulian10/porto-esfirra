import { env } from 'cloudflare:workers';

export function isAdmin(request: Request) {
  const allowed = (env as Cloudflare.Env & { ADMIN_EMAIL?: string }).ADMIN_EMAIL?.trim().toLowerCase();
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(allowed && email && email === allowed);
}
