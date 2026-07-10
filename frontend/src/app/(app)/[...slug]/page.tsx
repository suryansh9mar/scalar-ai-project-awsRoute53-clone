import { ComingSoon } from "@/components/ComingSoon";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  
  // Create a nice human-readable title from the URL segments
  // e.g. ["resolver", "shared-views"] -> "Resolver / Shared views"
  const title = resolvedParams.slug
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
    .join(" / ");

  return <ComingSoon title={title} />;
}
