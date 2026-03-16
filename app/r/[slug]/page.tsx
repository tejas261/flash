import { notFound } from "next/navigation";

import { MenuBrowser } from "@/components/app/menu-browser";
import { getPublicRestaurantMenu } from "@/lib/queries";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantMenu(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-10">
      <MenuBrowser restaurant={restaurant} />
    </main>
  );
}
