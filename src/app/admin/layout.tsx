import type { Metadata } from "next";
import SessionTimeoutProvider from "@/components/common/SessionTimeoutProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Portal | MtishbiScholar",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionTimeoutProvider portalType="admin">
      {children}
    </SessionTimeoutProvider>
  );
}
