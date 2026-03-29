import { NextRequest, NextResponse } from "next/server";
import {
  extractRows,
  fetchNeis,
  getClassInfoEndpoint,
} from "@/lib/neis";

export async function GET(req: NextRequest) {
  try {
    const officeCode = req.nextUrl.searchParams.get("officeCode")?.trim();
    const schoolCode = req.nextUrl.searchParams.get("schoolCode")?.trim();
    const schoolKind = req.nextUrl.searchParams.get("schoolKind")?.trim();
    const grade = req.nextUrl.searchParams.get("grade")?.trim() || "";
    const year =
      req.nextUrl.searchParams.get("year")?.trim() ||
      String(new Date().getFullYear());

    if (!officeCode || !schoolCode || !schoolKind) {
      return NextResponse.json(
        { error: "officeCode, schoolCode, schoolKind가 필요합니다." },
        { status: 400 }
      );
    }

    const endpoint = getClassInfoEndpoint(schoolKind);

    const data = await fetchNeis(endpoint, {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      AY: year,
      ...(grade ? { GRADE: grade } : {}),
    });

    const rows = extractRows(data, endpoint);

    return NextResponse.json({ classes: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "학급 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}