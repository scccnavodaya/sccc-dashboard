// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-zinc-600">
          The page you’re looking for doesn’t exist.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
