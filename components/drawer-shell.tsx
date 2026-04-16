import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DrawerShellProps {
  ariaLabel?: string;
  children: ReactNode;
  helperText?: string | null;
  onClose: () => void;
  title: string;
}

export default function DrawerShell({
  ariaLabel,
  children,
  helperText,
  onClose,
  title,
}: DrawerShellProps) {
  return (
    <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent
        aria-label={ariaLabel}
        className="flex w-[500px] flex-col gap-0 p-0 sm:max-w-[500px]"
        side="right"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle>{title}</SheetTitle>
          {helperText ? <SheetDescription>{helperText}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
