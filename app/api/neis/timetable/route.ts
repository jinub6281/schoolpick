import { NextRequest, NextResponse } from "next/server";
import {
  extractRows,
  fetchNeis,
  getTimetableEndpoint,
} from "@/lib/neis";

export async function GET(req: NextRequest) {
  try {
    const officeCode = req.nextUrl.searchParams.get("officeCode")?.trim();
    const schoolCode = req.nextUrl.searchParams.get("schoolCode")?.trim();
    const schoolKind = req.nextUrl.searchParams.get("schoolKind")?.trim();
    const grade = req.nextUrl.searchParams.get("grade")?.trim();
    const classNm = req.nextUrl.searchParams.get("classNm")?.trim();
    const date = req.nextUrl.searchParams.get("date")?.trim();

    if (!officeCode || !schoolCode || !schoolKind || !grade || !classNm || !date) {
      return NextResponse.json(
        {
          error:
            "officeCode, schoolCode, schoolKind, grade, classNm, date가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const endpoint = getTimetableEndpoint(schoolKind);

    const data = await fetchNeis(endpoint, {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      GRADE: grade,
      CLASS_NM: classNm,
      ALL_TI_YMD: date,
    });

    const rows = extractRows(data, endpoint);

    return NextResponse.json({ timetable: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "시간표 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}