import prisma from "../lib/prima";

type PlayerSeedData = {
  name: string;
  price: number;
  category: "MS" | "WS";
  country: string;
};

const players: PlayerSeedData[] = [
  // Men's Singles (MS) - 20 players
  { name: "Srikanth K.", price: 15, category: "MS", country: "India" },
  { name: "Prannoy H. S.", price: 14, category: "MS", country: "India" },
  { name: "Johannesen M.", price: 13, category: "MS", country: "Denmark" },
  { name: "Kang K. X.", price: 12, category: "MS", country: "China" },
  { name: "Manjunath M.", price: 11, category: "MS", country: "India" },
  { name: "Rajawat P.", price: 10, category: "MS", country: "India" },
  { name: "Gunawan J.", price: 10, category: "MS", country: "Indonesia" },
  { name: "Koga M.", price: 9, category: "MS", country: "Japan" },
  { name: "Arin N.", price: 9, category: "MS", country: "India" },
  { name: "Ferdinansyah D.", price: 8, category: "MS", country: "Indonesia" },
  { name: "Akechi H.", price: 7, category: "MS", country: "Japan" },
  { name: "Alimov R.", price: 7, category: "MS", country: "Russia" },
  { name: "Teh J. H. J.", price: 6, category: "MS", country: "Malaysia" },
  { name: "Faiq M.", price: 6, category: "MS", country: "Malaysia" },
  { name: "Krishnamurthy Roy P.", price: 6, category: "MS", country: "India" },
  { name: "He Z.", price: 5, category: "MS", country: "China" },
  { name: "Wong T. C.", price: 5, category: "MS", country: "Malaysia" },
  { name: "Weijie C.", price: 5, category: "MS", country: "China" },
  { name: "Lo S. Y. H.", price: 4, category: "MS", country: "Hong Kong" },
  { name: "Upadhyaya A.", price: 4, category: "MS", country: "India" },

  // Women's Singles (WS) - 20 players
  { name: "Okuhara N.", price: 14, category: "WS", country: "Japan" },
  { name: "Jolly T.", price: 13, category: "WS", country: "India" },
  { name: "Ong X. Y.", price: 12, category: "WS", country: "Malaysia" },
  { name: "Hsu Y. C.", price: 12, category: "WS", country: "Taiwan" },
  { name: "Osawa K.", price: 11, category: "WS", country: "Japan" },
  { name: "Lin X. M.", price: 10, category: "WS", country: "China" },
  { name: "Hooda U.", price: 10, category: "WS", country: "India" },
  { name: "Sharma T.", price: 9, category: "WS", country: "India" },
  { name: "Amsakarunan H.", price: 9, category: "WS", country: "India" },
  { name: "Onodera M.", price: 8, category: "WS", country: "Japan" },
  { name: "Cheng C.", price: 7, category: "WS", country: "China" },
  { name: "Konjengbam P.", price: 7, category: "WS", country: "India" },
  { name: "Ercetin B.", price: 6, category: "WS", country: "Turkey" },
  { name: "Meida I. S.", price: 6, category: "WS", country: "Indonesia" },
  { name: "Sung S. Y.", price: 6, category: "WS", country: "South Korea" },
  { name: "H.V. N.", price: 5, category: "WS", country: "Vietnam" },
  { name: "Baruah I.", price: 5, category: "WS", country: "India" },
  { name: "Faza M.", price: 5, category: "WS", country: "Indonesia" },
  { name: "Bhat K. A.", price: 4, category: "WS", country: "India" },
  { name: "Ayyappan D.", price: 4, category: "WS", country: "India" },
];

async function seedPlayers() {
  console.log("Starting player seeding...");
  console.log("=".repeat(50));

  try {
    console.log("Clearing existing players...");
    await prisma.player.deleteMany({});
    console.log("Existing players cleared.");

    console.log(`\nSeeding ${players.length} players...`);

    const msPlayers = players.filter((p) => p.category === "MS");
    const wsPlayers = players.filter((p) => p.category === "WS");

    console.log(`Men's Singles (MS): ${msPlayers.length} players`);
    for (const player of msPlayers) {
      await prisma.player.create({ data: player });
    }

    console.log(`Women's Singles (WS): ${wsPlayers.length} players`);
    for (const player of wsPlayers) {
      await prisma.player.create({ data: player });
    }

    console.log("\n" + "=".repeat(50));
    console.log("SEEDING COMPLETE");
    console.log("=".repeat(50));
    console.log(`Total players seeded: ${players.length}`);
    console.log(`MS players: ${msPlayers.length}`);
    console.log(`WS players: ${wsPlayers.length}`);

    const highValue = players.filter((p) => p.price >= 10).length;
    const midValue = players.filter((p) => p.price >= 6 && p.price < 10).length;
    const lowValue = players.filter((p) => p.price < 6).length;

    console.log("\nPrice distribution:");
    console.log(`  High value (£10m+): ${highValue} players`);
    console.log(`  Mid value (£6-9m): ${midValue} players`);
    console.log(`  Low value (<£6m): ${lowValue} players`);

    console.log("\nDatabase is ready. Run the scraper to process matches.");
  } catch (error) {
    console.error("Error seeding players:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlayers();
