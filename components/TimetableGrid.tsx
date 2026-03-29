import type { TimetableItem } from "@/lib/types";

type Props = {
  items: TimetableItem[];
};

export default function TimetableGrid({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-gray-500 shadow-sm">
        해당 날짜 시간표 정보가 없어요.
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => {
    return Number(a.PERIO) - Number(b.PERIO);
  });

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="grid grid-cols-[90px_1fr] border-b bg-gray-50">
        <div className="border-r p-4 text-sm font-bold text-gray-700">교시</div>
        <div className="p-4 text-sm font-bold text-gray-700">과목</div>
      </div>

      {sorted.map((item, index) => (
        <div
          key={`${item.PERIO}-${index}`}
          className="grid grid-cols-[90px_1fr] border-b last:border-b-0"
        >
          <div className="border-r p-4 font-semibold text-blue-600">
            {item.PERIO}교시
          </div>
          <div className="p-4 text-gray-800">{item.ITRT_CNTNT || "-"}</div>
        </div>
      ))}
    </div>
  );
}