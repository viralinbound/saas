import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@supershowroom.com" },
    update: {},
    create: {
      name: "Neha Raghavan",
      email: "demo@supershowroom.com",
      phone: "+91 98450 21188",
      password,
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: "green-basket" },
    update: { plan: "free", status: "live" },
    create: {
      name: "Green Basket",
      slug: "green-basket",
      industry: "grocery",
      theme: "kirana",
      plan: "free",
      status: "live",
      ownerId: user.id,
    },
  });

  const products = [
    { name: "Organic Royal Kashmiri Apples (1kg)", price: 18000, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop" },
    { name: "Cold-Pressed Olive Oil (1L)", price: 89000, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop" },
    { name: "Farm Fresh Eggs (12 pcs)", price: 13000, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { storeId: store.id, name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: { storeId: store.id, ...p, category: "all", stock: 100 },
      });
    }
  }

  console.log("Seeded demo store: /s/green-basket");
  console.log("Sign up with any email OTP at /signup");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
