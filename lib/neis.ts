const BASE_URL = "https://open.neis.go.kr/hub";

export async function fetchNeis(
  endpoint: string,
  params: Record<string, string>
) {
  const key = process.env.NEIS_API_KEY;

  if (!key) {
    throw new Error("NEIS_API_KEY가 설정되지 않았습니다.");
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("KEY", key);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "100");

  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`NEIS 요청 실패: ${res.status}`);
  }

  return res.json();
}

export function extractRows(data: any, rootKey: string) {
  const section = data?.[rootKey];
  if (!Array.isArray(section) || section.length < 2) return [];
  return section[1]?.row ?? [];
}

export function normalizeDishText(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\(\d+(\.\d+)*\)/g, "")
    .trim();
}

export function normalizeLineBreaks(text: string) {
  return String(text || "").replace(/<br\s*\/?>/gi, "\n").trim();
}

export function getSchoolType(schoolKind: string) {
  if (schoolKind.includes("초")) return "elementary";
  if (schoolKind.includes("중")) return "middle";
  if (schoolKind.includes("고")) return "high";
  if (schoolKind.includes("특수")) return "special";
  return "middle";
}

export function getTimetableEndpoint(schoolKind: string) {
  const type = getSchoolType(schoolKind);

  if (type === "elementary") return "elsTimetable";
  if (type === "middle") return "misTimetable";
  if (type === "high") return "hisTimetable";
  if (type === "special") return "spsTimetable";

  return "misTimetable";
}

export function getClassInfoEndpoint(schoolKind: string) {
  const type = getSchoolType(schoolKind);

  if (type === "elementary") return "classInfo";
  if (type === "middle") return "classInfo";
  if (type === "high") return "classInfo";
  if (type === "special") return "classInfo";

  return "classInfo";
}