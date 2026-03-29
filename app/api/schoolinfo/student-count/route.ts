import { NextRequest, NextResponse } from "next/server";

type RawRow = Record<string, unknown>;

const SCHOOLINFO_BASE_URL = "https://www.schoolinfo.go.kr/openApi.do";

const REGION_NAME_TO_SIDO_CODE: Record<string, string> = {
  "서울특별시": "11",
  "부산광역시": "26",
  "대구광역시": "27",
  "인천광역시": "28",
  "광주광역시": "29",
  "대전광역시": "30",
  "울산광역시": "31",
  "세종특별자치시": "36",
  "경기도": "41",
  "강원도": "42",
  "충청북도": "43",
  "충청남도": "44",
  "전라북도": "45",
  "전라남도": "46",
  "경상북도": "47",
  "경상남도": "48",
  "제주특별자치도": "50",
};

const SCHOOL_TYPE_TO_KIND_CODE: Record<string, string> = {
  "초등학교": "02",
  "중학교": "03",
  "고등학교": "04",
};

// schoolinfo 학년별·학급별 학생수는 공개 안내에서 별도 항목으로 제공됨.
// 공개 글 예시에서는 apiType=09로 소개되어 있어 기본값으로 사용.
// 계정별/화면별 차이가 있으면 query의 apiType으로 덮어쓸 수 있게 해둠.
const DEFAULT_STUDENT_COUNT_API_TYPE = "09";

