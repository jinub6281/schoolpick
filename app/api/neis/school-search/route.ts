import { NextRequest, NextResponse } from "next/server";
import { fetchNeis, extractRows } from "@/lib/neis";

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get("keyword")?.trim();

    if (!keyword) {
      return NextResponse.json(
        { error: "학교명을 입력해주세요." },
        { status: 400 }
      );
    }

    const data = await fetchNeis("schoolInfo", {
      SCHUL_NM: keyword,
    });

    const rows = extractRows(data, "schoolInfo");

    return NextResponse.json({ schools: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "학교 검색에 실패했습니다." },
      { status: 500 }
    );
  }
}