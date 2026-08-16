"use client";

import { useRouter, usePathname } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <button
      type="button"
      className="back-button"
      onClick={() => router.back()}
      aria-label="Go back"
      title="Back"
    >
      ←
    </button>
  );
}
