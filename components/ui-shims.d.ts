declare module "@/components/ui/alert" {
  import type { FC, HTMLAttributes, ReactNode } from "react";

  export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
    variant?: string;
  }

  export const Alert: FC<AlertProps>;
  export const AlertTitle: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const AlertDescription: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const AlertAction: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
}

declare module "@/components/ui/badge" {
  import type { FC, HTMLAttributes, ReactNode } from "react";

  export interface BadgeProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode;
    className?: string;
    render?: ReactNode;
    variant?: string;
  }

  export const Badge: FC<BadgeProps>;
}

declare module "@/components/ui/button" {
  import type { ButtonHTMLAttributes, FC, ReactNode } from "react";

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    className?: string;
    render?: ReactNode;
    size?: string;
    variant?: string;
  }

  export const Button: FC<ButtonProps>;
}

declare module "@/components/ui/card" {
  import type { FC, HTMLAttributes, ReactNode } from "react";

  export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
    size?: string;
  }

  export const Card: FC<CardProps>;
  export const CardHeader: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const CardTitle: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const CardDescription: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const CardAction: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const CardContent: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const CardFooter: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
}

declare module "@/components/ui/checkbox" {
  import type { ButtonHTMLAttributes, FC } from "react";

  export interface CheckboxProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    className?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  export const Checkbox: FC<CheckboxProps>;
}

declare module "@/components/ui/input" {
  import type { FC, InputHTMLAttributes } from "react";

  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }

  export const Input: FC<InputProps>;
}

declare module "@/components/ui/label" {
  import type { FC, LabelHTMLAttributes } from "react";

  export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
  }

  export const Label: FC<LabelProps>;
}

declare module "@/components/ui/select" {
  import type { FC, HTMLAttributes, ReactNode } from "react";

  export const Select: FC<{
    children?: ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }>;
  export const SelectTrigger: FC<HTMLAttributes<HTMLButtonElement> & { className?: string }>;
  export const SelectValue: FC<{ children?: ReactNode; className?: string }>;
  export const SelectContent: FC<{ children?: ReactNode; className?: string }>;
  export const SelectItem: FC<{
    children?: ReactNode;
    className?: string;
    value: string;
  }>;
}

declare module "@/components/ui/separator" {
  import type { FC, HTMLAttributes } from "react";

  export const Separator: FC<HTMLAttributes<HTMLDivElement> & { className?: string; orientation?: string }>;
}

declare module "@/components/ui/sheet" {
  import type { FC, HTMLAttributes, ReactNode } from "react";

  export const Sheet: FC<{
    children?: ReactNode;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
  }>;
  export const SheetContent: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string; side?: string }>;
  export const SheetHeader: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SheetFooter: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SheetTitle: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SheetDescription: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
}

declare module "@/components/ui/skeleton" {
  import type { FC, HTMLAttributes } from "react";

  export const Skeleton: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
}

declare module "@/components/ui/sidebar" {
  import type { CSSProperties, FC, HTMLAttributes, ReactNode } from "react";

  export const SidebarProvider: FC<{
    children?: ReactNode;
    className?: string;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    style?: CSSProperties;
  }>;
  export const Sidebar: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string; collapsible?: string; dir?: string; side?: string; variant?: string }>;
  export const SidebarContent: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarFooter: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarGroup: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarGroupContent: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarGroupLabel: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string; render?: ReactNode }>;
  export const SidebarHeader: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarInset: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarMenu: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarMenuItem: FC<HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string }>;
  export const SidebarMenuButton: FC<HTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
    className?: string;
    isActive?: boolean;
    onClick?: (event?: unknown) => void;
    render?: ReactNode;
    size?: string;
    tooltip?: unknown;
    variant?: string;
  }>;
  export const SidebarRail: FC<HTMLAttributes<HTMLButtonElement> & { className?: string }>;
  export const SidebarSeparator: FC<HTMLAttributes<HTMLDivElement> & { className?: string }>;
  export const SidebarTrigger: FC<HTMLAttributes<HTMLButtonElement> & { className?: string; onClick?: (event?: unknown) => void }>;
}

declare module "@/components/ui/textarea" {
  import type { FC, TextareaHTMLAttributes } from "react";

  export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
  }

  export const Textarea: FC<TextareaProps>;
}

declare module "@/components/ui/tooltip" {
  import type { ButtonHTMLAttributes, FC, HTMLAttributes, ReactNode } from "react";

  export const TooltipProvider: FC<{ children?: ReactNode }>;
  export const Tooltip: FC<{ children?: ReactNode }>;
  export const TooltipTrigger: FC<ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode; className?: string }>;
  export const TooltipContent: FC<HTMLAttributes<HTMLDivElement> & {
    align?: string;
    alignItemWithTrigger?: boolean;
    children?: ReactNode;
    className?: string;
    side?: string;
    sideOffset?: number;
  }>;
}
