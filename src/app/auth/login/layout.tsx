import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Login",
  description:
    "Log in to your MtishbiScholar student portal to track university applications, upload admission documents, and view status updates.",
  alternates: {
    canonical: "/auth/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
