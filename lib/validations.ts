import { OrderStatus } from "@/generated/prisma/enums";
import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const categorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.coerce.boolean().default(true),
});

export const menuItemSchema = z.object({
  itemId: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(280).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  priceRupees: z.coerce.number().min(1).max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999),
  spiceLevel: z.coerce.number().int().min(0).max(5).optional(),
  isAvailable: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

export const checkoutLineItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.coerce.number().int().min(1).max(20),
  notes: z.string().max(140).optional(),
});

export const checkoutRequestSchema = z.object({
  restaurantSlug: z.string().min(2),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  notes: z.string().max(220).optional(),
  items: z.array(checkoutLineItemSchema).min(1),
});

export const paymentVerifySchema = z.object({
  checkoutSessionId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus),
});
