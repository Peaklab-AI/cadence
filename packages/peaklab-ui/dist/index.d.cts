import React, { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "href"> {
    children: React.ReactNode;
    /** primary = ink fill · accent = mint fill (dark sections) · secondary = subtle fill · outline = teal-bordered pill (WhatsApp-style low-pressure CTA) · ghost = bordered · inverse = paper fill (on dark) · quiet = text only */
    variant?: "primary" | "accent" | "secondary" | "outline" | "ghost" | "inverse" | "quiet";
    size?: "sm" | "md" | "lg";
    /** Trailing circular badge. Reserved for the page's one main CTA. */
    arrow?: boolean;
    /** Icon shown in the badge instead of the default arrow, e.g. a calendar icon for a "book a call" CTA. */
    icon?: React.ComponentType<{
        className?: string;
    }>;
    fullWidth?: boolean;
    href?: string;
    target?: string;
    rel?: string;
}
declare const Button: React.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "href"> {
    icon: React.ReactNode;
    /** Accessible label — required since the button has no visible text. */
    "aria-label": string;
    /** outline = bordered circle on the page background (default) · ghost = subtle fill · primary = ink fill */
    variant?: "outline" | "ghost" | "primary";
    size?: "sm" | "md" | "lg";
    href?: string;
    target?: string;
    rel?: string;
}
declare const IconButton: React.ForwardRefExoticComponent<Omit<IconButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

interface ContainerProps extends Omit<React.HTMLAttributes<HTMLElement>, "as"> {
    as?: "div" | "section" | "header" | "footer" | "main" | "nav";
    /** Max-width preset: `max` matches primary page content (e.g. Footer),
     * `narrow` suits copy-heavy or compact sections, `full` keeps no max-width. */
    size?: "max" | "narrow" | "full";
    /** Adds responsive inline padding, for containers placed directly against
     * the viewport edge (e.g. a page section) rather than inside an already
     * padded parent. */
    gutter?: boolean;
    children?: React.ReactNode;
}
declare const Container: React.ForwardRefExoticComponent<ContainerProps & React.RefAttributes<HTMLElement>>;

type AnimatedBackgroundTone = "sky";
interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Number of light beams drifting, spinning, and bouncing through the layer. */
    shapeCount?: number;
    /** Shows the faint grid pattern behind the beams. */
    grid?: boolean;
    /** Flat wash color layered behind the grid. Omit for no color layer. */
    background?: AnimatedBackgroundTone;
    /** Artwork layered on top of the grid/beams, bottom-aligned and full-width. */
    image?: string;
}
/**
 * A subtle animated backdrop of drifting, spinning, bouncing light beams
 * for hero/section headers. Fills its nearest positioned ancestor — drop it
 * inside a `position: relative` container, behind your foreground content.
 * Layers stack as color -> grid -> beams -> image; color/grid/beams sit at
 * the default stacking level, so any content rendered after this component
 * sits on top of them, but the image is raised to z-index: 2, so foreground
 * content needs z-index: 2+ (not just later DOM order) to appear above it -
 * this lets you park content, e.g. a decorative glow, between the ambient
 * layers and the photo.
 */
declare const AnimatedBackground: React.ForwardRefExoticComponent<AnimatedBackgroundProps & React.RefAttributes<HTMLDivElement>>;

type GradientBackgroundTone = "butter" | "mint" | "sky" | "clay" | "brand";
interface GradientBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Which brand accent(s) the soft glow is mixed from. `brand` blends all three. */
    tone?: GradientBackgroundTone;
    /** Set to slowly drift the gradient shapes for an ambient, alive feel. */
    animated?: boolean;
    /** Start as a flat tone color and fade the gradient shapes in on `animated`, out otherwise. */
    revealOnHover?: boolean;
}
/**
 * A soft, colorful mesh-gradient backdrop built from the brand accent tokens.
 * Renders as a plain block — apply your own radius, border, and padding via
 * `className`/`style`, and lay content directly inside it.
 */
declare const GradientBackground: React.ForwardRefExoticComponent<GradientBackgroundProps & React.RefAttributes<HTMLDivElement>>;

interface SelectOption {
    label: string;
    value: string;
    icon?: string;
}
interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
}
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLDivElement>>;

type LogoVariant = "lockup-light" | "lockup-dark" | "lockup-mono" | "mark" | "mark-mono" | "mark-paper";
interface LogoProps {
    /** lockup-* renders the mark + wordmark; mark-* renders the icon alone.
     *  -light/-dark set text color for use on light/dark backgrounds;
     *  -mono/-paper render the mark as a single flat color instead of the brand gradient. */
    variant?: LogoVariant;
    /** Pixel height of the mark; the wordmark scales proportionally. */
    height?: number;
}
declare const Logo: React.ForwardRefExoticComponent<LogoProps & React.RefAttributes<HTMLDivElement>>;

