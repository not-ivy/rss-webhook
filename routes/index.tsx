export default function Home() {
  return (
    <div class="min-h-screen grid place-items-center">
      <main class="text-center max-w-screen-sm p-8">
        <h1 class="font-semibold text-lg">rss-webhook</h1>
        <p>bridges rss feeds to your discord webhook, no bots required!</p>
        <nav class="mt-4">
          <a href="/signin" class="bg-neutral-800 text-neutral-200 px-4 underline decoration-neutral-200 hover:bg-neutral-700 transition-colors">sign in</a>
        </nav>

        <footer class="absolute left-0 bottom-0 p-8 w-full">
          <nav>
            <ul class="flex gap-x-4 items-center justify-center">
              <li><a href="https://sr.ht/~furry/rss-webhook" class="text-neutral-400 hover:text-neutral-800 hover:underline transition-colors">source</a></li>
              <li>-</li>
              <li><a href="https://" class="text-neutral-400 hover:text-neutral-800 hover:underline transition-colors">license</a></li>
            </ul>
          </nav>
        </footer>
      </main>
    </div>
  );
}
