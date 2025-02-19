import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>rss-webhook</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/commit-mono.css" />
      </head>
      <body class="font-mono bg-neutral-200 text-neutral-800 leading-relaxed">
        <Component />
      </body>
    </html>
  );
}
