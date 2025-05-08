import LoginByCode from './LoginByCode';

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <LoginByCode code={code} />;
}
