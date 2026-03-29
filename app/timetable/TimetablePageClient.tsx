"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { School, TimetableItem } from "@/lib/types";

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

type TimetablePageClientProps = {
  initialWeekStart: string;
  initialGrade: string;
  initialClassNm: string;
};

export default function TimetablePageClient({
  initialWeekStart,
  initialGrade,
  initialClassNm,
}: TimetablePageClientProps) {
  const router = useRouter();

  const [school, setSchool] = useState<School | null>(null);
  const [grade, setGrade] = useState(initialGrade);
  const [classNm, setClassNm] = useState(initialClassNm);
  const [weekStart, setWeekStart] = useState(initialWeekStart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weeklyData, setWeeklyData] = useState<Record<string, TimetableItem[]>>(
    {}
  );

  useEffect(() => {
    const raw = localStorage.getItem("schoolpick:selectedSchool");
    const savedGrade = localStorage.getItem("schoolpick:selectedGrade");
    const savedClassNm = localStorage.getItem("schoolpick:selectedClassNm");
    const savedWeekStart = localStorage.getItem("schoolpick:selectedWeekStart");

    if (raw) {
      try {
        setSchool(JSON.parse(raw) as School);
      } catch {
        setSchool(null);
      }
    }

    if (!initialGrade && savedGrade) setGrade(savedGrade);
    if (!initialClassNm && savedClassNm) setClassNm(savedClassNm);
    if (!initialWeekStart && savedWeekStart) setWeekStart(savedWeekStart);
  }, [initialWeekStart, initialGrade, initialClassNm]);

  const selectedSchool = school;

  const weekDays = useMemo(() => {
    if (!weekStart) return [];
    return getWeekDays(weekStart);
  }, [weekStart]);

  function moveWeek(days: number) {
    if (!weekStart) return;

    const current = parseYMD(weekStart);
    const next = addDays(current, days);
    const nextWeekStart = formatYMD(next);

    localStorage.setItem("schoolpick:selectedWeekStart", nextWeekStart);

    const params = new URLSearchParams({
      weekStart: nextWeekStart,
      grade,
      classNm,
    });

    router.push(`/timetable?${params.toString()}`);
  }

  useEffect(() => {
    if (!selectedSchool || !grade || !classNm || !weekStart) return;
    if (classNm === "전체") return;

    const schoolValue = selectedSchool;

    async function loadWeeklyTimetable() {
      setLoading(true);
      setError("");
      setWeeklyData({});

      try {
        const results = await Promise.all(
          weekDays.map(async (day) => {
            const params = new URLSearchParams({
              officeCode: schoolValue.ATPT_OFCDC_SC_CODE,
              schoolCode: schoolValue.SD_SCHUL_CODE,
              schoolKind: schoolValue.SCHUL_KND_SC_NM,
              grade,
              classNm,
              date: day.neis,
            });

            const res = await fetch(`/api/neis/timetable?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
              return { key: day.key, items: [] };
            }

            const items = (data.timetable || []) as TimetableItem[];
            return { key: day.key, items };
          })
        );

        const mapped: Record<string, TimetableItem[]> = {};
        for (const item of results) {
          mapped[item.key] = [...item.items].sort(
            (a, b) => Number(a.PERIO) - Number(b.PERIO)
          );
        }

        setWeeklyData(mapped);
      } catch {
        setError("주간 시간표를 불러오는 중 오류가 발생했어요.");
      } finally {
        setLoading(false);
      }
    }

    loadWeeklyTimetable();
  }, [selectedSchool, grade, classNm, weekStart, weekDays]);

  if (!selectedSchool) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-[24px] bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold text-emerald-600">
            주간 시간표
          </h1>
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
              <p className="text-sm font-semibold text-emerald-500">
                주간 시간표
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
                {selectedSchool.SCHUL_NM}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {selectedSchool.ATPT_OFCDC_SC_NM} · {selectedSchool.SCHUL_KND_SC_NM}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {grade}학년 {classNm}반
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
                {formatWeekTitle(weekStart)}
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
                href={`/meal?weekStart=${encodeURIComponent(weekStart)}`}
                className="inline-flex h-11 items-center rounded-2xl bg-emerald-500 px-5 font-semibold text-white"
              >
                급식 보기
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading && (
            <div className="rounded-[24px] bg-white p-8 text-gray-500 shadow-sm">
              주간 시간표 불러오는 중...
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
                const items = weeklyData[day.key] || [];

                return (
                  <div
                    key={day.key}
                    className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                  >
                    <div className="bg-emerald-500 px-5 py-4 text-white">
                      <div className="text-lg font-bold">{day.label}</div>
                      <div className="mt-1 text-sm text-white/90">{day.title}</div>
                    </div>

                    <div className="p-4">
                      {items.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                          시간표 정보가 없어요.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div
                              key={`${day.key}-${item.PERIO}-${index}`}
                              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                            >
                              <div className="text-sm font-bold text-emerald-600">
                                {item.PERIO}교시
                              </div>
                              <div className="mt-2 text-sm leading-6 text-gray-800">
                                {item.ITRT_CNTNT || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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