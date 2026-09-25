"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  // Footer sirf Dashboard (/) pe dikhega
  if (pathname !== "/") return null;
  return <Footer />;
}
