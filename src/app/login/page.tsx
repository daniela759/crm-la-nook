import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

type SearchParams = Promise<{ from?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Acasă">
            <Logo size="lg" tone="forest" />
          </Link>
          <h1 className="mt-8 font-display text-2xl font-bold text-nook-forest">
            Bine ai venit
          </h1>
          <p className="mt-1 text-sm text-nook-ink-soft">
            Intră în CRM-ul spațiului de joacă
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-nook-paper p-6 ring-1 ring-nook-line">
          <LoginForm from={from ?? "/dashboard"} />
        </div>

        <div className="mt-6 text-center text-xs text-nook-ink-soft">
          <Link href="/" className="hover:text-nook-ink">
            ← Înapoi la pagina principală
          </Link>
        </div>
      </div>
    </main>
  );
}
