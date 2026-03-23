import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientTelemetry } from "@/lib/telemetry";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled app render error", error, errorInfo);
    logClientTelemetry({
      type: "render-error",
      source: "AppErrorBoundary",
      message: error.message,
      metadata: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
          <div className="max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-card">
            <h1 className="text-2xl font-heading font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page failed to render. Refresh to try again.
            </p>
            <button
              type="button"
              onClick={this.reloadPage}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;