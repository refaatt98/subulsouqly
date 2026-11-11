import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream px-6 text-center text-espresso"
      >
        <p className="text-lg">صار خلل بسيط بالعرض</p>
        <p className="text-sm text-espresso/60">جرّب تحديث الصفحة، وكل شي براجع طبيعي.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] rounded-full bg-espresso px-7 text-sm text-cream"
        >
          تحديث الصفحة
        </button>
      </main>
    );
  }
}
