import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { CheckoutStatus, OrderStatus, PrismaClient, UserRole } from "../generated/prisma/client";
import { format } from "date-fns";

const SAMPLE_SLUGS = ["readybell", "demo-bistro"];
const SAMPLE_RAZORPAY_ORDER_IDS = ["seed_order_ready", "seed_order_new"];
const SAMPLE_RAZORPAY_PAYMENT_IDS = ["seed_payment_ready", "seed_payment_new"];

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  }),
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "owner@flash.demo";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "flash-admin-123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.restaurant.deleteMany({
    where: {
      slug: {
        in: SAMPLE_SLUGS,
      },
    },
  });

  await prisma.adminUser.deleteMany({
    where: {
      email: adminEmail,
    },
  });

  await prisma.checkoutSession.deleteMany({
    where: {
      OR: [
        {
          razorpayOrderId: {
            in: SAMPLE_RAZORPAY_ORDER_IDS,
          },
        },
        {
          razorpayPaymentId: {
            in: SAMPLE_RAZORPAY_PAYMENT_IDS,
          },
        },
      ],
    },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "ReadyBell",
      slug: "readybell",
      description: "Fast casual bowls, wraps, coffees, and live pickup tokens.",
      heroTitle: "Order in under a minute. Pickup without the queue.",
      heroDescription:
        "Scan the QR, build your order, pay online, and track kitchen progress live from your browser.",
      currency: "INR",
      themeColor: "#ea580c",
      supportPhone: "9876543210",
    },
  });

  await prisma.adminUser.create({
    data: {
      restaurantId: restaurant.id,
      name: "ReadyBell Owner",
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const [bowls, wraps, drinks] = await Promise.all([
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: "Signature Bowls",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: "Wraps & Bites",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: "Sips",
        sortOrder: 3,
      },
    }),
  ]);

  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: bowls.id,
        name: "Smoked Paneer Power Bowl",
        description: "Millet base, smoked paneer, charred corn, pickled onion, green chutney crema.",
        imageUrl:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
        price: 28900,
        isAvailable: true,
        isFeatured: true,
        spiceLevel: 2,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: bowls.id,
        name: "Peri Peri Chicken Rice Bowl",
        description: "Grilled peri peri chicken, herbed rice, sauteed peppers, garlic yogurt.",
        imageUrl:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
        price: 32900,
        isAvailable: true,
        spiceLevel: 3,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: wraps.id,
        name: "Crispy Falafel Wrap",
        description: "Falafel, shredded lettuce, tahini sauce, pickled vegetables, toasted tortilla.",
        imageUrl:
          "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=1200&q=80",
        price: 19900,
        isAvailable: true,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: wraps.id,
        name: "Loaded Masala Fries",
        description: "Crisp fries with peri peri dust, cheese drizzle, jalapenos, spring onion.",
        imageUrl:
          "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80",
        price: 14900,
        isAvailable: true,
        isFeatured: true,
        spiceLevel: 1,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: drinks.id,
        name: "Cold Brew Tonic",
        description: "House cold brew with tonic water, orange peel, and a sharp citrus lift.",
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        price: 12900,
        isAvailable: true,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: drinks.id,
        name: "Mango Basil Cooler",
        description: "Fresh mango, basil, soda, and lime over ice.",
        imageUrl:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
        price: 11900,
        isAvailable: true,
        sortOrder: 2,
      },
    }),
  ]);

  const todayKey = format(new Date(), "yyyyMMdd");

  const readyCheckout = await prisma.checkoutSession.create({
    data: {
      restaurantId: restaurant.id,
      customerName: "Aarav",
      customerPhone: "9876543210",
      itemsJson: [
        {
          menuItemId: menuItems[0].id,
          quantity: 1,
          nameSnapshot: menuItems[0].name,
          priceSnapshot: menuItems[0].price,
          lineTotal: menuItems[0].price,
        },
        {
          menuItemId: menuItems[4].id,
          quantity: 1,
          nameSnapshot: menuItems[4].name,
          priceSnapshot: menuItems[4].price,
          lineTotal: menuItems[4].price,
        },
      ],
      subtotal: menuItems[0].price + menuItems[4].price,
      tax: Math.round((menuItems[0].price + menuItems[4].price) * 0.05),
      total:
        menuItems[0].price + menuItems[4].price + Math.round((menuItems[0].price + menuItems[4].price) * 0.05),
      status: CheckoutStatus.VERIFIED,
      razorpayOrderId: "seed_order_ready",
      razorpayPaymentId: "seed_payment_ready",
      razorpaySignature: "seed_signature_ready",
    },
  });

  const readyOrder = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      checkoutSessionId: readyCheckout.id,
      tokenNumber: 11,
      status: OrderStatus.READY,
      customerName: "Aarav",
      customerPhone: "9876543210",
      subtotal: readyCheckout.subtotal,
      tax: readyCheckout.tax,
      total: readyCheckout.total,
      paymentReference: readyCheckout.razorpayPaymentId!,
      readyAt: new Date(),
      statusUpdatedAt: new Date(),
      items: {
        create: [
          {
            menuItemId: menuItems[0].id,
            nameSnapshot: menuItems[0].name,
            priceSnapshot: menuItems[0].price,
            quantity: 1,
            lineTotal: menuItems[0].price,
          },
          {
            menuItemId: menuItems[4].id,
            nameSnapshot: menuItems[4].name,
            priceSnapshot: menuItems[4].price,
            quantity: 1,
            lineTotal: menuItems[4].price,
          },
        ],
      },
      events: {
        create: [{ status: OrderStatus.NEW }, { status: OrderStatus.PREPARING }, { status: OrderStatus.READY }],
      },
    },
  });

  const newCheckout = await prisma.checkoutSession.create({
    data: {
      restaurantId: restaurant.id,
      customerName: "Meera",
      customerPhone: "9988776655",
      notes: "No onions on the wrap",
      itemsJson: [
        {
          menuItemId: menuItems[2].id,
          quantity: 1,
          nameSnapshot: menuItems[2].name,
          priceSnapshot: menuItems[2].price,
          lineTotal: menuItems[2].price,
        },
        {
          menuItemId: menuItems[3].id,
          quantity: 1,
          nameSnapshot: menuItems[3].name,
          priceSnapshot: menuItems[3].price,
          lineTotal: menuItems[3].price,
        },
      ],
      subtotal: menuItems[2].price + menuItems[3].price,
      tax: Math.round((menuItems[2].price + menuItems[3].price) * 0.05),
      total:
        menuItems[2].price + menuItems[3].price + Math.round((menuItems[2].price + menuItems[3].price) * 0.05),
      status: CheckoutStatus.VERIFIED,
      razorpayOrderId: "seed_order_new",
      razorpayPaymentId: "seed_payment_new",
      razorpaySignature: "seed_signature_new",
    },
  });

  await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      checkoutSessionId: newCheckout.id,
      tokenNumber: 12,
      status: OrderStatus.NEW,
      customerName: "Meera",
      customerPhone: "9988776655",
      notes: "No onions on the wrap",
      subtotal: newCheckout.subtotal,
      tax: newCheckout.tax,
      total: newCheckout.total,
      paymentReference: newCheckout.razorpayPaymentId!,
      statusUpdatedAt: new Date(),
      items: {
        create: [
          {
            menuItemId: menuItems[2].id,
            nameSnapshot: menuItems[2].name,
            priceSnapshot: menuItems[2].price,
            quantity: 1,
            lineTotal: menuItems[2].price,
          },
          {
            menuItemId: menuItems[3].id,
            nameSnapshot: menuItems[3].name,
            priceSnapshot: menuItems[3].price,
            quantity: 1,
            lineTotal: menuItems[3].price,
          },
        ],
      },
      events: {
        create: [{ status: OrderStatus.NEW }],
      },
    },
  });

  await prisma.dailyTokenCounter.create({
    data: {
      restaurantId: restaurant.id,
      dateKey: todayKey,
      currentValue: 12,
    },
  });

  console.log("Seed complete");
  console.log(`Restaurant URL: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/r/${restaurant.slug}`);
  console.log(`Display URL: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/display/${restaurant.slug}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Sample ready order: #${readyOrder.tokenNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
