import { Link, useLocation } from "react-router-dom";

function Fallback() {
  const { pathname } = useLocation();
  return (
    <main className="min-h-svh w-full px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-215 flex-col gap-4">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight">404</h1>
          <p className="mt-2 text-base text-zinc-600">Not Found: {pathname}</p>
        </header>
        <div>
          <Link
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            to="/"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Fallback;
