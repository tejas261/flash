const SAMPLE_RESTAURANT_ALIASES: Record<string, string[]> = {
  readybell: ["demo-bistro"],
  "demo-bistro": ["readybell"],
};

export function getRestaurantSlugCandidates(slug: string) {
  return [slug, ...(SAMPLE_RESTAURANT_ALIASES[slug] ?? [])];
}
