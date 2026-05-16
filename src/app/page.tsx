import { Logo } from "@/components/Logo";

const VALORI = [
  {
    titlu: "Simplitate",
    descriere: "Claritate, accesibilitate, naturalețe. Fără exces, fără zgomot.",
  },
  {
    titlu: "Joacă firească",
    descriere: "Libertate cu structură. Materiale potrivite. Fără stimuli excesivi.",
  },
  {
    titlu: "Respect și responsabilitate",
    descriere: "Grijă față de oameni și spațiu. Respectăm ritmul fiecărui copil.",
  },
  {
    titlu: "Comunitate",
    descriere: "Familiaritate, revenire, conectare. Nook este un loc în care revii.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center sm:pt-32">
        <Logo size="xl" tagline tone="forest" />

        <p className="mt-12 max-w-xl font-display text-2xl sm:text-3xl font-semibold leading-snug text-nook-ink">
          Sistem de management pentru spațiul de joacă.
        </p>
        <p className="mt-4 max-w-lg text-base sm:text-lg text-nook-ink-soft leading-relaxed">
          Clienți, rezervări, abonamente și financiar — într-un singur loc,
          construit pentru ritmul administratorului.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <a
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full bg-nook-forest px-7 text-base font-medium text-nook-paper transition-colors hover:bg-nook-ink"
          >
            Intră în aplicație
          </a>
          <span className="inline-flex h-12 items-center justify-center rounded-full border border-nook-line px-7 text-sm text-nook-ink-soft">
            În construcție · Etapa 1 din 6
          </span>
        </div>
      </section>

      {/* Valori */}
      <section className="border-t border-nook-line bg-nook-paper-warm px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-2xl sm:text-3xl font-bold text-nook-forest">
            Construit pe valorile Nook
          </h2>
          <p className="mt-3 text-center text-nook-ink-soft">
            Fiecare ecran respiră simplitate, calm și grijă.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALORI.map((v, idx) => (
              <article
                key={v.titlu}
                className="rounded-2xl bg-nook-paper p-6 shadow-sm ring-1 ring-nook-line/60"
              >
                <span className="font-display text-xs font-bold tracking-widest text-nook-terracotta">
                  0{idx + 1}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-nook-forest">
                  {v.titlu}
                </h3>
                <p className="mt-2 text-sm text-nook-ink-soft leading-relaxed">
                  {v.descriere}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Palette preview — discret, pentru verificare brand */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="font-display text-sm font-bold tracking-widest text-nook-ink-soft uppercase">
            Paletă cromatică
          </h3>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { name: "forest", hex: "#708c77" },
              { name: "sage", hex: "#7baa86" },
              { name: "sage-light", hex: "#bfd6ba" },
              { name: "terracotta", hex: "#af7e54" },
              { name: "sand", hex: "#ddcf97" },
              { name: "cream", hex: "#ffe4c7" },
            ].map(({ name, hex }) => (
              <div
                key={name}
                className="rounded-xl overflow-hidden ring-1 ring-nook-line/60"
              >
                <div className="h-16" style={{ backgroundColor: hex }} />
                <div className="bg-nook-paper px-3 py-2">
                  <div className="text-xs font-medium text-nook-ink">{name}</div>
                  <div className="text-[10px] text-nook-ink-soft">{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-nook-line px-6 py-6 text-center text-xs text-nook-ink-soft">
        Construit de{" "}
        <span className="font-semibold text-nook-ink">Franc Agency</span> · 2026
      </footer>
    </main>
  );
}