const SGG_CODE_BY_REGION_AND_NAME: Record<string, Record<string, string>> = {
  "서울특별시": {
    "종로구": "11110",
    "중구": "11140",
    "용산구": "11170",
    "성동구": "11200",
    "광진구": "11215",
    "동대문구": "11230",
    "중랑구": "11260",
    "성북구": "11290",
    "강북구": "11305",
    "도봉구": "11320",
    "노원구": "11350",
    "은평구": "11380",
    "서대문구": "11410",
    "마포구": "11440",
    "양천구": "11470",
    "강서구": "11500",
    "구로구": "11530",
    "금천구": "11545",
    "영등포구": "11560",
    "동작구": "11590",
    "관악구": "11620",
    "서초구": "11650",
    "강남구": "11680",
    "송파구": "11710",
    "강동구": "11740",
  },
  "부산광역시": {
    "중구": "26110",
    "서구": "26140",
    "동구": "26170",
    "영도구": "26200",
    "부산진구": "26230",
    "동래구": "26260",
    "남구": "26290",
    "북구": "26320",
    "해운대구": "26350",
    "사하구": "26380",
    "금정구": "26410",
    "강서구": "26440",
    "연제구": "26470",
    "수영구": "26500",
    "사상구": "26530",
    "기장군": "26710",
  },
  "대구광역시": {
    "중구": "27110",
    "동구": "27140",
    "서구": "27170",
    "남구": "27200",
    "북구": "27230",
    "수성구": "27260",
    "달서구": "27290",
    "달성군": "27710",
    "군위군": "27720",
  },
  "인천광역시": {
    "중구": "28110",
    "동구": "28140",
    "미추홀구": "28177",
    "연수구": "28185",
    "남동구": "28200",
    "부평구": "28237",
    "계양구": "28245",
    "서구": "28260",
    "강화군": "28710",
    "옹진군": "28720",
  },
  "광주광역시": {
    "동구": "29110",
    "서구": "29140",
    "남구": "29155",
    "북구": "29170",
    "광산구": "29200",
  },
  "대전광역시": {
    "동구": "30110",
    "중구": "30140",
    "서구": "30170",
    "유성구": "30200",
    "대덕구": "30230",
  },
  "울산광역시": {
    "중구": "31110",
    "남구": "31140",
    "동구": "31170",
    "북구": "31200",
    "울주군": "31710",
  },
  "세종특별자치시": {
    "세종특별자치시": "36110",
  },
  "경기도": {
    "수원시": "41110",
    "성남시": "41130",
    "의정부시": "41150",
    "안양시": "41170",
    "부천시": "41190",
    "광명시": "41210",
    "평택시": "41220",
    "동두천시": "41250",
    "안산시": "41270",
    "고양시": "41280",
    "과천시": "41290",
    "구리시": "41310",
    "남양주시": "41360",
    "오산시": "41370",
    "시흥시": "41390",
    "군포시": "41410",
    "의왕시": "41430",
    "하남시": "41450",
    "용인시": "41460",
    "파주시": "41480",
    "이천시": "41500",
    "안성시": "41550",
    "김포시": "41570",
    "화성시": "41590",
    "광주시": "41610",
    "양주시": "41630",
    "포천시": "41650",
    "여주시": "41670",
    "연천군": "41800",
    "가평군": "41820",
    "양평군": "41830",
  },
  "강원도": {
    "춘천시": "42110",
    "원주시": "42130",
    "강릉시": "42150",
    "동해시": "42170",
    "태백시": "42190",
    "속초시": "42210",
    "삼척시": "42230",
    "홍천군": "42720",
    "횡성군": "42730",
    "영월군": "42750",
    "평창군": "42760",
    "정선군": "42770",
    "철원군": "42780",
    "화천군": "42790",
    "양구군": "42800",
    "인제군": "42810",
    "고성군": "42820",
    "양양군": "42830",
  },
  "충청북도": {
    "청주시": "43110",
    "충주시": "43130",
    "제천시": "43150",
    "보은군": "43720",
    "옥천군": "43730",
    "영동군": "43740",
    "증평군": "43745",
    "진천군": "43750",
    "괴산군": "43760",
    "음성군": "43770",
    "단양군": "43800",
  },
  "충청남도": {
    "천안시": "44130",
    "공주시": "44150",
    "보령시": "44180",
    "아산시": "44200",
    "서산시": "44210",
    "논산시": "44230",
    "계룡시": "44250",
    "당진시": "44270",
    "금산군": "44710",
    "부여군": "44760",
    "서천군": "44770",
    "청양군": "44790",
    "홍성군": "44800",
    "예산군": "44810",
    "태안군": "44825",
  },
  "전라북도": {
    "전주시": "45110",
    "군산시": "45130",
    "익산시": "45140",
    "정읍시": "45180",
    "남원시": "45190",
    "김제시": "45210",
    "완주군": "45710",
    "진안군": "45720",
    "무주군": "45730",
    "장수군": "45740",
    "임실군": "45750",
    "순창군": "45770",
    "고창군": "45790",
    "부안군": "45800",
  },
  "전라남도": {
    "목포시": "46110",
    "여수시": "46130",
    "순천시": "46150",
    "나주시": "46170",
    "광양시": "46230",
    "담양군": "46710",
    "곡성군": "46720",
    "구례군": "46730",
    "고흥군": "46770",
    "보성군": "46780",
    "화순군": "46790",
    "장흥군": "46800",
    "강진군": "46810",
    "해남군": "46820",
    "영암군": "46830",
    "무안군": "46840",
    "함평군": "46860",
    "영광군": "46870",
    "장성군": "46880",
    "완도군": "46890",
    "진도군": "46900",
    "신안군": "46910",
  },
  "경상북도": {
    "포항시": "47110",
    "경주시": "47130",
    "김천시": "47150",
    "안동시": "47170",
    "구미시": "47190",
    "영주시": "47210",
    "영천시": "47230",
    "상주시": "47250",
    "문경시": "47280",
    "경산시": "47290",
    "군위군": "47720",
    "의성군": "47730",
    "청송군": "47750",
    "영양군": "47760",
    "영덕군": "47770",
    "청도군": "47820",
    "고령군": "47830",
    "성주군": "47840",
    "칠곡군": "47850",
    "예천군": "47900",
    "봉화군": "47920",
    "울진군": "47930",
    "울릉군": "47940",
  },
  "경상남도": {
    "창원시": "48120",
    "진주시": "48170",
    "통영시": "48220",
    "사천시": "48240",
    "김해시": "48250",
    "밀양시": "48270",
    "거제시": "48310",
    "양산시": "48330",
    "의령군": "48720",
    "함안군": "48730",
    "창녕군": "48740",
    "고성군": "48820",
    "남해군": "48840",
    "하동군": "48850",
    "산청군": "48860",
    "함양군": "48870",
    "거창군": "48880",
    "합천군": "48890",
  },
  "제주특별자치도": {
    "제주시": "50110",
    "서귀포시": "50130",
  },
};

function firstString(row: RawRow, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function toRows(payload: unknown): RawRow[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawRow => typeof item === "object" && item !== null);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.list)) {
    return obj.list.filter((item): item is RawRow => typeof item === "object" && item !== null);
  }

  if (Array.isArray(obj.schoolinfo)) {
    return obj.schoolinfo.filter((item): item is RawRow => typeof item === "object" && item !== null);
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRow => typeof item === "object" && item !== null);
    }

    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if (Array.isArray(nested.list)) {
        return nested.list.filter((item): item is RawRow => typeof item === "object" && item !== null);
      }
      if (Array.isArray(nested.row)) {
        return nested.row.filter((item): item is RawRow => typeof item === "object" && item !== null);
      }
      if (Array.isArray(nested.schoolinfo)) {
        return nested.schoolinfo.filter((item): item is RawRow => typeof item === "object" && item !== null);
      }
    }
  }

  return [];
}

