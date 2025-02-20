import { Handlers } from "$fresh/server.ts";
import kv from "../../../utils/kv.ts";
import { State } from "../../_middleware.ts";
import * as v from "@valibot/valibot";

export const StoredFeeds = v.array(v.object({
  from: v.pipe(v.string(), v.url()),
  to: v.array(v.pipe(v.string(), v.url())),
}));

export type TypeStoredFeeds = v.InferOutput<typeof StoredFeeds>;

const UpdateFeedForm = v.object({
  from: StoredFeeds.item.entries.from,
  to: StoredFeeds.item.entries.to.item,
});

const jsonResponse = (data: unknown, code: number = 200) =>
  new Response(JSON.stringify(data), {
    status: code,
    headers: {
      "content-type": "application/json",
    },
  });

export const handler: Handlers<unknown, State> = {
  async GET(_, ctx) {
    const feeds = v.safeParse(
      v.nullable(StoredFeeds),
      (await kv.get(["feeds", ctx.state.id!])).value,
    );

    return feeds.success
      ? jsonResponse(feeds.output)
      : jsonResponse(feeds.issues, 500);
  },
  async POST(req, ctx) {
    const form = v.safeParse(UpdateFeedForm, await req.formData());
    if (!form.success) return jsonResponse(form.issues, 400);

    const remote = await (await fetch(form.output.to)).text();

    try {
      (new DOMParser()).parseFromString(remote, "text/xml");
    } catch {
      return new Response("provided url does not contain valid xml", {
        status: 400,
      });
    }

    const data = v.parse(
      v.nullable(StoredFeeds),
      (await kv.get(["feeds", ctx.state.id!])).value,
    ) ?? [];

    const existing = data.findIndex((x) => x.from === form.output.from);
    if (existing != -1) data[existing].to.push(form.output.to);
    else data.push({ from: form.output.from, to: [form.output.to] });

    await kv.set(
      ["feeds", ctx.state.id!],
      data.map((x) => ({ ...x, to: [...new Set(x.to)] })),
    );

    return jsonResponse(data, 201);
  },
  async PUT(req, ctx) {
    const data = v.safeParse(StoredFeeds, await req.json());
    if (!data.success) return jsonResponse(data.issues, 400);

    try {
      const remotes = await Promise.all(
        data.output.map(async (x) => await (await fetch(x.from)).text()),
      );
      const parser = new DOMParser();
      remotes.map((x) => parser.parseFromString(x, "text/xml"));
    } catch {
      return new Response("some urls provided were invalid", { status: 400 });
    }

    await kv.set(["feeds", ctx.state.id!], data.output);

    return jsonResponse(data, 201);
  },
  async DELETE(req, ctx) {
    const form = v.safeParse(UpdateFeedForm, await req.formData());
    if (!form.success) return jsonResponse(form.issues, 400);

    let data = v.parse(
      v.nullable(StoredFeeds),
      (await kv.get(["feeds", ctx.state.id!])).value,
    );
    if (!data) return jsonResponse(data, 304);

    const i = data.findIndex((x) =>
      (x.from === form.output.from) && (x.to.includes(form.output.to))
    );
    if (i === -1) return jsonResponse(data, 304);
    data[i].to = data[i].to.filter((x) => x != form.output.to);

    await kv.set(["feeds", ctx.state.id!], data);

    return jsonResponse(data, 201);
  },
};
