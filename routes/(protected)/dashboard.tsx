import { Handlers, PageProps } from "$fresh/server.ts";
import Parser from "rss-parser";
import kv from "../../utils/kv.ts";
import { State } from "../_middleware.ts";
import { StoredFeeds, TypeStoredFeeds } from "./api/feeds.ts";
import * as v from "@valibot/valibot";

type RssTableType = Record<
  string,
  { title: string; link: string; description: string }
>;

type HookTableType = Record<
  string,
  { guild: string; channel: string; name: string }
>;

export const handler: Handlers<unknown, State> = {
  async GET(_req, ctx) {
    const rssParser = new Parser();
    const res = v.parse(
      v.nullable(StoredFeeds),
      (await kv.get(["feeds", ctx.state.id!])).value,
    );

    const rssTable = {} as RssTableType;
    const hookTable = {} as HookTableType;

    if (res) {
      await Promise.all(res.map(async ({ from }) => {
        const rssInfo = await (await fetch(from)).text();
        const rss = await rssParser.parseString(rssInfo);
        rssTable[from] = {
          title: rss.title?.toString() ?? "no title",
          description: rss.description?.toString() ?? "no description",
          link: rss.link ?? "",
        };
      }));

      await Promise.all(
        res.flatMap(({ to }) =>
          to.map(async (y) => {
            const hookInfo = await (await fetch(y)).json();
            hookTable[y] = {
              name: hookInfo.name,
              channel: hookInfo.channel_id,
              guild: hookInfo.guild_id,
            };
          })
        ),
      );
    }

    return ctx.render({
      name: ctx.state.name!,
      feeds: res,
      hookTable,
      rssTable,
    });
  },
};

export default function Dashboard(
  props: PageProps<{
    name: string;
    feeds: TypeStoredFeeds;
    hookTable: HookTableType;
    rssTable: RssTableType;
  }>,
) {
  return (
    <main class="mx-auto max-w-screen-md p-8">
      <h1>welcome, {props.data.name}.</h1>
      <h2 class="mb-6">
        you can add a feed&nbsp;
        <a href="/addfeed" class="underline hover:no-underline">here</a>.
      </h2>

      <div>
        <h2 class="font-semibold mb-4 pb-2 min-w-full border-b-2 border-neutral-400">
          your feeds
        </h2>
        <div class="flex flex-col gap-y-4">
          {props.data.feeds
            ? props.data.feeds.map((x) => (
              <details>
                <summary>
                  <span>{props.data.rssTable[x.from].title}</span>
                  <span class="mx-2">|</span>
                  <a
                    href={props.data.rssTable[x.from].link}
                    class="underline hover:no-underline"
                  >
                    visit
                  </a>
                  <span class="mx-2">|</span>
                  <a href={x.from} class="underline hover:no-underline">
                    source
                  </a>
                </summary>
                <ul>
                  {x.to.map((y) => props.data.hookTable[y]).map((y) => (
                    <li class="before:content-['\21AA'] before:mr-4">
                      <div class="inline-flex flex-col">
                        <span>
                          name:&nbsp;
                          {y.name}
                        </span>
                        <span>
                          guild id:&nbsp;
                          <span title={y.guild}>
                            {y.guild.substring(0, 5)}...
                          </span>
                        </span>
                        <span>
                          channel id:&nbsp;
                          <span title={y.channel}>
                            {y.channel.substring(0, 5)}...
                          </span>
                        </span>
                        <span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            ))
            : (
              <p>
                you have no feeds. go add one&nbsp;
                <a href="/addfeed" class="underline hover:no-underline">
                  here
                </a>!
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
