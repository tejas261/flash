import type { OrderStatus } from "@/generated/prisma/enums";

export type PublicMenuData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heroTitle: string | null;
  heroDescription: string | null;
  currency: string;
  themeColor: string;
  supportPhone: string | null;
  categories: Array<{
    id: string;
    name: string;
    sortOrder: number;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: number;
      spiceLevel: number | null;
      isFeatured: boolean;
    }>;
  }>;
};

export type OrderTrackingPayload = {
  id: string;
  restaurantName: string;
  restaurantSlug: string;
  tokenNumber: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  placedAt: string;
  statusUpdatedAt: string;
  items: Array<{
    id: string;
    nameSnapshot: string;
    quantity: number;
    lineTotal: number;
    notes: string | null;
  }>;
  events: Array<{
    id: string;
    status: OrderStatus;
    createdAt: string;
  }>;
};

export type AdminOrderCard = {
  id: string;
  tokenNumber: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  placedAt: string;
  statusUpdatedAt: string;
  items: Array<{
    id: string;
    nameSnapshot: string;
    quantity: number;
    lineTotal: number;
  }>;
};
