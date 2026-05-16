import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import { ContactForm } from "./Form";

export default async function ContactNouPage() {
  const [sources, interests] = await Promise.all([
    db.leadSource.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.interest.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PageContainer>
      <Link
        href="/contacte"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la contacte
      </Link>
      <PageHeader
        title="Contact nou"
        description="Adaugă un părinte / aparținător și copiii lui. La rezervările viitoare îi selectezi din listă."
      />
      <ContactForm sources={sources} interests={interests} />
    </PageContainer>
  );
}
