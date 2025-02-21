export default function AddFeed() {
  return (
    <div class="min-h-screen grid place-items-center p-8">
      <form method="post" action="/api/feeds">
        <fieldset class="px-8 py-4 border-2 border-neutral-400 focus-within:!border-neutral-800 hover:border-neutral-500 transition-colors flex flex-col gap-y-4 items-end">
          <legend class="px-4">add feed</legend>
          <label class="flex items-center justify-between gap-x-6">
            <span>rss</span>
            <input type="url" name="from" placeholder="source url" />
          </label>
          <label class="flex items-center justify-between gap-x-6">
            <span>discord</span>
            <input type="url" name="to" placeholder="webhook url" />
          </label>
          <button
            type="submit"
            class="underline hover:font-semibold transition-all"
          >
            submit
          </button>
        </fieldset>
      </form>
    </div>
  );
}
