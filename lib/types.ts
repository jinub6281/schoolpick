export type School = {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  SCHUL_KND_SC_NM: string;
  ORG_RDNMA: string;
  [key: string]: string | undefined;
};

export type MealItem = {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  MMEAL_SC_NM: string;
  MLSV_YMD: string;
  DDISH_NM: string;
  ORPLC_INFO?: string;
  CAL_INFO?: string;
  NTR_INFO?: string;
};

export type ClassInfoItem = {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  AY?: string;
  GRADE: string;
  CLASS_NM: string;
};

export type TimetableItem = {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  ALL_TI_YMD: string;
  GRADE: string;
  CLASS_NM: string;
  PERIO: string;
  ITRT_CNTNT: string;
};

export type SchoolInfoSummary = {
  schoolName: string;
  officeName: string;
  foundedDivision: string;
  foundedType: string;
  foundedDate: string;
  principal: string;
  tel: string;
  fax: string;
  studentCount: string;
  homepage: string;
  address: string;
  raw?: Record<string, unknown>;
  rawKeys?: string[];
};

export type StudentCountGradeRow = {
  index: number;
  grade: string;
  className: string;
  count: number | null;
  raw: Record<string, unknown>;
};

export type StudentCountSummary = {
  total: string;
  apiType: string;
  rowCount: number;
  gradeBreakdown: StudentCountGradeRow[];
};

export type ApiError = {
  error: string;
};