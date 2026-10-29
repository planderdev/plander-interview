"use client";

/** 웍스와 같은 localStorage 키(pw-theme)를 씁니다. */
export function ThemeToggle() {
  function flip() {
    const light = document.documentElement.classList.toggle("light");
    try {
      localStorage.setItem("pw-theme", light ? "light" : "dark");
    } catch {}
  }
  return (
    <button type="button" className="btn btn-sm" onClick={flip} aria-label="밝은 화면과 어두운 화면 바꾸기">
      화면 밝기
    </button>
  );
}
