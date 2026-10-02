import { PrismaClient } from "@prisma/client";
import { flatBooksData } from "../data/booksData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database (NCTB textbooks only)...");

  // Clean existing book records
  await prisma.nctbBook.deleteMany();

  // Seed NCTB Textbooks (Class 6 & Class 9-10)
  console.log("Seeding NCTB Textbooks (Class 6 & Class 9-10)...");
  for (const book of flatBooksData) {
    await prisma.nctbBook.create({
      data: {
        id: book.id,
        title: book.title,
        subject: book.subject,
        grade: book.grade || "class-6",
        version: book.version,
        driveUrl: book.driveUrl,
      },
    });
  }

  console.log("Database seeded successfully with NCTB textbooks!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
