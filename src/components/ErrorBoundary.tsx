import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary that prevents the entire React tree from
 * unmounting to a bare dark `<body>` on uncaught rendering errors.
 *
 * Without this, any throw during render (lazy-chunk 404, broken
 * Supabase client, missing data, etc.) leaves the user staring at
 * the `#0e1218` body background with no recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] uncaught render error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.replace("/");
    } catch {
      window.location.href = "/";
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(225 20% 7%)",
          color: "hsl(45 10% 92%)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.625rem",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "hsl(40 65% 55%)",
              marginBottom: "0.75rem",
              fontFamily: "monospace",
            }}
          >
            H-Pulse · System Error
          </p>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              letterSpacing: "0.12em",
            }}
          >
            页面加载异常
          </h1>
          <p style={{ fontSize: "0.875rem", color: "hsl(220 8% 52%)", lineHeight: 1.6 }}>
            系统遇到意外错误，请点击下方按钮重新加载。
            <br />
            An unexpected error occurred.
          </p>

          {this.state.error && (
            <pre
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "hsl(225 18% 10%)",
                border: "1px solid hsl(225 12% 18%)",
                borderRadius: "0.5rem",
                fontSize: "0.6875rem",
                color: "hsl(0 55% 60%)",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "8rem",
                overflow: "auto",
                fontFamily: "monospace",
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 2.5rem",
              background: "hsl(40 65% 55%)",
              color: "hsl(225 20% 7%)",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              letterSpacing: "0.15em",
              cursor: "pointer",
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
}
