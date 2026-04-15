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
    <Card className={`gap-0 ${className}`}>
      <CardContent className="grid gap-5 p-5">{children}</CardContent>
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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

interface SubSectionProps {
  children: ReactNode;
  title: string;
}

export function SubSection({ title, children }: SubSectionProps) {
  return (
    <div className="grid gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
