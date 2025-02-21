import { Handlers } from "$fresh/server.ts";
import kv from "../../utils/kv.ts";

export const handler: Handlers = {
  async GET(_, _ctx) {
    const entries = await Array.fromAsync(kv.list({ prefix: ["feeds"] }));
    return new Response(JSON.stringify(entries), {
      headers: {
        "content-type": "application/json",
      },
    });
  },
};