/** Padding in spacing-scale steps (e.g. `2` → `var(--plu-space-2)`, 8px).
 * Pass a number to pad all sides, an `{x, y}` object for horizontal/vertical
 * padding, or a `{t, r, b, l}` object to set each side independently. */
type Padding = number | {
    x?: number;
    y?: number;
} | {
    t?: number;
    r?: number;
    b?: number;
    l?: number;
};

type TextPadding = Padding;
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    as?: "p" | "span" | "div";
    variant?: "body" | "lead" | "small" | "muted" | "none";
    /** Sets the `text-wrap` mode. `"pretty"` avoids ragged lines and orphans. */
    wrap?: "pretty";
    padding?: TextPadding;
}
declare const Text: React.ForwardRefExoticComponent<TextProps & React.RefAttributes<HTMLElement>>;

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    variant?: "hero" | "subhero" | "section" | "subsection" | "card" | "subtitle" | "item" | "micro" | "none";
    /** Sets the `text-wrap` mode. `"pretty"` avoids ragged lines and orphans. */
    wrap?: "pretty";
    padding?: Padding;
}
declare const Title: React.ForwardRefExoticComponent<TitleProps & React.RefAttributes<HTMLHeadingElement>>;

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: "default" | "gradient" | "nav" | "footer";
}
declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;

interface FormContextType {
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
}
declare function useFormContext(): FormContextType;
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    errors?: Record<string, string>;
    onErrorsChange?: (errors: Record<string, string>) => void;
}
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
}
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    name: string;
}
declare const Form: React.ForwardRefExoticComponent<FormProps & React.RefAttributes<HTMLFormElement>> & {
    Field: React.ForwardRefExoticComponent<FormFieldProps & React.RefAttributes<HTMLDivElement>>;
    Label: React.ForwardRefExoticComponent<FormLabelProps & React.RefAttributes<HTMLLabelElement>>;
    Message: React.ForwardRefExoticComponent<FormMessageProps & React.RefAttributes<HTMLElement>>;
};

interface AccordionItem {
    id: string;
    title: string | React.ReactNode;
    content: React.ReactNode;
}
interface AccordionProps {
    items: AccordionItem[];
    allowMultiple?: boolean;
    defaultExpanded?: string[];
    className?: string;
}
declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;

interface AlertProps extends HTMLMotionProps<"div"> {
    title?: string;
    children: React.ReactNode;
    variant?: "info" | "success" | "warning" | "error";
    onClose?: () => void;
    isOpen?: boolean;
}
declare const Alert: React.ForwardRefExoticComponent<Omit<AlertProps, "ref"> & React.RefAttributes<HTMLDivElement>>;

interface AvatarProps extends HTMLMotionProps<"div"> {
    src?: string;
    alt?: string;
    fallback: string;
    size?: "sm" | "md" | "lg" | "xl";
    status?: "online" | "offline" | "busy" | "away";
}
declare const Avatar: React.ForwardRefExoticComponent<Omit<AvatarProps, "ref"> & React.RefAttributes<HTMLDivElement>>;

interface BadgeProps extends HTMLMotionProps<"span"> {
    variant?: "solid" | "outline" | "subtle";
    colorScheme?: "primary" | "secondary" | "success" | "warning" | "error" | "gray";
    size?: "sm" | "md" | "lg";
    /** Leading accent dot — eyebrow-style usage above a section headline. */
    dot?: boolean;
    /** When set, takes precedence over variant/colorScheme and renders the guideline's eyebrow-chip palette instead of the status-chip palette. */
    tone?: "neutral" | "accent" | "accent2" | "inverse";
    children: React.ReactNode;
}
declare const Badge: React.ForwardRefExoticComponent<Omit<BadgeProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}
interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    separator?: React.ReactNode;
    homeIcon?: boolean;
}
declare const Breadcrumbs: React.ForwardRefExoticComponent<BreadcrumbsProps & React.RefAttributes<HTMLElement>>;

interface CardProps extends HTMLMotionProps<"div"> {
    /** default = hairline card · sunken = flush fill · accent = mint wash · inverse = dark section */
    tone?: "default" | "sunken" | "accent" | "inverse";
    padding?: number | string;
    radius?: string;
    /** Adds pointer cursor; pair with a hover style at the call site. */
    interactive?: boolean;
}
declare const Card: React.ForwardRefExoticComponent<Omit<CardProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    description?: React.ReactNode;
}
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}
declare const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDivElement>>;

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    position?: "left" | "right" | "top" | "bottom";
    size?: "sm" | "md" | "lg" | "xl" | "full";
}
declare const Drawer: React.ForwardRefExoticComponent<DrawerProps & React.RefAttributes<HTMLDivElement>>;

