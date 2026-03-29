"use client";

import { useState } from "react";
import type { School } from "@/lib/types";

type Props = {
  onSelect: (school: School) => void;
};

export default function SchoolSearch({ onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!keyword.trim()) {
      setError("학교명을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setSchools([]);

    try {
      const res = await fetch(
        `/api/neis/school-search?keyword=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "학교 검색 실패");
        return;
      }

      setSchools(data.schools || []);
      if (!data.schools?.length) {
        setError("검색 결과가 없습니다.");
      }
    } catch {
      setError("학교 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 대구소프트웨어마이스터고"
          className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "검색 중..." : "학교 검색"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {!!schools.length && (
        <div className="mt-4 space-y-3">
          {schools.map((school) => (
            <button
              key={`${school.ATPT_OFCDC_SC_CODE}-${school.SD_SCHUL_CODE}`}
              onClick={() => onSelect(school)}
              className="block w-full rounded-xl border p-4 text-left transition hover:bg-blue-50"
            >
              <div className="font-semibold">{school.SCHUL_NM}</div>
              <div className="mt-1 text-sm text-gray-600">
                {school.ATPT_OFCDC_SC_NM} · {school.SCHUL_KND_SC_NM}
              </div>
              <div className="mt-1 text-sm text-gray-500">{school.ORG_RDNMA}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}