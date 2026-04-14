import { BidPageClient } from "./BidPageClient";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function BidPage({ params }: { params: { id: string } }) {
  return <BidPageClient id={params.id} />;
}