function findDistrictNameFromAddress(regionName: string, address: string): string | null {
  const mapping = SGG_CODE_BY_REGION_AND_NAME[regionName];
  if (!mapping) return null;

  const districtNames = Object.keys(mapping).sort((a, b) => b.length - a.length);
  for (const districtName of districtNames) {
    if (address.includes(districtName)) return districtName;
  }
  return null;
}

function looksLikeStudentCountKey(key: string) {
  const upper = key.toUpperCase();
  return (
    upper.includes("STD") ||
    upper.includes("STUD") ||
    upper.includes("STUDENT") ||
    upper.includes("CNT")
  );
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const digits = value.replace(/[^\d.-]/g, "");
    if (!digits) return null;
    const parsed = Number(digits);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractStudentCount(row: RawRow): number | null {
  const preferredKeys = [
    "STDNT_CNT",
    "STUD_CNT",
    "STUDENT_CNT",
    "SCHUL_STDNT_CNT",
    "ALL_STDNT_CNT",
    "TOT_STDNT_CNT",
    "TOT_STUD_CNT",
    "STD_CNT",
    "SCHUL_STD_CNT",
    "SMR_STD_CNT",
    "TOT_CNT",
  ];

  for (const key of preferredKeys) {
    if (key in row) {
      const n = numericValue(row[key]);
      if (n !== null) return n;
    }
  }

  for (const [key, value] of Object.entries(row)) {
    if (looksLikeStudentCountKey(key)) {
      const n = numericValue(value);
      if (n !== null) return n;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.SCHOOLINFO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "SCHOOLINFO_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const regionName = req.nextUrl.searchParams.get("regionName")?.trim() || "";
    const schoolType = req.nextUrl.searchParams.get("schoolType")?.trim() || "";
    const address = req.nextUrl.searchParams.get("address")?.trim() || "";
    const schoolName = req.nextUrl.searchParams.get("schoolName")?.trim() || "";
    const apiType =
      req.nextUrl.searchParams.get("apiType")?.trim() || DEFAULT_STUDENT_COUNT_API_TYPE;

    if (!regionName || !schoolType || !address) {
      return NextResponse.json(
        { error: "regionName, schoolType, address가 필요합니다." },
        { status: 400 }
      );
    }

    const sidoCode = REGION_NAME_TO_SIDO_CODE[regionName];
    const schulKndCode = SCHOOL_TYPE_TO_KIND_CODE[schoolType];
    const districtName = findDistrictNameFromAddress(regionName, address);
    const sggCode = districtName
      ? SGG_CODE_BY_REGION_AND_NAME[regionName]?.[districtName] || ""
      : "";

    if (!sidoCode || !schulKndCode || !sggCode) {
      return NextResponse.json(
        {
          error: "학생수 API 요청 코드 매핑에 실패했습니다.",
          debug: { regionName, schoolType, address, districtName, sidoCode, schulKndCode, sggCode },
        },
        { status: 400 }
      );
    }

    const url = new URL(SCHOOLINFO_BASE_URL);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("apiType", apiType);
    url.searchParams.set("sidoCode", sidoCode);
    url.searchParams.set("sggCode", sggCode);
    url.searchParams.set("schulKndCode", schulKndCode);

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `student-count 요청 실패: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const rows = toRows(data);

    if (!rows.length) {
      return NextResponse.json(
        {
          error: "학생수 API 응답에서 데이터를 찾지 못했습니다.",
          debug: { apiType, sidoCode, sggCode, schulKndCode },
        },
        { status: 404 }
      );
    }

    const target = schoolName.trim();
    const matchedRows = target
      ? rows.filter((row) => firstString(row, ["SCHUL_NM"]) === target)
      : rows;

    const rowsToUse = matchedRows.length ? matchedRows : rows;

    const total = rowsToUse.reduce((sum, row) => {
      const n = extractStudentCount(row);
      return sum + (n ?? 0);
    }, 0);

    const gradeBreakdown = rowsToUse.map((row, index) => ({
      index,
      grade:
        firstString(row, ["GRADE", "GRADE_NM", "SCHUL_CRSE_SC_VALUE", "GRD"], "") || "-",
      className:
        firstString(row, ["CLASS_NM", "CLASS", "CLSS_NM"], "") || "-",
      count: extractStudentCount(row) ?? null,
      raw: row,
    }));

    return NextResponse.json({
      studentCount: {
        total: total > 0 ? String(total) : "-",
        apiType,
        rowCount: rowsToUse.length,
        gradeBreakdown,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "학생수 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}