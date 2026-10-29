import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * 지금 페이지까지의 경로. 예: 인터뷰 목록 / 한라국수 오픈 마케팅 미팅 / 견적서
 * 마지막 칸은 지금 페이지라 링크가 없습니다. 디자인 시스템에 따라 화살표 대신 빗금으로 나눕니다.
 */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="현재 위치" className="no-print min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span className="text-mute" aria-hidden>/</span>}
              {c.href && !last ? (
                <Link href={c.href} className="text-link max-w-[16rem] truncate text-sub">
                  {c.label}
                </Link>
              ) : (
                <span className="max-w-[16rem] truncate font-medium" aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
