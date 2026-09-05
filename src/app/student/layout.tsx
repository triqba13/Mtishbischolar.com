import type { Metadata } from "next";
import SessionTimeoutProvider from "@/components/common/SessionTimeoutProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Portal | MtishbiScholar",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionTimeoutProvider portalType="student">
      {children}
    </SessionTimeoutProvider>
  );
}
