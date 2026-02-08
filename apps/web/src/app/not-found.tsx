"use client";
import { useRouter } from "next/navigation";
import ThemedButton from "@/components/themed/button";
import { typography } from "@/styles/typography";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col">
        <div className={`${typography.h1} text-left mb-2`}>
          <span className="text-custom-secondary-text">404</span>
          <span> Not Found</span>
        </div>
        <ThemedButton
          style="primary"
          size="lg"
          variant="default"
          onClick={() => router.push("/")}
        >
          Go to Home
        </ThemedButton>
      </div>
    </div>
  );
}
