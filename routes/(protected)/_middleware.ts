import { FreshContext } from "$fresh/server.ts";
import kv from "../../utils/kv.ts";
import { State } from "../_middleware.ts";

export async function handler(
  _: Request,
  ctx: FreshContext<State>,
) {
  try {
    if (!ctx.state.session) throw new Error();
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
    ctx.state.name = discordInfo.global_name ?? discordInfo.username;
    return ctx.next();
  } catch {
    return new Response(null, {
      status: 303,
      headers: {
        "location": "/",
      },
    });
  }
}
