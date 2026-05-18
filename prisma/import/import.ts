/**
 * Șterge datele demo + importă datele reale din JSON-ul produs de extract.py.
 *
 * Pas 1: șterge contactele/lead-urile/tranzacțiile/abonamentele/taskurile demo.
 *         Păstrează Settings + LeadSource + Interest.
 * Pas 2: importă contactele + copiii + vizitele + abonamentele.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

type ImportedContact = {
  norm: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  signDate: string | null;
  photoAgreement: boolean;
  active: boolean;
  children: Array<{ name: string; birthDate: string | null; age_text: string | null }>;
  source_note?: string;
};

type ImportedVisit = {
  date: string | null;
  time: string;
  contact_norm: string;
  contact_raw_name: string;
  kids: number;
  adults: number;
  price: number;
  payment_raw: string | null;
  from_subscription: boolean;
  is_subscription_sale: boolean;
  sub_type_hint: "ENTRIES_8" | "ENTRIES_4" | null;
  notes: string | null;
  month: string;
};

type ImportedSubscription = {
  contact_norm: string;
  contact_raw: string;
  type: "ENTRIES_8" | "ENTRIES_4";
  purchasedAt: string;
  totalEntries: number;
  usedEntries: number;
  pricePaid: number;
  expiresAt: string | null;
};

async function wipeDemo() {
  console.log("Șterg datele demo...");
  // Ordine corectă pentru foreign keys
  await db.task.deleteMany({});
  await db.transaction.deleteMany({});
  await db.subscription.deleteMany({});
  await db.leadChild.deleteMany({});
  await db.lead.deleteMany({});
  await db.childInterest.deleteMany({});
  await db.child.deleteMany({});
  await db.contact.deleteMany({});
  // Păstrăm Settings + LeadSource + Interest
  console.log("  ✓ contacte, copii, lead-uri, abonamente, tranzacții, taskuri = ȘTERSE");
}

async function ensureLeadSource(name: string): Promise<string> {
  const s = await db.leadSource.upsert({
    where: { name },
    create: { name },
    update: {},
  });
  return s.id;
}

async function main() {
  const raw = fs.readFileSync(
    path.join(__dirname, "data.json"),
    "utf-8",
  );
  const data = JSON.parse(raw) as {
    contacts: ImportedContact[];
    visits: ImportedVisit[];
    subscriptions: ImportedSubscription[];
  };
  console.log(
    `Date încărcate: ${data.contacts.length} contacte · ${data.visits.length} vizite · ${data.subscriptions.length} abonamente`,
  );

  await wipeDemo();

  // ─── Sursa default „Walk-in" + „Import" ────────────────────────────────
  const walkinId = await ensureLeadSource("Walk-in");
  const importId = await ensureLeadSource("Import (acorduri vechi)");

  // ─── 1. Contacte + Copii ────────────────────────────────────────────────
  console.log("Import contacte...");
  const normToContactId = new Map<string, string>();
  const usedPhones = new Set<string>();
  const usedEmails = new Set<string>();
  let placeholderIdx = 0;

  // Helper care asigură unicitatea adăugând sufix incremental
  function uniquePhone(raw: string | null, idx: number): string {
    let candidate = raw || `+999${String(idx).padStart(7, "0")}`;
    let n = 1;
    while (usedPhones.has(candidate)) {
      candidate = `${raw}-${++n}`;
    }
    usedPhones.add(candidate);
    return candidate;
  }
  function uniqueEmail(raw: string | null, idx: number): string {
    let candidate = (raw || `import-${idx}@nook.local`).toLowerCase();
    let n = 1;
    while (usedEmails.has(candidate)) {
      const [u, d] = (raw || `import-${idx}@nook.local`).toLowerCase().split("@");
      candidate = `${u}+${++n}@${d}`;
    }
    usedEmails.add(candidate);
    return candidate;
  }

  for (const c of data.contacts) {
    placeholderIdx++;
    const fName = c.firstName || "—";
    const lName = c.lastName || "—";
    const email = uniqueEmail(c.email, placeholderIdx);
    const phone = uniquePhone(c.phone, placeholderIdx);
    const notes: string[] = [];
    if (c.signDate) notes.push(`Acord semnat ${c.signDate}`);
    if (c.photoAgreement) notes.push("Acord foto: da");
    else if (c.signDate) notes.push("Acord foto: nu");
    if (c.source_note) notes.push(c.source_note);

    const contactRow = await db.contact.create({
      data: {
        firstName: fName,
        lastName: lName,
        email,
        phone,
        notes: notes.length > 0 ? notes.join(" · ") : null,
        initialSourceId: c.source_note ? walkinId : importId,
        children: {
          create: c.children
            .filter((ch) => ch.name)
            .map((ch) => ({
              name: ch.name,
              birthDate: ch.birthDate
                ? new Date(ch.birthDate)
                : new Date(2020, 0, 1), // fallback dacă vârsta nu e clară
              notes: ch.age_text ? `Vârstă la import: ${ch.age_text}` : null,
            })),
        },
      },
    });
    normToContactId.set(c.norm, contactRow.id);
  }
  console.log(`  ✓ ${data.contacts.length} contacte`);

  // ─── 2. Mapăm contacte la copii (pentru a putea atașa LeadChild) ────────
  const contactToChildIds = new Map<string, string[]>();
  for (const contactRow of await db.contact.findMany({
    select: { id: true, children: { select: { id: true } } },
  })) {
    contactToChildIds.set(
      contactRow.id,
      contactRow.children.map((ch) => ch.id),
    );
  }

  // ─── 3. Abonamente ─────────────────────────────────────────────────────
  console.log("Import abonamente...");
  let subsCreated = 0;
  for (const s of data.subscriptions) {
    const contactId = normToContactId.get(s.contact_norm);
    if (!contactId) {
      console.warn(`  ! abonament fără contact match: ${s.contact_raw}`);
      continue;
    }
    await db.subscription.create({
      data: {
        contactId,
        type: s.type,
        purchasedAt: new Date(s.purchasedAt),
        totalEntries: s.totalEntries,
        usedEntries: s.usedEntries,
        pricePaid: s.pricePaid,
      },
    });
    // Tranzacție de vânzare abonament
    await db.transaction.create({
      data: {
        contactId,
        revenueType: "SUBSCRIPTION",
        amount: s.pricePaid,
        status: "COLLECTED",
        date: new Date(s.purchasedAt),
        paymentMethod: "CARD",
      },
    });
    subsCreated++;
  }
  console.log(`  ✓ ${subsCreated} abonamente`);

  // ─── 4. Vizite → Lead + Transaction ────────────────────────────────────
  console.log("Import vizite...");
  let visitsCreated = 0;
  let saleVisitsSkipped = 0;
  for (const v of data.visits) {
    if (!v.date) continue;

    // Ignorăm "vizitele" care sunt de fapt vânzări de abonament — le-am
    // procesat deja la pachete, ca să nu dublăm tranzacția.
    if (v.is_subscription_sale) {
      saleVisitsSkipped++;
      continue;
    }

    const contactId = normToContactId.get(v.contact_norm);
    if (!contactId) {
      console.warn(`  ! vizită fără contact match: ${v.contact_raw_name}`);
      continue;
    }
    const childIds = contactToChildIds.get(contactId) ?? [];
    // Atașăm la lead doar numărul de copii din vizită, în limita celor existenți
    const childIdsForLead = childIds.slice(0, Math.max(1, v.kids));

    const [yy, mm, dd] = v.date.split("-").map(Number);
    const [hh, mn] = v.time.split(":").map(Number);
    const scheduledAt = new Date(yy, mm - 1, dd, hh, mn);

    const lead = await db.lead.create({
      data: {
        contactId,
        type: "VISIT",
        sourceId: importId,
        status: "PRESENT",
        scheduledAt,
        adultsCount: v.adults,
        estimatedValue: v.price,
        notes: v.notes,
        children: {
          create: childIdsForLead.map((id) => ({ childId: id })),
        },
      },
    });

    // Tranzacția pentru vizită
    if (v.from_subscription) {
      // Vizita consumă din abonament — bani 0 pentru copii (sunt acoperiți)
      // Dacă au și adulți, ar putea fi plată, dar din date e mereu 0 pentru pachete
      // Notă: usedEntries pe Subscription e deja calculat din bifările Excel.
    } else if (v.price > 0) {
      // Spargem pe child / parent dacă putem
      const childCount = childIdsForLead.length;
      const adultCount = v.adults;
      // Heuristic: dacă suma se potrivește cu childCount*30 + adultCount*60, splitm pe categorii
      const expected = childCount * 30 + adultCount * 60;
      if (Math.abs(expected - v.price) < 5 && childCount > 0) {
        // Split corect
        if (childCount > 0) {
          await db.transaction.create({
            data: {
              contactId,
              leadId: lead.id,
              revenueType: "CHILD_VISIT",
              amount: childCount * 30,
              status: "COLLECTED",
              date: scheduledAt,
              paymentMethod: v.payment_raw?.toLowerCase().includes("card") ? "CARD" : "CASH",
            },
          });
        }
        if (adultCount > 0) {
          await db.transaction.create({
            data: {
              contactId,
              leadId: lead.id,
              revenueType: "PARENT_VISIT",
              amount: adultCount * 60,
              status: "COLLECTED",
              date: scheduledAt,
              paymentMethod: v.payment_raw?.toLowerCase().includes("card") ? "CARD" : "CASH",
            },
          });
        }
      } else {
        // O singură tranzacție cu suma totală
        await db.transaction.create({
          data: {
            contactId,
            leadId: lead.id,
            revenueType: "CHILD_VISIT", // default
            amount: v.price,
            status: "COLLECTED",
            date: scheduledAt,
            paymentMethod: v.payment_raw?.toLowerCase().includes("card") ? "CARD" : "CASH",
          },
        });
      }
    }

    visitsCreated++;
  }
  console.log(`  ✓ ${visitsCreated} vizite (${saleVisitsSkipped} vânzări de pachete sărit)`);

  console.log("\n✅ Import terminat!");
  console.log(`   Contacte: ${data.contacts.length}`);
  console.log(`   Abonamente: ${subsCreated}`);
  console.log(`   Vizite: ${visitsCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
