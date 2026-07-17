import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FieldProps extends Omit<ComponentProps<typeof Input>, "onChange" | "value"> {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  trailingAdornment?: ReactNode;
  value: string | number;
}

export function Field({
  helpText,
  label,
  onChange,
  trailingAdornment = null,
  type = "text",
  value,
  ...props
}: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-1.5">
        <span>{label}</span>
        {helpText ? <HelpTooltip text={helpText} /> : null}
      </Label>
      <div className="relative">
        <Input
          className={trailingAdornment ? "pr-8" : ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
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

interface TextAreaFieldProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function TextAreaField({ label, onChange, value }: TextAreaFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Textarea
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        value={value}
      />
    </div>
  );
}

export function HelpTooltip({ text }: { text: string }) {
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

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <Card className={`gap-0 py-0 ${className}`}>
      <CardContent className="grid gap-6 p-6">{children}</CardContent>
    </Card>
  );
}

interface SectionHeadProps {
  action?: ReactNode;
  subtitle?: string | null;
  title: string;
}

export function SectionHead({ title, subtitle = null, action = null }: SectionHeadProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-6 text-foreground">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

interface SubSectionProps {
  children: ReactNode;
  title: string;
}

export function SubSection({ title, children }: SubSectionProps) {
  return (
    <div className="grid gap-3 border-t pt-5 first:border-t-0 first:pt-0">
      <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