interface DropdownMenuItem {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
}
interface DropdownMenuProps {
    trigger: React.ReactNode;
    items: DropdownMenuItem[];
    align?: "left" | "right" | "center";
    className?: string;
}
declare const DropdownMenu: React.ForwardRefExoticComponent<DropdownMenuProps & React.RefAttributes<HTMLDivElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

interface ProgressProps extends Omit<HTMLMotionProps<"div">, "value"> {
    value?: number;
    max?: number;
    colorScheme?: "primary" | "secondary" | "success" | "warning" | "error";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}
declare const Progress: React.ForwardRefExoticComponent<Omit<ProgressProps, "ref"> & React.RefAttributes<HTMLDivElement>>;

interface RadioOption {
    value: string;
    label: string;
    description?: string;
}
interface RadioGroupProps {
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    name?: string;
    className?: string;
    orientation?: "horizontal" | "vertical";
}
declare const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;

type SkeletonProps = HTMLMotionProps<"div">;
declare const Skeleton: React.ForwardRefExoticComponent<Omit<SkeletonProps, "ref"> & React.RefAttributes<HTMLDivElement>>;

interface SliderProps {
    min?: number;
    max?: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    className?: string;
    label?: string;
}
declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLDivElement>>;

interface SidebarNavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}
interface SidebarProps {
    items: SidebarNavItem[];
    header?: React.ReactNode;
    footer?: React.ReactNode;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    className?: string;
}
declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;

interface TabItem {
    id: string;
    label: string | React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
}
interface TabsProps {
    items: TabItem[];
    defaultTab?: string;
    className?: string;
    onChange?: (id: string) => void;
}
declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;

type ToastType = "success" | "error" | "info" | "warning";
interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}
interface ToastContextType {
    toast: (message: Omit<ToastMessage, "id">) => void;
    removeToast: (id: string) => void;
}
declare const useToast: () => ToastContextType;
declare const ToastProvider: React.FC<{
    children: ReactNode;
}>;

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}
declare const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLButtonElement>>;

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}
declare const Tooltip: React.FC<TooltipProps>;

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    /** accent = mint · accent2 = butter · sky/clay = supporting tints · neutral = paper-2 · ink = solid ink fill (on light) · inverse = translucent (on dark sections) */
    tone?: "accent" | "accent2" | "sky" | "clay" | "neutral" | "ink" | "inverse";
    /** Renders uppercase, letterspaced IBM Plex Mono — for tech-stack chips and market codes (e.g. "NZ · AU · SG"). */
    mono?: boolean;
    /** md (default) = body-sm size, reads as regular copy. sm = caption size, for compact chip rows (e.g. article categories, tech-stack chips). */
    size?: "sm" | "md";
}
declare const Tag: React.ForwardRefExoticComponent<TagProps & React.RefAttributes<HTMLSpanElement>>;

interface ProofPointProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    body: string;
    tone?: "light" | "dark";
}
declare const ProofPoint: React.ForwardRefExoticComponent<ProofPointProps & React.RefAttributes<HTMLDivElement>>;

interface MediaFrameProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
    ratio?: string;
    gradient?: boolean;
    radius?: string;
    src?: string;
    alt?: string;
    video?: string;
    loop?: boolean;
}
declare const MediaFrame: React.ForwardRefExoticComponent<MediaFrameProps & React.RefAttributes<HTMLDivElement>>;

interface ArrowLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    children: React.ReactNode;
    tone?: "light" | "dark";
}
declare const ArrowLink: React.ForwardRefExoticComponent<ArrowLinkProps & React.RefAttributes<HTMLAnchorElement>>;

interface FieldProps extends React.HTMLAttributes<HTMLLabelElement> {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}
declare const Field: React.ForwardRefExoticComponent<FieldProps & React.RefAttributes<HTMLLabelElement>>;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    align?: "center" | "left";
    tone?: "light" | "dark";
}
declare const SectionHeader: React.ForwardRefExoticComponent<SectionHeaderProps & React.RefAttributes<HTMLDivElement>>;

interface ServiceCardMediaSource {
    /** WebP (or other static image) shown by default. */
    image?: string;
    /** MP4 swapped in and played while the card is hovered. */
    video?: string;
    /** Alt text for the image; leave unset for decorative art. */
    alt?: string;
    /** Placeholder label shown when no image src is supplied yet. */
    imageLabel?: string;
    /** Placeholder label shown when no video src is supplied yet. */
    videoLabel?: string;
    ratio?: string;
}

