/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import kv from "./utils/kv.ts";
import { TypeStoredFeeds } from "./routes/(protected)/api/feeds.ts";
import Parser from "rss-parser";

const rssParser = new Parser();

const broadcast = async () => {
  const data = await Promise.all(
    (await Array.fromAsync(kv.list({
      prefix: ["feeds"],
    }))).flatMap((x) => x.value as TypeStoredFeeds).flatMap(async (x) => {
      const rss = await rssParser.parseString(
        await (await fetch(x.from)).text(),
      );
      return Promise.all(x.to.map(async (y) => {
        kv.delete([x.from, y]);
        const lastSent = (await kv.get([x.from, y])).value as number ?? 0;
        const unsent = rss.items.filter((i) =>
          i.isoDate && (Date.parse(i.isoDate) > lastSent)
        );
        if (unsent.length == 0) return;
        await (await fetch(y, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            username: "rss-webhook",
            content: `there are **${unsent.length}** new items.${
              unsent.length > 5
                ? " due to discord limits, we will only send 5 embeds at max."
                : ""
            }`,
            embeds: unsent.slice(0, 4).map((i) => ({
              color: 10195199,
              author: {
                name: i.author,
              },
              title: i.title,
              description: i.content,
              url: i.link,
              timestamp: i.isoDate,
              footer: {
                text: rss.title,
              },
            })),
          }),
        })).text();
        await kv.set([x.from, y], Date.now());
      }));
    }),
  );

  return data;
};

Deno.cron("fetch rss", "0 */2 * * *", broadcast);

await broadcast();

await start(manifest, config);
