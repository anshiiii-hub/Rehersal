import Workspace from "@/components/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; stage: string }>;
}) {
  const { id, stage } = await params;
  return <Workspace id={id} stage={stage} />;
}
