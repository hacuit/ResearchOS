import { PrismaClient } from "@prisma/client";
import { runSeed } from "../src/lib/seed-data";

const db = new PrismaClient();

runSeed(db)
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
