import { FreshContext } from "$fresh/server.ts";
import kv from "../../utils/kv.ts";
import { State } from "../_middleware.ts";

export async function handler(
  _: Request,
  ctx: FreshContext<State>,
) {
  try {
    const discordInfo = await (await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          authorization: `${
            (await kv.get(["tokens", ctx.state.session!])).value
          }`,
        },
      },
    )).json();
    ctx.state.id = discordInfo.id;
    return ctx.next();
  } catch {
    return new Response(null, {
      status: 403,
      headers: {
        "location": "/api/signin",
      },
    });
  }
}
