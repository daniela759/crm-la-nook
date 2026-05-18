/**
 * Seed pentru Nook CRM cu datele demo din specul „Nook CRM v1.0", secțiunea 10.
 * Rulează: npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEFAULT_INTERESTS,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_PRICES,
  DEFAULT_SCHEDULE,
  DEFAULT_SCORE_RULES,
  DEFAULT_TARGETS,
} from "../src/lib/domain";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Nook CRM...");

  // ─── 1. Listele de bază (idempotent: upsert) ─────────────────────────────
  for (const name of DEFAULT_LEAD_SOURCES) {
    await db.leadSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of DEFAULT_INTERESTS) {
    await db.interest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${DEFAULT_LEAD_SOURCES.length} surse de lead`);
  console.log(`  ✓ ${DEFAULT_INTERESTS.length} interese`);

  // ─── 2. Setări singleton ─────────────────────────────────────────────────
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      prices: JSON.stringify(DEFAULT_PRICES),
      schedule: JSON.stringify(DEFAULT_SCHEDULE),
      targets: JSON.stringify(DEFAULT_TARGETS),
      scoreRules: JSON.stringify(DEFAULT_SCORE_RULES),
    },
  });
  console.log("  ✓ setări implicite");

  // Dacă există deja contacte demo, nu mai repopulăm.
  const existing = await db.contact.count();
  if (existing > 0) {
    console.log(`  ⊙ baza are deja ${existing} contacte — sărim peste datele demo`);
    return;
  }

  // ─── 3. Resolve sursele și interesele după nume ──────────────────────────
  const sources = Object.fromEntries(
    (await db.leadSource.findMany()).map((s) => [s.name, s.id]),
  );
  const interests = Object.fromEntries(
    (await db.interest.findMany()).map((i) => [i.name, i.id]),
  );

  // ─── 4. Contacte demo (spec 10.1) ────────────────────────────────────────
  const demoContacts: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    child: {
      name: string;
      ageYears: number;
      interests: string[];
    };
  }> = [
    {
      firstName: "Andreea",
      lastName: "Pop",
      email: "andreea.pop@email.ro",
      phone: "0721 100 200",
      source: "Instagram",
      child: { name: "Maia", ageYears: 4, interests: ["Cărți", "Joacă liberă"] },
    },
    {
      firstName: "Mihai",
      lastName: "Ionescu",
      email: "mihai.ionescu@email.ro",
      phone: "0722 300 400",
      source: "Recomandare",
      child: { name: "Luca", ageYears: 5, interests: ["Mișcare", "Ateliere creative"] },
    },
    {
      firstName: "Elena",
      lastName: "Dumitru",
      email: "elena.dumitru@email.ro",
      phone: "0733 500 600",
      source: "Google",
      child: { name: "David", ageYears: 6, interests: ["Evenimente", "Muzică"] },
    },
    {
      firstName: "Cristina",
      lastName: "Marin",
      email: "cristina.marin@email.ro",
      phone: "0744 700 800",
      source: "Facebook",
      child: { name: "Ana", ageYears: 2, interests: ["Joacă liberă"] },
    },
    {
      firstName: "Radu",
      lastName: "Stan",
      email: "radu.stan@email.ro",
      phone: "0755 900 100",
      source: "Walk-in",
      child: { name: "Vlad", ageYears: 7, interests: ["Cărți", "Evenimente"] },
    },
    {
      firstName: "Ioana",
      lastName: "Georgescu",
      email: "ioana.g@email.ro",
      phone: "0766 200 300",
      source: "TikTok",
      child: { name: "Eric", ageYears: 4, interests: ["Ateliere creative"] },
    },
  ];

  const today = new Date(2026, 4, 16); // 16 mai 2026 (luna demo)

  for (const c of demoContacts) {
    const birthDate = new Date(today);
    birthDate.setFullYear(birthDate.getFullYear() - c.child.ageYears);
    // Luca are și o soră, Sofia (3 ani) — vezi spec
    const extraChildren =
      c.firstName === "Mihai"
        ? [{ name: "Sofia", ageYears: 3, interests: ["Mișcare", "Ateliere creative"] }]
        : [];

    await db.contact.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        initialSourceId: sources[c.source],
        children: {
          create: [
            {
              name: c.child.name,
              birthDate,
              interests: {
                create: c.child.interests.map((i) => ({
                  interestId: interests[i],
                })),
              },
            },
            ...extraChildren.map((ec) => {
              const ecBirth = new Date(today);
              ecBirth.setFullYear(ecBirth.getFullYear() - ec.ageYears);
              return {
                name: ec.name,
                birthDate: ecBirth,
                interests: {
                  create: ec.interests.map((i) => ({ interestId: interests[i] })),
                },
              };
            }),
          ],
        },
      },
    });
  }
  console.log(`  ✓ ${demoContacts.length} contacte (cu copii și interese)`);

  // ─── 5. Lead-uri / Rezervări (spec 10.2) ─────────────────────────────────
  const contacts = Object.fromEntries(
    (
      await db.contact.findMany({
        include: { children: true },
      })
    ).map((c) => [c.email, c]),
  );

  const demoLeads: Array<{
    email: string;
    type: "VISIT" | "BIRTHDAY" | "EVENT";
    sourceName: string;
    day: number;
    status: "NEW" | "CONTACTED" | "CONFIRMED" | "PRESENT" | "ABSENT";
    estimatedValue: number;
    adultsCount: number;
    notes?: string;
  }> = [
    {
      email: "andreea.pop@email.ro",
      type: "VISIT",
      sourceName: "Instagram",
      day: 4,
      status: "PRESENT",
      estimatedValue: 0, // din abonament
      adultsCount: 1,
      notes: "Vizită din abonament",
    },
    {
      email: "mihai.ionescu@email.ro",
      type: "BIRTHDAY",
      sourceName: "Recomandare",
      day: 10,
      status: "PRESENT",
      estimatedValue: 1800,
      adultsCount: 6,
    },
    {
      email: "elena.dumitru@email.ro",
      type: "VISIT",
      sourceName: "Google",
      day: 12,
      status: "PRESENT",
      estimatedValue: 90,
      adultsCount: 1,
    },
    {
      email: "cristina.marin@email.ro",
      type: "VISIT",
      sourceName: "Facebook",
      day: 14,
      status: "CONFIRMED",
      estimatedValue: 90,
      adultsCount: 1,
    },
    {
      email: "radu.stan@email.ro",
      type: "VISIT",
      sourceName: "Walk-in",
      day: 18,
      status: "NEW",
      estimatedValue: 150,
      adultsCount: 2,
    },
    {
      email: "ioana.g@email.ro",
      type: "EVENT",
      sourceName: "TikTok",
      day: 20,
      status: "ABSENT",
      estimatedValue: 100,
      adultsCount: 1,
    },
    {
      email: "mihai.ionescu@email.ro",
      type: "EVENT",
      sourceName: "Recomandare",
      day: 24,
      status: "CONFIRMED",
      estimatedValue: 100,
      adultsCount: 1,
    },
  ];

  for (const l of demoLeads) {
    const c = contacts[l.email];
    if (!c) continue;
    const scheduledAt = new Date(2026, 4, l.day, 10, 0);
    await db.lead.create({
      data: {
        contactId: c.id,
        type: l.type,
        sourceId: sources[l.sourceName],
        scheduledAt,
        adultsCount: l.adultsCount,
        status: l.status,
        estimatedValue: l.estimatedValue,
        notes: l.notes,
        children: {
          create: c.children.map((ch) => ({ childId: ch.id })),
        },
      },
    });
  }
  console.log(`  ✓ ${demoLeads.length} lead-uri / rezervări`);

  // ─── 6. Abonament Andreea (spec 10.3) ────────────────────────────────────
  const andreea = contacts["andreea.pop@email.ro"];
  if (andreea) {
    await db.subscription.create({
      data: {
        contactId: andreea.id,
        type: "ENTRIES_8",
        purchasedAt: new Date(2026, 3, 28), // 28 aprilie
        totalEntries: 8,
        usedEntries: 3,
        pricePaid: 350,
      },
    });
    console.log("  ✓ 1 abonament activ (Andreea Pop · 3/8)");
  }

  // ─── 7. Tranzacții — generate din lead-urile PRESENT și abonament ────────
  const presentLeads = await db.lead.findMany({
    where: { status: "PRESENT" },
    include: { contact: true, children: true },
  });

  for (const lead of presentLeads) {
    if (lead.type === "VISIT" && lead.estimatedValue > 0) {
      // Defalcăm pe copii + adulți
      const childrenCount = lead.children.length;
      if (childrenCount > 0) {
        await db.transaction.create({
          data: {
            contactId: lead.contactId,
            leadId: lead.id,
            revenueType: "CHILD_VISIT",
            amount: childrenCount * DEFAULT_PRICES.childVisit,
            status: "COLLECTED",
            date: lead.scheduledAt,
            paymentMethod: "CARD",
          },
        });
      }
      if (lead.adultsCount > 0) {
        await db.transaction.create({
          data: {
            contactId: lead.contactId,
            leadId: lead.id,
            revenueType: "PARENT_VISIT",
            amount: lead.adultsCount * DEFAULT_PRICES.parentVisit,
            status: "COLLECTED",
            date: lead.scheduledAt,
            paymentMethod: "CARD",
          },
        });
      }
    } else if (lead.type === "BIRTHDAY") {
      await db.transaction.create({
        data: {
          contactId: lead.contactId,
          leadId: lead.id,
          revenueType: "BIRTHDAY",
          amount: DEFAULT_PRICES.birthday,
          status: "COLLECTED",
          date: lead.scheduledAt,
          paymentMethod: "TRANSFER",
        },
      });
    }
  }

  // Tranzacție de vizită „din abonament" pentru Andreea (3 vizite la 30 lei = 0 lei colectați, dar le contorizăm ca CHILD_VISIT cu 0)
  // Plus tranzacție de vânzare abonament
  if (andreea) {
    await db.transaction.create({
      data: {
        contactId: andreea.id,
        revenueType: "SUBSCRIPTION",
        amount: 350,
        status: "COLLECTED",
        date: new Date(2026, 3, 28),
        paymentMethod: "CARD",
      },
    });
  }
  console.log(`  ✓ tranzacții generate din lead-uri PRESENT`);

  console.log("✅ Seed terminat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
