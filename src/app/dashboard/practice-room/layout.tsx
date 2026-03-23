import { SocketProvider } from "@/contexts/SocketContext";

export default function PracticeRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SocketProvider>{children}</SocketProvider>;
}
