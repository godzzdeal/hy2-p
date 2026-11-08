import { t } from "i18next";
import { Component, type ErrorInfo, type ReactNode } from "react";
interface IErrorState {
  hasError: boolean;
}
export class ErrorBoundary extends Component<
  {
    children: ReactNode;
  },
  IErrorState
> {
  state: IErrorState = { hasError: false };
  static getDerivedStateFromError(): IErrorState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.hasError ? (
      <div className="empty" role="alert">
        <h1>{t("Не удалось открыть панель")}</h1>
        <p>{t("Обновите страницу, чтобы повторить загрузку.")}</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
