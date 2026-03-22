import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="min-h-svh w-full px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-215 flex-col gap-4">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight">Pikachu</h1>
        </header>

        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <nav
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            aria-label="routes"
          >
            <Link
              className="group flex flex-col gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              to="/css"
            >
              <div className="font-mono text-sm">/css</div>
              <div className="text-sm text-zinc-600">CSS Implementation</div>
            </Link>
            <Link
              className="group flex flex-col gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              to="/canvas"
            >
              <div className="font-mono text-sm">/canvas</div>
              <div className="text-sm text-zinc-600">Canvas Implementation</div>
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}

export default Home;
