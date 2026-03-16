import Link from "next/link";

import { AdminNav } from "@/components/app/admin-nav";
import { SubmitButton } from "@/components/app/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategoryAction, deleteMenuItemAction, upsertCategoryAction, upsertMenuItemAction } from "@/lib/actions/menu";
import { requireAdminSession } from "@/lib/auth";
import { getAdminMenuData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminMenuPage() {
  const session = await requireAdminSession();
  const restaurant = await getAdminMenuData(session.user.restaurantId);

  if (!restaurant) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-6 md:px-10">
      <AdminNav restaurantName={session.user.restaurant.name} userName={session.user.name} />

      <section className="mb-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Categories</CardDescription>
            <CardTitle>Add a menu category</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertCategoryAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" name="name" placeholder="Breakfast bowls" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-sort">Sort order</Label>
                <Input id="category-sort" name="sortOrder" type="number" defaultValue={0} required />
              </div>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input type="checkbox" name="isActive" defaultChecked className="size-4 rounded border-border" />
                Active category
              </label>
              <SubmitButton pendingLabel="Saving...">Save category</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Menu items</CardDescription>
            <CardTitle>Add a menu item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertMenuItemAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <select id="item-category" name="categoryId" className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm" required>
                  <option value="">Select category</option>
                  {restaurant.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-name">Item name</Label>
                <Input id="item-name" name="name" placeholder="Smoked paneer wrap" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (INR)</Label>
                <Input id="item-price" name="priceRupees" type="number" min={1} defaultValue={199} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-sort">Sort order</Label>
                <Input id="item-sort" name="sortOrder" type="number" defaultValue={0} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea id="item-description" name="description" placeholder="Crisp, fast, pickup-friendly." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-image">Image URL</Label>
                <Input id="item-image" name="imageUrl" placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-spice">Spice level</Label>
                <Input id="item-spice" name="spiceLevel" type="number" min={0} max={5} defaultValue={0} />
              </div>
              <div className="flex flex-wrap gap-4 md:col-span-2">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" name="isAvailable" defaultChecked className="size-4 rounded border-border" />
                  Available
                </label>
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" name="isFeatured" className="size-4 rounded border-border" />
                  Featured
                </label>
              </div>
              <div className="md:col-span-2">
                <SubmitButton pendingLabel="Saving...">Save item</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Published menu</p>
            <h2 className="font-heading text-3xl font-semibold">Category and item management</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/r/${restaurant.slug}`}>Open public menu</Link>
          </Button>
        </div>

        <div className="space-y-5">
          {restaurant.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardDescription>Category editor</CardDescription>
                    <CardTitle>{category.name}</CardTitle>
                  </div>
                  <Badge variant={category.isActive ? "success" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form action={upsertCategoryAction} className="grid gap-4 md:grid-cols-[1.2fr_0.6fr_auto]">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`category-${category.id}-name`}>Name</Label>
                    <Input id={`category-${category.id}-name`} name="name" defaultValue={category.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`category-${category.id}-sort`}>Sort order</Label>
                    <Input id={`category-${category.id}-sort`} name="sortOrder" type="number" defaultValue={category.sortOrder} required />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="mb-2 flex items-center gap-3 text-sm font-medium">
                      <input type="checkbox" name="isActive" defaultChecked={category.isActive} className="size-4 rounded border-border" />
                      Active
                    </label>
                    <SubmitButton pendingLabel="Saving..." size="sm">
                      Save
                    </SubmitButton>
                  </div>
                </form>

                {category.items.length === 0 ? (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <SubmitButton pendingLabel="Deleting..." variant="destructive" size="sm">
                      Delete empty category
                    </SubmitButton>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Delete all items in this category before removing it.
                  </p>
                )}

                <div className="space-y-4">
                  {category.items.map((item) => (
                    <details key={item.id} className="rounded-3xl border border-border px-4 py-4">
                      <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={item.isAvailable ? "success" : "secondary"}>
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                          {item.isFeatured ? <Badge>Featured</Badge> : null}
                        </div>
                      </summary>
                      <form action={upsertMenuItemAction} className="mt-5 grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="itemId" value={item.id} />
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-category`}>Category</Label>
                          <select
                            id={`item-${item.id}-category`}
                            name="categoryId"
                            defaultValue={item.categoryId}
                            className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm"
                          >
                            {restaurant.categories.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-name`}>Name</Label>
                          <Input id={`item-${item.id}-name`} name="name" defaultValue={item.name} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-price`}>Price (INR)</Label>
                          <Input
                            id={`item-${item.id}-price`}
                            name="priceRupees"
                            type="number"
                            defaultValue={item.price / 100}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-sort`}>Sort order</Label>
                          <Input id={`item-${item.id}-sort`} name="sortOrder" type="number" defaultValue={item.sortOrder} required />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`item-${item.id}-description`}>Description</Label>
                          <Textarea id={`item-${item.id}-description`} name="description" defaultValue={item.description ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-image`}>Image URL</Label>
                          <Input id={`item-${item.id}-image`} name="imageUrl" defaultValue={item.imageUrl ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-${item.id}-spice`}>Spice level</Label>
                          <Input id={`item-${item.id}-spice`} name="spiceLevel" type="number" min={0} max={5} defaultValue={item.spiceLevel ?? 0} />
                        </div>
                        <div className="flex flex-wrap gap-4 md:col-span-2">
                          <label className="flex items-center gap-3 text-sm font-medium">
                            <input type="checkbox" name="isAvailable" defaultChecked={item.isAvailable} className="size-4 rounded border-border" />
                            Available
                          </label>
                          <label className="flex items-center gap-3 text-sm font-medium">
                            <input type="checkbox" name="isFeatured" defaultChecked={item.isFeatured} className="size-4 rounded border-border" />
                            Featured
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-3 md:col-span-2">
                          <SubmitButton pendingLabel="Saving...">Save item</SubmitButton>
                        </div>
                      </form>
                      <form action={deleteMenuItemAction} className="mt-4">
                        <input type="hidden" name="itemId" value={item.id} />
                        <SubmitButton pendingLabel="Deleting..." variant="destructive" size="sm">
                          Delete item
                        </SubmitButton>
                      </form>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
