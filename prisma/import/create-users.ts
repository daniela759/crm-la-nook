/**
 * Creează/actualizează conturile de utilizatori pe Neon.
 * - suport@franc.agency  → parolă existentă (continuitate pentru Daniela)
 * - zflaviu@gmail.com    → parolă generată random
 * - ela.zapca@gmail.com  → parolă generată random
 *
 * Rulează: npx tsx prisma/import/create-users.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function generatePassword(): string {
  // Format: «Nook-{8 chars alfanumerice}!»
  const random = crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "x");
  return `Nook-${random}!`;
}

const USERS = [
  {
    email: "suport@franc.agency",
    name: "Suport Franc Agency",
    // Folosim parola existentă a Danielei pentru continuitate
    password: "Nook-Cluj-K9pXm!2026",
    passwordGenerated: false,
  },
  {
    email: "zflaviu@gmail.com",
    name: "Flaviu Z.",
    password: generatePassword(),
    passwordGenerated: true,
  },
  {
    email: "ela.zapca@gmail.com",
    name: "Ela Zapca",
    password: generatePassword(),
    passwordGenerated: true,
  },
];

async function main() {
  console.log("\n🔐 Creez conturile de utilizatori...\n");

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const existing = await db.user.findUnique({ where: { email: u.email } });

    if (existing) {
      await db.user.update({
        where: { email: u.email },
        data: { passwordHash: hash, name: u.name, active: true },
      });
      console.log(`  ↻ ${u.email} actualizat`);
    } else {
      await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: hash,
          active: true,
        },
      });
      console.log(`  ✓ ${u.email} creat`);
    }
  }

  console.log("\n📋 Credentialele de distribuit:\n");
  console.log("┌─────────────────────────────┬──────────────────────────┐");
  console.log("│ Email                       │ Parolă                   │");
  console.log("├─────────────────────────────┼──────────────────────────┤");
  for (const u of USERS) {
    const tag = u.passwordGenerated ? " (NOU)" : " (continuitate)";
    console.log(
      `│ ${u.email.padEnd(27)} │ ${u.password.padEnd(24)} │${tag}`,
    );
  }
  console.log("└─────────────────────────────┴──────────────────────────┘");
  console.log(
    "\n⚠️  Salvează parolele acum — bcrypt e one-way, nu mai pot fi recuperate.\n",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
