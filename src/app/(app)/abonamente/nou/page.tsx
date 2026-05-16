import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import { getSettings } from "@/lib/settings";
import { SellSubscriptionForm } from "./Form";

export default async function AbonamentNouPage() {
  const [contacts, settings] = await Promise.all([
    db.contact.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    getSettings(),
  ]);

  return (
    <PageContainer>
      <Link
        href="/abonamente"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la abonamente
      </Link>
      <PageHeader
        title="Vinde abonament"
        description="Înregistrează vânzarea unui abonament către un contact existent. Tranzacția se înregistrează automat ca ÎNCASATĂ."
      />
      <SellSubscriptionForm contacts={contacts} prices={settings.prices} />
    </PageContainer>
  );
}
