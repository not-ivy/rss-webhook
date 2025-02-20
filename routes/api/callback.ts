import { Handlers } from "$fresh/server.ts";
import helpers from "../../utils/oauth.ts";

export const handler: Handlers = {
  async GET(req, _) {
    const res = await helpers.handleCallback(req);
    const kv = await Deno.openKv();
    await kv.set(
      ["tokens", res.sessionId],
      `${res.tokens.tokenType} ${res.tokens.accessToken}`,
      { expireIn: res.tokens.expiresIn! * 1000 },
    );
    kv.close();
    return res.response;
  },
};
