import { normalizeDishText } from "@/lib/neis";
import type { MealItem } from "@/lib/types";

type Props = {
  meals: MealItem[];
};

export default function MealCard({ meals }: Props) {
  if (!meals.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-gray-500 shadow-sm">
        해당 날짜 급식 정보가 없어요.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {meals.map((meal, index) => (
        <div key={index} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold">{meal.MMEAL_SC_NM}</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              {meal.MLSV_YMD}
            </span>
          </div>

          <div className="whitespace-pre-line rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-800">
            {normalizeDishText(meal.DDISH_NM)}
          </div>

          {meal.CAL_INFO && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold">칼로리:</span> {meal.CAL_INFO}
            </p>
          )}

          {meal.ORPLC_INFO && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                원산지 정보 보기
              </summary>
              <div className="mt-2 whitespace-pre-line rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                {meal.ORPLC_INFO.replace(/<br\s*\/?>/gi, "\n")}
              </div>
            </details>
          )}

          {meal.NTR_INFO && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                영양 정보 보기
              </summary>
              <div className="mt-2 whitespace-pre-line rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                {meal.NTR_INFO.replace(/<br\s*\/?>/gi, "\n")}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}