import { type ReactNode } from "react";

interface INotice {
  children: ReactNode;
  role?: "note" | "status" | "alert";
}

export function Notice({ children, role = "note" }: INotice) {
  return (
    <aside className="notice" role={role}>
      {children}
    </aside>
  );
}
