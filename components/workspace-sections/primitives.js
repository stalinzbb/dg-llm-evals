import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Field({
  helpText,
  label,
  onChange,
  trailingAdornment = null,
  type = "text",
  value,
  ...props
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-1.5">
        <span>{label}</span>
        {helpText ? <HelpTooltip text={helpText} /> : null}
      </Label>
      <div className="relative">
        <Input
          className={trailingAdornment ? "pr-8" : ""}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          value={value}
          {...props}
        />
        {trailingAdornment ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailingAdornment}</div>
        ) : null}
      </div>
    </div>
  );
}

export function TextAreaField({ label, onChange, value }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}

export function HelpTooltip({ text }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="Show field help"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] text-muted-foreground hover:bg-muted/80"
        type="button"
      >
        ?
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">{text}</TooltipContent>
    </Tooltip>
  );
}

export function SectionCard({ children, className = "" }) {
  return (
    <Card className={`gap-0 ${className}`}>
      <CardContent className="grid gap-5 p-5">{children}</CardContent>
    </Card>
  );
}

export function SectionHead({ title, subtitle = null, action = null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SubSection({ title, children }) {
  return (
    <div className="grid gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
