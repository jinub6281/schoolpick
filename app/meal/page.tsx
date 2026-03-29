import { Suspense } from "react";
import MealPageClient from "./MealPageClient";

type MealPageProps = {
  searchParams: Promise<{
    weekStart?: string;
  }>;
};

export default async function MealPage({ searchParams }: MealPageProps) {
  const params = await searchParams;
  const weekStart = params.weekStart ?? "";

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f9] px-4 py-8" />}>
      <MealPageClient initialWeekStart={weekStart} />
    </Suspense>
  );
}