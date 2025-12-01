import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const players = [
  // Men's Singles (MS)
  { name: "Viktor Axelsen", price: 12, category: "MS" },
  { name: "Kunlavut Vitidsarn", price: 10, category: "MS" },
  { name: "Lee Zii Jia", price: 9, category: "MS" },
  { name: "Lakshya Sen", price: 7, category: "MS" },
  { name: "Anders Antonsen", price: 8, category: "MS" },
  { name: "Jonatan Christie", price: 7, category: "MS" },
  { name: "Chou Tien-chen", price: 8, category: "MS" },
  { name: "Kodai Naraoka", price: 6, category: "MS" },

  // Women's Singles (WS)
  { name: "An Se-young", price: 11, category: "WS" },
  { name: "Chen Yufei", price: 10, category: "WS" },
  { name: "Akane Yamaguchi", price: 9, category: "WS" },
  { name: "P.V. Sindhu", price: 8, category: "WS" },
  { name: "Tai Tzu-ying", price: 11, category: "WS" },
  { name: "Carolina Marin", price: 9, category: "WS" },
  { name: "He Bingjiao", price: 7, category: "WS" },
  { name: "Ratchanok Intanon", price: 7, category: "WS" },
];

async function main() {
  console.log("Seeding players...");

  // Clear existing players
  await prisma.player.deleteMany();

  // Create all players
  for (const player of players) {
    await prisma.player.create({
      data: player,
    });
  }

  console.log(`Seeded ${players.length} players successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
