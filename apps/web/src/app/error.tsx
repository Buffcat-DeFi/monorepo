"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { typography } from "../styles/typography";
import ThemedButton from "@/components/themed/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col">
        <div className={typography.h1}>
          <span className="text-crypto-blue">Something</span>
          <span> went wrong!</span>
        </div>
        <div className="flex flex-row gap-4 mt-4">
          <ThemedButton
            size="lg"
            style="primary"
            variant="default"
            onClick={() => router.push("/")}
          >
            Go to Home
          </ThemedButton>
          <ThemedButton
            size="lg"
            style="primary"
            variant="default"
            onClick={() => () => reset()}
          >
            Try Again
          </ThemedButton>
        </div>
      </div>
    </div>
  );
}
