import { NextRequest, NextResponse } from "next/server";
import { fetchNeis, extractRows } from "@/lib/neis";

export async function GET(req: NextRequest) {
  try {
    const officeCode = req.nextUrl.searchParams.get("officeCode")?.trim();
    const schoolCode = req.nextUrl.searchParams.get("schoolCode")?.trim();
    const date = req.nextUrl.searchParams.get("date")?.trim();

    if (!officeCode || !schoolCode || !date) {
      return NextResponse.json(
        { error: "officeCode, schoolCode, date가 필요합니다." },
        { status: 400 }
      );
    }

    const data = await fetchNeis("mealServiceDietInfo", {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      MLSV_YMD: date,
    });

    const rows = extractRows(data, "mealServiceDietInfo");

    return NextResponse.json({ meals: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "급식 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}