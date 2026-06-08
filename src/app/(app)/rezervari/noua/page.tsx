import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import { getSettings } from "@/lib/settings";
import { LeadForm } from "./Form";
import { requireEditorPage } from "@/lib/permissions";

export default async function RezervareNouaPage() {
  await requireEditorPage("/rezervari");
  const [sources, contacts, settings] = await Promise.all([
    db.leadSource.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.contact.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        initialSourceId: true,
        children: {
          select: { id: true, name: true, birthDate: true },
          orderBy: { birthDate: "asc" },
        },
      },
    }),
    getSettings(),
  ]);

  return (
    <PageContainer>
      <Link
        href="/rezervari"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la rezervări
      </Link>
      <PageHeader
        title="Rezervare nouă"
        description="Creează o rezervare nouă pentru un contact existent sau adaugă un contact nou direct de aici."
      />
      <LeadForm
        sources={sources}
        contacts={contacts}
        prices={settings.prices}
        schedule={settings.schedule}
      />
    </PageContainer>
  );
}
