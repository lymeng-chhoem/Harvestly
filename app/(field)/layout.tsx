import type { ReactNode } from "react";
import { FieldShell } from "./_components/shell/FieldShell";
import { ProductProvider } from "./_components/state/ProductProvider";

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <ProductProvider>
      <FieldShell>{children}</FieldShell>
    </ProductProvider>
  );
}
