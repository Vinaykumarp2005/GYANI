/**
 * ErrorBoundary.jsx
 * -----------------
 * React class-component error boundary.
 * Wraps the VisualizationViewport subtree and:
 *  - Catches any render-time JS error
 *  - Shows a styled fallback card with the LLM text response (if available)
 *  - Provides a "Try Again" reset button
 *  - Displays an unobtrusive toast notification about the render failure
 */

import React from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[GYANI ErrorBoundary] Render error caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallbackText, fallbackTitle } = this.props;
    const errorMessage =
      this.state.error?.message || "An unexpected rendering error occurred.";

    return (
      <div className="error-boundary-container" role="alert">
        {/* Toast notification at top */}
        <div className="error-boundary-toast">
          <AlertTriangle size={15} className="toast-icon" />
          <span>
            Visualization render failed.{" "}
            {fallbackText ? "Displaying text fallback below." : "Please try again."}
          </span>
        </div>

        {/* Main fallback card */}
        <div className="error-boundary-card">
          <div className="error-boundary-header">
            <AlertTriangle size={22} className="eb-header-icon" />
            <div>
              <h3 className="eb-title">
                {fallbackTitle || "Visualization Unavailable"}
              </h3>
              <p className="eb-subtitle">{errorMessage}</p>
            </div>
          </div>

          {/* Fallback text (LLM text answer shown instead of broken viz) */}
          {fallbackText && (
            <div className="eb-fallback-text-block">
              <p className="eb-fallback-label">📖 Text Response:</p>
              <div className="eb-fallback-text">{fallbackText}</div>
            </div>
          )}

          {/* Actions */}
          <div className="eb-actions">
            <button
              type="button"
              className="eb-reset-btn"
              onClick={this.handleReset}
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              className="eb-details-toggle"
              onClick={this.toggleDetails}
            >
              <span>Technical Details</span>
              {this.state.showDetails ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>

          {/* Collapsible error details */}
          {this.state.showDetails && (
            <details open className="eb-details-block">
              <summary className="eb-details-summary">Error Stack</summary>
              <pre className="eb-error-stack">
                {this.state.error?.stack || errorMessage}
                {this.state.errorInfo?.componentStack
                  ? "\n\nComponent Stack:" +
                    this.state.errorInfo.componentStack
                  : ""}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
