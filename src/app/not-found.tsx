import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-4 px-5 text-center">
      <h1 className="text-xl font-bold">찾을 수 없습니다</h1>
      <p className="text-sm text-sub">주소가 바뀌었거나, 볼 수 있는 범위 밖의 인터뷰입니다. 공유 링크라면 담당자가 링크를 껐을 수 있습니다.</p>
      <Link href="/interviews" className="btn mx-auto">인터뷰 목록으로</Link>
    </main>
  );
}
