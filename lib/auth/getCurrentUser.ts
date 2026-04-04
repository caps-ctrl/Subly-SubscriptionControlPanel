import { verifyAccessToken } from "./jwt";
import { getAuthUserById } from "./user";

export async function getCurrentUser(token: string) {
  const session = await verifyAccessToken(token);
  if (!session) return null;

  return getAuthUserById(session.id);
}
