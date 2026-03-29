import { Suspense } from "react";
import TimetablePageClient from "./TimetablePageClient";

type TimetablePageProps = {
  searchParams: Promise<{
    weekStart?: string;
    grade?: string;
    classNm?: string;
  }>;
};

export default async function TimetablePage({
  searchParams,
}: TimetablePageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f9] px-4 py-8" />}>
      <TimetablePageClient
        initialWeekStart={params.weekStart ?? ""}
        initialGrade={params.grade ?? "1"}
        initialClassNm={params.classNm ?? ""}
      />
    </Suspense>
  );
}