interface ServiceCardProps {
    title: string;
    body: string;
    icon?: React.ReactNode;
    /** Custom art node (e.g. a line-art SVG). Ignored when `media` is set. */
    art?: React.ReactNode;
    /** Image shown by default, swapped for a looping video on hover. */
    media?: ServiceCardMediaSource;
    linkLabel?: string;
    href?: string;
    accent?: boolean;
    /** link = arrow text link (default) · button = full-width outline button */
    ctaVariant?: "link" | "button";
    /** Set to false to omit the CTA row entirely. */
    cta?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const ServiceCard: React.ForwardRefExoticComponent<ServiceCardProps & React.RefAttributes<HTMLDivElement>>;

interface StepCardProps {
    index: number;
    title: string;
    body: string;
    art?: React.ReactNode;
    tags?: string[];
    tone?: "light" | "dark";
    className?: string;
    style?: React.CSSProperties;
}
declare const StepCard: React.ForwardRefExoticComponent<StepCardProps & React.RefAttributes<HTMLDivElement>>;

interface NavBarProps {
    /** Brand mark rendered in the top-left corner, e.g. a `<Logo />`. */
    logo?: React.ReactNode;
    items: string[];
    active?: string;
    tone?: "light" | "dark";
    /** Horizontal alignment of the nav items within the space between the logo
     * and the actions. Defaults to "start" (flush against the logo). */
    itemsAlign?: "start" | "center";
    ctaLabel: string;
    secondaryLabel?: string | null;
    /** Target passed to `onNavigate` when the CTA button is clicked. Defaults
     * to "contact" for backward compatibility with existing consumers that
     * key off that literal regardless of `ctaLabel`'s text. */
    ctaTarget?: string;
    /** Target passed to `onNavigate` when the secondary button is clicked.
     * The secondary button is a no-op without this — there's no sensible
     * default target to infer from `secondaryLabel` alone. */
    secondaryTarget?: string;
    onNavigate?: (target: string) => void;
    /** Pins the bar to the viewport and collapses it into a floating pill once
     * the page scrolls past a threshold, instead of scrolling away with the
     * page. Consuming pages need to reserve top space (e.g. padding-top on
     * their layout) since the bar leaves normal document flow. */
    floating?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const NavBar: React.ForwardRefExoticComponent<NavBarProps & React.RefAttributes<HTMLElement>>;

interface FooterColumn {
    title: string;
    links: string[];
}
interface FooterProps {
    /** Brand mark rendered above the description, e.g. a `<Logo />`. */
    logo?: React.ReactNode;
    description: string;
    columns: FooterColumn[];
    className?: string;
    style?: React.CSSProperties;
}
declare const Footer: React.ForwardRefExoticComponent<FooterProps & React.RefAttributes<HTMLElement>>;

export { Accordion, type AccordionProps, Alert, type AlertProps, AnimatedBackground, type AnimatedBackgroundProps, ArrowLink, type ArrowLinkProps, Avatar, type AvatarProps, Badge, type BadgeProps, Breadcrumbs, type BreadcrumbsProps, Button, type ButtonProps, Card, CardContent, CardDescription, CardFooter, CardHeader, type CardProps, CardTitle, Checkbox, type CheckboxProps, Container, type ContainerProps, Dialog, type DialogProps, Drawer, type DrawerProps, DropdownMenu, type DropdownMenuProps, Field, type FieldProps, Footer, type FooterColumn, type FooterProps, Form, type FormFieldProps, type FormLabelProps, type FormMessageProps, type FormProps, GradientBackground, type GradientBackgroundProps, type GradientBackgroundTone, IconButton, type IconButtonProps, Input, type InputProps, Link, type LinkProps, Logo, type LogoProps, MediaFrame, type MediaFrameProps, NavBar, type NavBarProps, Progress, type ProgressProps, ProofPoint, type ProofPointProps, RadioGroup, type RadioGroupProps, SectionHeader, type SectionHeaderProps, Select, type SelectOption, ServiceCard, type ServiceCardProps, Sidebar, type SidebarNavItem, type SidebarProps, Skeleton, type SkeletonProps, Slider, type SliderProps, StepCard, type StepCardProps, type TabItem, Tabs, type TabsProps, Tag, type TagProps, Text, type TextProps, Textarea, type TextareaProps, Title, type TitleProps, type ToastMessage, ToastProvider, type ToastType, Toggle, type ToggleProps, Tooltip, type TooltipProps, useFormContext, useToast };
