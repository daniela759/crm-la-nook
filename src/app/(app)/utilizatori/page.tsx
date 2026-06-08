import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { requireSection } from "@/lib/permissions";
import { USER_ROLE_DESCRIPTION } from "@/lib/domain";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserActions";

export default async function UtilizatoriPage() {
  const me = await requireSection("utilizatori");

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

  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");
  const marketing = users.filter((u) => u.role === "MARKETING");
  const operational = users.filter((u) => u.role === "OPERATIONAL");

  return (
    <PageContainer>
      <PageHeader
        title="Utilizatori"
        description={`${users.length} conturi · ${superAdmins.length} super-admin · ${marketing.length} marketing · ${operational.length} operațional`}
      />

      <div className="mt-6">
        <AddUserForm />
      </div>

      <div className="mt-8 space-y-6">
        <Section title={`Super-admin (${superAdmins.length})`} tone="terracotta">
          {superAdmins.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">Niciun super-admin.</p>
          ) : (
            <ul className="space-y-2">
              {superAdmins.map((u) => (
                <UserRow key={u.id} user={u} currentUserId={me.id} />
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Marketing (${marketing.length})`} tone="sand">
          {marketing.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun cont de marketing. Adaugă agenția — vede tot, dar doar
              citește (fără editări).
            </p>
          ) : (
            <ul className="space-y-2">
              {marketing.map((u) => (
                <UserRow key={u.id} user={u} currentUserId={me.id} />
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Operațional (${operational.length})`} tone="forest">
          {operational.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun cont operațional. Adaugă personalul din spațiu — taskuri
              operaționale, rezervări, calendar și contacte.
            </p>
          ) : (
            <ul className="space-y-2">
              {operational.map((u) => (
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
        <ul className="space-y-1.5">
          <li>
            <strong className="text-nook-terracotta">Super-admin</strong> ·{" "}
            {USER_ROLE_DESCRIPTION.SUPER_ADMIN}
          </li>
          <li>
            <strong className="text-nook-ink">Marketing</strong> ·{" "}
            {USER_ROLE_DESCRIPTION.MARKETING}
          </li>
          <li>
            <strong className="text-nook-forest">Operațional</strong> ·{" "}
            {USER_ROLE_DESCRIPTION.OPERATIONAL}
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
  tone: "forest" | "terracotta" | "sand";
  children: React.ReactNode;
}) {
  const toneClass = {
    forest: "text-nook-forest",
    terracotta: "text-nook-terracotta",
    sand: "text-nook-ink",
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
