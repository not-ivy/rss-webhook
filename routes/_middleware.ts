import { FreshContext } from "$fresh/server.ts";
import helpers from "../utils/oauth.ts";

export interface State {
  session?: string;
  id?: string;
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>,
) {
  const session = await helpers.getSessionId(req);
  if (!session) return;
  ctx.state.session = session;
  return ctx.next();
}
