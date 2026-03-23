import ListeningTestDetail from "@/components/listening/ListeningTestDetail";

interface Props {
  params: Promise<{ bookNumber: string; testNumber: string }>;
}

export default async function ListeningTestPage({ params }: Props) {
  const { bookNumber, testNumber } = await params;
  return (
    <ListeningTestDetail
      bookNumber={Number(bookNumber)}
      testNumber={Number(testNumber)}
    />
  );
}
