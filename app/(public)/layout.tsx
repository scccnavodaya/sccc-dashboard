import type { ReactNode } from "react";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-8">{children}</main>
      <Footer />
    </div>
  );
}
