import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records in correct order
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Teacher
  const teacher = await prisma.user.create({
    data: {
      name: "Dr. Kamal Hossain",
      email: "kamal@classpulse.edu",
      role: "TEACHER",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Create Students
  const student1 = await prisma.user.create({
    data: {
      name: "MD Abid Hasan",
      email: "abid@classpulse.edu",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Sarah Ahmed",
      email: "sarah@classpulse.edu",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Classroom
  const classroom = await prisma.classroom.create({
    data: {
      name: "Database Systems (45-I)",
      subject: "Computer Science & Engineering",
      code: "DBMS45",
      teacherId: teacher.id,
      enrollments: {
        create: [
          { userId: student1.id },
          { userId: student2.id },
        ],
      },
    },
  });

  // 4. Create Channels
  const chAnnouncements = await prisma.channel.create({
    data: {
      name: "announcements",
      classroomId: classroom.id,
    },
  });

  const chLabHelp = await prisma.channel.create({
    data: {
      name: "lab-help",
      classroomId: classroom.id,
    },
  });

  const chGeneral = await prisma.channel.create({
    data: {
      name: "general",
      classroomId: classroom.id,
    },
  });

  // 5. Create Sample Messages
  await prisma.message.createMany({
    data: [
      {
        content: "Welcome to the class discussion channel! Feel free to introduce yourselves and ask questions anytime.",
        senderId: teacher.id,
        channelId: chGeneral.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        content: "Hello Dr. Kamal and classmates! Excited for this semester. Looking forward to query optimization.",
        senderId: student2.id,
        channelId: chGeneral.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
      },
      {
        content: "Hi everyone! MD Abid here. Ready to master relational database architectures.",
        senderId: student1.id,
        channelId: chGeneral.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
      },
      {
        content: "Hi Dr. Kamal, for the SQL Joins assignment, should we assume NULL values in the discount column?",
        senderId: student1.id,
        channelId: chLabHelp.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        content: "Yes Abid, treat NULL discount as 0 discount using COALESCE(discount, 0). Excellent observation!",
        senderId: teacher.id,
        channelId: chLabHelp.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
  });

  // 6. Create Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to Database Systems (45-I)",
        content: `### Course Overview & Expectations\n\nWelcome everyone to **Database Systems (45-I)**! Throughout this term, we will journey from relational schema theory to ACID transaction guarantees, concurrency control, and distributed storage.\n\n* **Lectures:** Mon & Wed at 10:00 AM\n* **Lab Sessions:** Thursday 2:00 PM\n* **Office Hours:** Tuesdays 3:00 PM - 5:00 PM\n\nPlease verify your environment has SQLite or PostgreSQL installed. Check the \`#lab-help\` channel if you encounter any setup hitches!`,
        classroomId: classroom.id,
        authorId: teacher.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
      {
        title: "Midterm Review Session & Query Tuning Guidelines",
        content: `### Mark Your Calendars!\n\nWe will host an interactive midterm review session this Friday. Topics will encompass:\n1. BCNF and 3NF decomposition proofs\n2. B+ Tree node split and merge mechanics\n3. Hash Join vs Nested Loop Join cost models\n\nBring your questions to class or post them ahead of time in the discussion channels.`,
        classroomId: classroom.id,
        authorId: teacher.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
    ],
  });

  // 7. Create Assignment
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);

  const assignment = await prisma.assignment.create({
    data: {
      title: "Lab Final on SQL Joins",
      description: "Write complex SQL queries combining the Customers, Orders, and OrderItems tables to calculate customer lifetime values, identify top 5 spending cohorts, and handle NULL cases gracefully using COALESCE. Ensure query plans leverage index scans on foreign keys.",
      dueDate: dueDate,
      maxPoints: 100,
      classroomId: classroom.id,
    },
  });

  // 8. Sample Submission from Sarah
  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: student2.id,
      content: `\`\`\`sql
-- Customer Lifetime Value & Cohort Calculation
SELECT 
    c.customer_id, 
    c.name, 
    COALESCE(SUM(oi.quantity * (oi.unit_price - COALESCE(oi.discount, 0))), 0) AS lifetime_value
FROM Customers c
LEFT JOIN Orders o ON c.customer_id = o.customer_id
LEFT JOIN OrderItems oi ON o.order_id = oi.order_id
GROUP BY c.customer_id, c.name
ORDER BY lifetime_value DESC
LIMIT 5;
\`\`\`

All test edge cases (customers with 0 orders, orders with null discounts) pass with optimal cost indices.`,
      grade: 95,
      feedback: "Superb query structuring Sarah! Very clean usage of COALESCE and accurate aggregate grouping.",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  });

  console.log("Database seeded successfully!");
  console.log(`Teacher: Dr. Kamal Hossain (${teacher.id})`);
  console.log(`Student 1: MD Abid Hasan (${student1.id})`);
  console.log(`Student 2: Sarah Ahmed (${student2.id})`);
  console.log(`Classroom: Database Systems (45-I) Code: DBMS45 (${classroom.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
