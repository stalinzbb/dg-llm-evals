import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function DrawerShell({ children, helperText, onClose, title }) {
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
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
