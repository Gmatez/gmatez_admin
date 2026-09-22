import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-stone-600">That admin route does not exist.</p>
      <Link href="/dashboard" className="mt-4 text-sm text-teal-800 underline">
        Back to dashboard
      </Link>
    </main>
  );
}
