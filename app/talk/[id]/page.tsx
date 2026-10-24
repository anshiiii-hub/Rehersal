import PublicTalk from "@/components/public-talk";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PublicTalk id={(await params).id} />;
}
