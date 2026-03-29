"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ClassInfoItem,
  School,
  SchoolInfoSummary,
  StudentCountSummary,
} from "@/lib/types";

const regions = [
  { code: "B10", name: "서울특별시" },
  { code: "C10", name: "부산광역시" },
  { code: "D10", name: "대구광역시" },
  { code: "E10", name: "인천광역시" },
  { code: "F10", name: "광주광역시" },
  { code: "G10", name: "대전광역시" },
  { code: "H10", name: "울산광역시" },
  { code: "I10", name: "세종특별자치시" },
  { code: "J10", name: "경기도" },
  { code: "K10", name: "강원도" },
  { code: "M10", name: "충청북도" },
  { code: "N10", name: "충청남도" },
  { code: "P10", name: "전라북도" },
  { code: "Q10", name: "전라남도" },
  { code: "R10", name: "경상북도" },
  { code: "S10", name: "경상남도" },
  { code: "T10", name: "제주특별자치도" },
];

const schoolTypes = ["초등학교", "중학교", "고등학교"];

function getMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYMD(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekRange(startStr: string) {
  const start = parseYMD(startStr);
  const end = addDays(start, 4);

  const y = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const startDate = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDate = end.getDate();

  return `${y}년 ${startMonth}월 ${startDate}일 - ${endMonth}월 ${endDate}일`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 break-all text-base font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const defaultWeekStart = useMemo(() => formatYMD(getMonday(today)), [today]);

  const [region, setRegion] = useState("D10");
  const [schoolType, setSchoolType] = useState("중학교");
  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [grade, setGrade] = useState("1");
  const [classNm, setClassNm] = useState("전체");
  const [weekStart, setWeekStart] = useState(defaultWeekStart);

  const [schools, setSchools] = useState<School[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoSummary | null>(null);
  const [schoolInfoLoading, setSchoolInfoLoading] = useState(false);
  const [schoolInfoError, setSchoolInfoError] = useState("");

  const [studentCountInfo, setStudentCountInfo] =
    useState<StudentCountSummary | null>(null);
  const [studentCountLoading, setStudentCountLoading] = useState(false);
  const [studentCountError, setStudentCountError] = useState("");

  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);

  async function handleSchoolSearch(keyword: string) {
    if (!keyword.trim()) {
      setSchools([]);
      setSearchOpen(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/neis/school-search?keyword=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "학교 검색 실패");
        setSchools([]);
        setSearchOpen(false);
        return;
      }

      const filtered = (data.schools || []).filter(
        (school: School) =>
          school.ATPT_OFCDC_SC_CODE === region &&
          school.SCHUL_KND_SC_NM.includes(schoolType)
      );

      setSchools(filtered);
      setSearchOpen(true);

      if (filtered.length === 0) {
        setError("조건에 맞는 학교가 없어요.");
      }
    } catch {
      setError("학교 검색 중 오류가 발생했어요.");
      setSchools([]);
      setSearchOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSchool(school: School) {
    setSelectedSchool(school);
    setSchoolKeyword(school.SCHUL_NM);
    setSchools([]);
    setSearchOpen(false);
    setError("");
  }

  function handlePrevWeek() {
    const current = parseYMD(weekStart);
    const prev = addDays(current, -7);
    setWeekStart(formatYMD(prev));
  }

  function handleNextWeek() {
    const current = parseYMD(weekStart);
    const next = addDays(current, 7);
    setWeekStart(formatYMD(next));
  }

  function saveSelection() {
    if (!selectedSchool) return;

    localStorage.setItem(
      "schoolpick:selectedSchool",
      JSON.stringify(selectedSchool)
    );
    localStorage.setItem("schoolpick:selectedRegion", region);
    localStorage.setItem("schoolpick:selectedSchoolType", schoolType);
    localStorage.setItem("schoolpick:selectedGrade", grade);
    localStorage.setItem("schoolpick:selectedClassNm", classNm);
    localStorage.setItem("schoolpick:selectedWeekStart", weekStart);
  }

  function handleGoMeal() {
    if (!selectedSchool) {
      setError("학교를 먼저 선택해줘.");
      return;
    }

    saveSelection();

    const params = new URLSearchParams({
      weekStart,
    });

    router.push(`/meal?${params.toString()}`);
  }

  function handleGoTimetable() {
    if (!selectedSchool) {
      setError("학교를 먼저 선택해줘.");
      return;
    }

    if (!classNm || classNm === "전체") {
      setError("시간표는 반을 선택해야 해.");
      return;
    }

    saveSelection();

    const params = new URLSearchParams({
      weekStart,
      grade,
      classNm,
    });

    router.push(`/timetable?${params.toString()}`);
  }

  useEffect(() => {
    const savedSchool = localStorage.getItem("schoolpick:selectedSchool");
    const savedRegion = localStorage.getItem("schoolpick:selectedRegion");
    const savedSchoolType = localStorage.getItem("schoolpick:selectedSchoolType");
    const savedGrade = localStorage.getItem("schoolpick:selectedGrade");
    const savedClassNm = localStorage.getItem("schoolpick:selectedClassNm");
    const savedWeekStart = localStorage.getItem("schoolpick:selectedWeekStart");

    if (savedRegion) setRegion(savedRegion);
    if (savedSchoolType) setSchoolType(savedSchoolType);
    if (savedGrade) setGrade(savedGrade);
    if (savedClassNm) setClassNm(savedClassNm);
    if (savedWeekStart) setWeekStart(savedWeekStart);

    if (savedSchool) {
      try {
        const parsed = JSON.parse(savedSchool) as School;
        setSelectedSchool(parsed);
        setSchoolKeyword(parsed.SCHUL_NM);
      } catch {
        setSelectedSchool(null);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (schoolKeyword.trim() && schoolKeyword !== selectedSchool?.SCHUL_NM) {
        handleSchoolSearch(schoolKeyword);
      } else if (!schoolKeyword.trim()) {
        setSchools([]);
        setSearchOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [schoolKeyword, region, schoolType, selectedSchool]);

  useEffect(() => {
    if (!selectedSchool) {
      setClassOptions([]);
      setClassNm("전체");
      setClassError("");
      return;
    }

    async function loadClasses() {
      setClassLoading(true);
      setClassError("");
      setClassOptions([]);

      try {
        const params = new URLSearchParams({
          officeCode: selectedSchool.ATPT_OFCDC_SC_CODE,
          schoolCode: selectedSchool.SD_SCHUL_CODE,
          schoolKind: selectedSchool.SCHUL_KND_SC_NM,
          grade,
          year: String(new Date().getFullYear()),
        });

        const res = await fetch(`/api/neis/class-info?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setClassError(data.error || "반 정보를 불러오지 못했어요.");
          setClassNm("전체");
          return;
        }

        const rows = (data.classes || []) as ClassInfoItem[];

        const uniqueClasses = Array.from(
          new Set(
            rows
              .map((item) => String(item.CLASS_NM).trim())
              .filter(Boolean)
          )
        ).sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);

          if (!Number.isNaN(na) && !Number.isNaN(nb)) {
            return na - nb;
          }

          return a.localeCompare(b, "ko");
        });

        if (uniqueClasses.length === 0) {
          setClassOptions([]);
          setClassNm("전체");
          setClassError("불러올 반 정보가 없어요.");
          return;
        }

        setClassOptions(uniqueClasses);

        setClassNm((prev) => {
          if (prev !== "전체" && uniqueClasses.includes(prev)) {
            return prev;
          }
          return uniqueClasses[0];
        });
      } catch {
        setClassError("반 정보를 불러오는 중 오류가 발생했어요.");
        setClassNm("전체");
      } finally {
        setClassLoading(false);
      }
    }

    loadClasses();
  }, [selectedSchool, grade]);

  useEffect(() => {
    if (!selectedSchool) {
      setSchoolInfo(null);
      setSchoolInfoError("");
      return;
    }

    async function loadSchoolInfo() {
      setSchoolInfoLoading(true);
      setSchoolInfoError("");
      setSchoolInfo(null);

      try {
        const regionName =
          regions.find((item) => item.code === region)?.name ||
          selectedSchool.ATPT_OFCDC_SC_NM;

        const params = new URLSearchParams({
          schoolName: selectedSchool.SCHUL_NM,
          regionName,
          schoolType,
          address: selectedSchool.ORG_RDNMA || "",
        });

        const res = await fetch(`/api/schoolinfo?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setSchoolInfoError(data.error || "학교 상세 정보를 불러오지 못했어요.");
          return;
        }

        setSchoolInfo((data.schoolInfo || null) as SchoolInfoSummary | null);
      } catch {
        setSchoolInfoError("학교 상세 정보를 불러오는 중 오류가 발생했어요.");
      } finally {
        setSchoolInfoLoading(false);
      }
    }

    loadSchoolInfo();
  }, [selectedSchool, region, schoolType]);

  useEffect(() => {
    if (!selectedSchool) {
      setStudentCountInfo(null);
      setStudentCountError("");
      return;
    }

    async function loadStudentCount() {
      setStudentCountLoading(true);
      setStudentCountError("");
      setStudentCountInfo(null);

      try {
        const regionName =
          regions.find((item) => item.code === region)?.name ||
          selectedSchool.ATPT_OFCDC_SC_NM;

        const params = new URLSearchParams({
          schoolName: selectedSchool.SCHUL_NM,
          regionName,
          schoolType,
          address: selectedSchool.ORG_RDNMA || "",
        });

        const res = await fetch(`/api/schoolinfo/student-count?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setStudentCountError(data.error || "학생수 정보를 불러오지 못했어요.");
          return;
        }

        setStudentCountInfo((data.studentCount || null) as StudentCountSummary | null);
      } catch {
        setStudentCountError("학생수 정보를 불러오는 중 오류가 발생했어요.");
      } finally {
        setStudentCountLoading(false);
      }
    }

    loadStudentCount();
  }, [selectedSchool, region, schoolType]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 xl:grid-cols-4">
            <Field label="지역">
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setSelectedSchool(null);
                  setSchoolKeyword("");
                  setSchools([]);
                  setSearchOpen(false);
                  setClassOptions([]);
                  setClassNm("전체");
                  setSchoolInfo(null);
                  setSchoolInfoError("");
                  setStudentCountInfo(null);
                  setStudentCountError("");
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                {regions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="학교급">
              <select
                value={schoolType}
                onChange={(e) => {
                  setSchoolType(e.target.value);
                  setSelectedSchool(null);
                  setSchoolKeyword("");
                  setSchools([]);
                  setSearchOpen(false);
                  setClassOptions([]);
                  setClassNm("전체");
                  setSchoolInfo(null);
                  setSchoolInfoError("");
                  setStudentCountInfo(null);
                  setStudentCountError("");
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                {schoolTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="학교">
              <div className="relative">
                <input
                  value={schoolKeyword}
                  onChange={(e) => {
                    setSchoolKeyword(e.target.value);
                    if (selectedSchool && e.target.value !== selectedSchool.SCHUL_NM) {
                      setSelectedSchool(null);
                      setClassOptions([]);
                      setClassNm("전체");
                      setSchoolInfo(null);
                      setSchoolInfoError("");
                      setStudentCountInfo(null);
                      setStudentCountError("");
                    }
                  }}
                  placeholder="학교 검색"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                {searchOpen && (
                  <div className="absolute left-0 top-[50px] z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {schools.length > 0 ? (
                      schools.map((school) => (
                        <button
                          key={`${school.ATPT_OFCDC_SC_CODE}-${school.SD_SCHUL_CODE}`}
                          type="button"
                          onClick={() => handleSelectSchool(school)}
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-emerald-50"
                        >
                          <div className="text-sm font-semibold text-gray-900">
                            {school.SCHUL_NM}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {school.ATPT_OFCDC_SC_NM} · {school.SCHUL_KND_SC_NM}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        검색 결과가 없어요.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field label="주 선택">
              <div className="flex h-11 items-center justify-between rounded-xl border border-gray-200 bg-white px-3">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-emerald-500 transition hover:bg-emerald-50"
                >
                  ‹
                </button>

                <div className="px-2 text-center text-[15px] font-medium text-gray-800">
                  {weekLabel}
                </div>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-emerald-500 transition hover:bg-emerald-50"
                >
                  ›
                </button>
              </div>
            </Field>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="학년">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>

            <Field label="반">
              <select
                value={classNm}
                onChange={(e) => setClassNm(e.target.value)}
                disabled={!selectedSchool || classLoading}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition disabled:bg-gray-100 disabled:text-gray-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="전체">전체</option>
                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}반
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleGoMeal}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0"
            >
              급식 보기
            </button>

            <button
              type="button"
              onClick={handleGoTimetable}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
            >
              주간 시간표 보기
            </button>
          </div>

          {(error || loading || selectedSchool || classLoading || classError) && (
            <div className="mt-5 space-y-1">
              {loading && (
                <p className="text-sm text-gray-500">학교 검색 중...</p>
              )}

              {!loading && error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {!loading && !error && selectedSchool && (
                <p className="text-sm text-gray-500">
                  선택된 학교:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedSchool.SCHUL_NM}
                  </span>
                </p>
              )}

              {classLoading && (
                <p className="text-sm text-gray-500">반 정보 불러오는 중...</p>
              )}

              {!classLoading && classError && (
                <p className="text-sm text-red-500">{classError}</p>
              )}
            </div>
          )}
        </section>

        {selectedSchool && (
          <section className="mt-6 rounded-[24px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-500">
                  학교 정보
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
                  {selectedSchool.SCHUL_NM}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedSchool.ATPT_OFCDC_SC_NM} · {selectedSchool.SCHUL_KND_SC_NM}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  label="관할 교육청"
                  value={schoolInfo?.officeName || selectedSchool.ATPT_OFCDC_SC_NM || "-"}
                />
                <InfoCard
                  label="설립구분"
                  value={schoolInfo?.foundedDivision || "-"}
                />
                <InfoCard
                  label="설립유형"
                  value={schoolInfo?.foundedType || "-"}
                />
                <InfoCard
                  label="설립일자"
                  value={schoolInfo?.foundedDate || "-"}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard label="교장" value={schoolInfo?.principal || "-"} />
              <InfoCard label="대표 전화번호" value={schoolInfo?.tel || "-"} />
              <InfoCard label="팩스번호" value={schoolInfo?.fax || "-"} />
              <InfoCard
                label="학생수"
                value={studentCountInfo?.total || schoolInfo?.studentCount || "-"}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-500">주소</p>
              <p className="mt-2 text-base leading-7 text-gray-800">
                {schoolInfo?.address || selectedSchool.ORG_RDNMA || "주소 정보 없음"}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-500">홈페이지</p>
              {schoolInfo?.homepage && schoolInfo.homepage !== "-" ? (
                <a
                  href={schoolInfo.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block break-all text-base font-semibold text-emerald-600 hover:underline"
                >
                  {schoolInfo.homepage}
                </a>
              ) : (
                <p className="mt-2 text-base text-gray-800">-</p>
              )}
            </div>

            {(schoolInfoLoading || schoolInfoError || studentCountLoading || studentCountError) && (
              <div className="mt-5 space-y-1">
                {schoolInfoLoading && (
                  <p className="text-sm text-gray-500">
                    schoolinfo 학교 상세 정보 불러오는 중...
                  </p>
                )}

                {!schoolInfoLoading && schoolInfoError && (
                  <p className="text-sm text-red-500">{schoolInfoError}</p>
                )}

                {studentCountLoading && (
                  <p className="text-sm text-gray-500">
                    학생수 정보 불러오는 중...
                  </p>
                )}

                {!studentCountLoading && studentCountError && (
                  <p className="text-sm text-red-500">{studentCountError}</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}