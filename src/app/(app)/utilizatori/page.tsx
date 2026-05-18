import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth-server";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserActions";

export default async function UtilizatoriPage() {
  const me = await requireAdmin();

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [{ active: "desc" }, { role: "desc" }, { createdAt: "asc" }],
  });

  const admins = users.filter((u) => u.role === "ADMIN");
  const operators = users.filter((u) => u.role === "USER");

  return (
    <PageContainer>
      <PageHeader
        title="Utilizatori"
        description={`${users.length} conturi în total · ${admins.length} admin · ${operators.length} operatori`}
      />

      <div className="mt-6">
        <AddUserForm />
      </div>

      <div className="mt-8 space-y-6">
        <Section title={`Admin (${admins.length})`} tone="terracotta">
          {admins.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">Niciun admin.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map((u) => (
                <UserRow key={u.id} user={u} currentUserId={me.id} />
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Operatori (${operators.length})`} tone="forest">
          {operators.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun operator. Adaugă utilizatori care doar operează zilnic (fără
              acces la setări sau utilizatori).
            </p>
          ) : (
            <ul className="space-y-2">
              {operators.map((u) => (
                <UserRow key={u.id} user={u} currentUserId={me.id} />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-8 rounded-2xl bg-nook-paper-warm/40 ring-1 ring-nook-line p-5 text-xs text-nook-ink-soft">
        <h3 className="font-display text-sm font-bold text-nook-forest mb-2">
          Despre roluri
        </h3>
        <ul className="space-y-1">
          <li>
            <strong className="text-nook-terracotta">Admin</strong> · vede pagina
            <em> Utilizatori</em>, poate adăuga / dezactiva conturi, schimba
            roluri și reseta parole.
          </li>
          <li>
            <strong className="text-nook-forest">User</strong> · operator
            standard. Vede tot CRM-ul (Dashboard, Rezervări, Calendar etc.) și
            poate edita date, dar nu accesează <em>Utilizatori</em>.
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "forest" | "terracotta";
  children: React.ReactNode;
}) {
  const toneClass = {
    forest: "text-nook-forest",
    terracotta: "text-nook-terracotta",
  };
  return (
    <div>
      <h2
        className={`font-display text-sm font-bold tracking-widest uppercase mb-3 ${toneClass[tone]}`}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
