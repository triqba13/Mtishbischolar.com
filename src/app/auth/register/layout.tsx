import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Registration — Start Your Study Abroad Journey",
  description:
    "Create your MtishbiScholar student account to discover international universities, explore scholarships, and apply for admissions.",
  alternates: {
    canonical: "/auth/register",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
