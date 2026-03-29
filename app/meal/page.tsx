"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { MealItem, School } from "@/lib/types";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseYMD(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatNeisDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatWeekTitle(startStr: string) {
  const start = parseYMD(startStr);
  const end = addDays(start, 4);

  const y = start.getFullYear();
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();

  return `${y}년 ${sm}월 ${sd}일 - ${em}월 ${ed}일`;
}

function getWeekDays(startStr: string) {
  const start = parseYMD(startStr);
  const labels = ["월", "화", "수", "목", "금"];

  return Array.from({ length: 5 }).map((_, index) => {
    const date = addDays(start, index);
    return {
      label: labels[index],
      date,
      key: formatYMD(date),
      neis: formatNeisDate(date),
      title: `${date.getMonth() + 1}/${date.getDate()} (${labels[index]})`,
    };
  });
}

function normalizeDishText(text: string) {
  return String(text || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\(\d+(\.\d+)*\)/g, "")
    .trim();
}

function groupMeals(items: MealItem[]) {
  return {
    breakfast: items.find((item) => item.MMEAL_SC_NM.includes("조식")),
    lunch: items.find((item) => item.MMEAL_SC_NM.includes("중식")),
    dinner: items.find((item) => item.MMEAL_SC_NM.includes("석식")),
  };
}

export default function MealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [school, setSchool] = useState<School | null>(null);
  const [weekStart, setWeekStart] = useState(searchParams.get("weekStart") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [weeklyMeals, setWeeklyMeals] = useState<Record<string, MealItem[]>>({});

  useEffect(() => {
    const raw = localStorage.getItem("schoolpick:selectedSchool");
    const savedWeekStart = localStorage.getItem("schoolpick:selectedWeekStart");

    if (raw) {
      try {
        setSchool(JSON.parse(raw) as School);
      } catch {
        setSchool(null);
      }
    }

    if (!searchParams.get("weekStart") && savedWeekStart) {
      setWeekStart(savedWeekStart);
    }
  }, [searchParams]);

  const selectedSchool = school;
  const weekDays = useMemo(() => {
    if (!weekStart) return [];
    return getWeekDays(weekStart);
  }, [weekStart]);

  function moveWeek(days: number) {
    const current = parseYMD(weekStart);
    const next = addDays(current, days);
    const nextWeekStart = formatYMD(next);
    localStorage.setItem("schoolpick:selectedWeekStart", nextWeekStart);
    router.push(`/meal?weekStart=${encodeURIComponent(nextWeekStart)}`);
  }

  useEffect(() => {
    if (!selectedSchool || !weekStart) return;

    async function loadWeeklyMeals() {
      setLoading(true);
      setError("");
      setWeeklyMeals({});

      try {
        const results = await Promise.all(
          weekDays.map(async (day) => {
            const params = new URLSearchParams({
              officeCode: selectedSchool.ATPT_OFCDC_SC_CODE,
              schoolCode: selectedSchool.SD_SCHUL_CODE,
              date: day.neis,
            });

            const res = await fetch(`/api/neis/meal?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
              return {
                key: day.key,
                items: [],
              };
            }

            const items = (data.meals || []) as MealItem[];
            return {
              key: day.key,
              items,
            };
          })
        );

        const mapped: Record<string, MealItem[]> = {};
        for (const item of results) {
          mapped[item.key] = item.items;
        }

        setWeeklyMeals(mapped);
      } catch {
        setError("주간 급식표를 불러오는 중 오류가 발생했어요.");
      } finally {
        setLoading(false);
      }
    }

    loadWeeklyMeals();
  }, [selectedSchool, weekStart, weekDays]);

  if (!selectedSchool) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-[24px] bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold text-emerald-600">주간 급식표</h1>
          <p className="mt-3 text-gray-500">먼저 메인에서 학교를 선택해야 해.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white"
          >
            메인으로 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[24px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-500">주간 급식표</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
                {selectedSchool.SCHUL_NM}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {selectedSchool.ATPT_OFCDC_SC_NM} · {selectedSchool.SCHUL_KND_SC_NM}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => moveWeek(-7)}
                className="inline-flex h-11 items-center rounded-2xl border border-gray-200 bg-white px-5 font-semibold text-gray-700"
              >
                이전 주
              </button>

              <div className="inline-flex h-11 items-center rounded-2xl bg-gray-50 px-5 font-semibold text-gray-700">
                {weekStart ? formatWeekTitle(weekStart) : ""}
              </div>

              <button
                type="button"
                onClick={() => moveWeek(7)}
                className="inline-flex h-11 items-center rounded-2xl border border-gray-200 bg-white px-5 font-semibold text-gray-700"
              >
                다음 주
              </button>

              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-2xl border border-gray-200 bg-white px-5 font-semibold text-gray-700"
              >
                메인으로
              </Link>

              <Link
                href={`/timetable?weekStart=${encodeURIComponent(weekStart)}`}
                className="inline-flex h-11 items-center rounded-2xl bg-emerald-500 px-5 font-semibold text-white"
              >
                주간 시간표 보기
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading && (
            <div className="rounded-[24px] bg-white p-8 text-gray-500 shadow-sm">
              주간 급식표 불러오는 중...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[24px] bg-white p-8 text-red-500 shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-5 xl:grid-cols-5">
              {weekDays.map((day) => {
                const items = weeklyMeals[day.key] || [];
                const { breakfast, lunch, dinner } = groupMeals(items);

                return (
                  <div
                    key={day.key}
                    className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                  >
                    <div className="bg-emerald-500 px-5 py-4 text-white">
                      <div className="text-lg font-bold">{day.label}</div>
                      <div className="mt-1 text-sm text-white/90">{day.title}</div>
                    </div>

                    <div className="space-y-4 p-4">
                      <MealSection title="조식" meal={breakfast} />
                      <MealSection title="중식" meal={lunch} />
                      <MealSection title="석식" meal={dinner} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MealSection({
  title,
  meal,
}: {
  title: string;
  meal?: MealItem;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-sm font-bold text-emerald-600">{title}</div>

      {meal ? (
        <>
          <div className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-800">
            {normalizeDishText(meal.DDISH_NM)}
          </div>

          {meal.CAL_INFO && (
            <div className="mt-3 text-xs text-gray-500">
              칼로리: {meal.CAL_INFO}
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 text-sm text-gray-400">정보가 없어요.</div>
      )}
    </div>
  );
}