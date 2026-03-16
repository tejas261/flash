"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema, menuItemSchema } from "@/lib/validations";

function parseCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function upsertCategoryAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = categorySchema.safeParse({
    categoryId: formData.get("categoryId") || undefined,
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    isActive: parseCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Unable to save category.");
  }

  const { categoryId, ...data } = parsed.data;

  if (categoryId) {
    const existingCategory = await db.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: session.user.restaurantId,
      },
      select: { id: true },
    });

    if (!existingCategory) {
      throw new Error("Category not found.");
    }

    await db.category.update({
      where: { id: categoryId },
      data,
    });
  } else {
    await db.category.create({
      data: {
        ...data,
        restaurantId: session.user.restaurantId,
      },
    });
  }

  revalidatePath("/admin/menu");
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await requireAdminSession();
  const categoryId = String(formData.get("categoryId") || "");

  const itemCount = await db.menuItem.count({
    where: {
      categoryId,
      restaurantId: session.user.restaurantId,
    },
  });

  if (itemCount > 0) {
    throw new Error("Delete menu items in this category before deleting the category.");
  }

  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      restaurantId: session.user.restaurantId,
    },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  await db.category.delete({
    where: { id: category.id },
  });

  revalidatePath("/admin/menu");
}

export async function upsertMenuItemAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = menuItemSchema.safeParse({
    itemId: formData.get("itemId") || undefined,
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    imageUrl: formData.get("imageUrl") || "",
    priceRupees: formData.get("priceRupees"),
    sortOrder: formData.get("sortOrder"),
    spiceLevel: formData.get("spiceLevel") || undefined,
    isAvailable: parseCheckbox(formData, "isAvailable"),
    isFeatured: parseCheckbox(formData, "isFeatured"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Unable to save menu item.");
  }

  const { itemId, priceRupees, description, imageUrl, ...rest } = parsed.data;
  const payload = {
    ...rest,
    restaurantId: session.user.restaurantId,
    price: Math.round(priceRupees * 100),
    description: description || null,
    imageUrl: imageUrl || null,
  };

  if (itemId) {
    const existingItem = await db.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: session.user.restaurantId,
      },
      select: { id: true },
    });

    if (!existingItem) {
      throw new Error("Menu item not found.");
    }

    await db.menuItem.update({
      where: { id: itemId },
      data: payload,
    });
  } else {
    await db.menuItem.create({
      data: payload,
    });
  }

  revalidatePath("/admin/menu");
  revalidatePath(`/r/${session.user.restaurant.slug}`);
}

export async function deleteMenuItemAction(formData: FormData) {
  const session = await requireAdminSession();
  const itemId = String(formData.get("itemId") || "");

  const item = await db.menuItem.findFirst({
    where: {
      id: itemId,
      restaurantId: session.user.restaurantId,
    },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Menu item not found.");
  }

  await db.menuItem.delete({
    where: { id: item.id },
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/r/${session.user.restaurant.slug}`);
}
