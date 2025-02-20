import { Handlers } from "$fresh/server.ts";
import kv from "../../../utils/kv.ts";
import { State } from "../../_middleware.ts";
import * as v from "@valibot/valibot";

const StoredFeeds = v.object({
  from: v.pipe(v.string(), v.url()),
  to: v.array(v.pipe(v.string(), v.url())),
});

type TypeStoredFeeds = v.InferOutput<typeof StoredFeeds>;

const UpdateFeedForm = v.object({
  from: StoredFeeds.entries.from,
  to: StoredFeeds.entries.to.item,
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
      StoredFeeds,
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
    );
    const modified = data
      ? {
        from: data.from ?? form.output.from,
        to: [...new Set([...data.to, form.output.to])],
      } satisfies TypeStoredFeeds
      : {
        from: form.output.from,
        to: [form.output.to],
      } satisfies TypeStoredFeeds;

    await kv.set(["feeds", ctx.state.id!], modified);

    return jsonResponse(modified, 201);
  },
  async PUT(req, ctx) {
    const data = v.safeParse(StoredFeeds, await req.json());
    if (!data.success) return jsonResponse(data.issues, 400);

    const fetchingUrls = [...new Set(data.output.to)].map(async (url) =>
      await fetch(url)
    );
    const invalidUrls: string[] = [];

    for await (const remote of fetchingUrls) {
      try {
        (new DOMParser()).parseFromString(await remote.text(), "text/xml");
      } catch {
        invalidUrls.push(remote.url);
        return new Response(
          `these urls does not contain valid xml:\n${invalidUrls.join("\n  ")}`,
          { status: 400 },
        );
      }
    }

    await kv.set(["feeds", ctx.state.id!], data.output);

    return jsonResponse(data, 201);
  },
  async DELETE(req, ctx) {
    const form = v.safeParse(UpdateFeedForm, await req.formData());
    if (!form.success) return jsonResponse(form.issues, 400);

    const data = v.parse(
      v.nullable(StoredFeeds),
      (await kv.get(["feeds", ctx.state.id!])).value,
    );
    if (!data) return jsonResponse(data, 201);

    const modified = {
      from: data.from,
      to: [...new Set(data.to.filter((url) => url != form.output.to))],
    } satisfies TypeStoredFeeds;

    await kv.set(["feeds", ctx.state.id!], modified);

    return jsonResponse(modified, 201);
  },
};
