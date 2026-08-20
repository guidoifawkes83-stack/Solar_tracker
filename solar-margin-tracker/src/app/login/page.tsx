export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <form
        action="/api/login"
        method="POST"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4"
      >
        <div>
          <h1 className="text-lg font-semibold text-neutral-100">
            Solar Margin Tracker
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Enter the site passcode to continue.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
            Wrong passcode. Try again.
          </p>
        )}

        <input type="hidden" name="next" value={next ?? "/"} />

        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="Passcode"
          className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />

        <button
          type="submit"
          className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
