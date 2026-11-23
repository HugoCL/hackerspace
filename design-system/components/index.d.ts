import type * as React from 'react';

type Gap = 1 | 2 | 4 | 6 | 12 | string;
type Person = string | { name: string; src?: string; online?: boolean };
export type IconName = 'search' | 'pin' | 'calendar' | 'users' | 'heart' | 'plus' | 'bell' | 'bot' | 'trophy' | 'globe' | 'arrow' | 'menu' | 'code' | 'check' | 'x' | 'chevron' | 'info' | 'alert' | 'more';

/* Layout */
export interface AppShellProps { nav?: { label: string; href?: string; active?: boolean; count?: number }[]; actions?: React.ReactNode; banner?: React.ReactNode; aside?: React.ReactNode; footer?: React.ReactNode; homeHref?: string; className?: string; children?: React.ReactNode }
export declare function AppShell(props: AppShellProps): React.ReactElement;
export interface PageHeaderProps { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode; className?: string }
export declare function PageHeader(props: PageHeaderProps): React.ReactElement;
export interface SectionProps { title?: React.ReactNode; count?: number; action?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Section(props: SectionProps): React.ReactElement;
export interface StackProps extends React.HTMLAttributes<HTMLElement> { as?: keyof JSX.IntrinsicElements; direction?: 'column' | 'row'; gap?: Gap; align?: React.CSSProperties['alignItems']; justify?: React.CSSProperties['justifyContent']; wrap?: boolean }
export declare function Stack(props: StackProps): React.ReactElement;
export interface GridProps extends React.HTMLAttributes<HTMLElement> { as?: keyof JSX.IntrinsicElements; /** Minimum column width in px. Default 280. */ min?: number; gap?: Gap }
export declare function Grid(props: GridProps): React.ReactElement;

/* Actions & forms */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'signal' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconEnd?: IconName; href?: string }
export declare function Button(props: ButtonProps): React.ReactElement;
export interface TabsProps { items: { value: string; label: React.ReactNode; count?: number }[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; label?: string; className?: string }
export declare function Tabs(props: TabsProps): React.ReactElement;
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; icon?: IconName }
export declare function Input(props: InputProps): React.ReactElement;
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; options: (string | { value: string; label: string })[] }
export declare function Select(props: SelectProps): React.ReactElement;

/* Display */
export interface IconProps { name: IconName; size?: number; label?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;
export interface BadgeProps { tone?: 'neutral' | 'presencial' | 'virtual' | 'signal' | 'live' | 'danger'; icon?: IconName; className?: string; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;
export interface CardProps extends React.HTMLAttributes<HTMLElement> { as?: keyof JSX.IntrinsicElements; href?: string; interactive?: boolean; padding?: 'default' | 'none' }
export declare function Card(props: CardProps): React.ReactElement;
export interface AvatarProps { name: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; online?: boolean; className?: string }
export declare function Avatar(props: AvatarProps): React.ReactElement;
export interface AvatarStackProps { people: Person[]; max?: number; total?: number; size?: 'xs' | 'sm' | 'md'; className?: string }
export declare function AvatarStack(props: AvatarStackProps): React.ReactElement;
export interface EmptyStateProps { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

/* Live */
export interface PresencePillProps { count: number; label?: string; people?: Person[]; size?: 'sm' | 'md'; live?: boolean; className?: string }
export declare function PresencePill(props: PresencePillProps): React.ReactElement;
export interface CountdownProps { to: Date | number | string; label?: string; doneLabel?: string; className?: string }
export declare function Countdown(props: CountdownProps): React.ReactElement;
export interface AgentTagProps { name?: string; title?: string; className?: string }
export declare function AgentTag(props: AgentTagProps): React.ReactElement;
export interface ActivityItem { id?: string; time: string; actor: { name: string; src?: string; agent?: boolean }; action: React.ReactNode; target?: React.ReactNode; href?: string; isNew?: boolean }
export interface ActivityFeedProps { items: ActivityItem[]; className?: string }
export declare function ActivityFeed(props: ActivityFeedProps): React.ReactElement;
export interface TeamSlotsProps { members: Person[]; size?: number; className?: string }
export declare function TeamSlots(props: TeamSlotsProps): React.ReactElement;

/* Domain cards */
export interface HackathonCardProps { title: string; mode: 'presencial' | 'virtual'; dates: string; location: string; description?: string; tags?: string[]; viewers?: number; teamsLooking?: number; /** Agent that created the profile, e.g. "scout". */ source?: string; href?: string }
export declare function HackathonCard(props: HackathonCardProps): React.ReactElement;
export interface TeamCardProps { name: string; hackathon?: string; pitch?: string; lookingFor?: string[]; members: Person[]; size?: number; activeNow?: boolean; action?: React.ReactNode; href?: string }
export declare function TeamCard(props: TeamCardProps): React.ReactElement;
export interface ProjectCardProps { title: string; description?: string; image?: string; tags?: string[]; team?: Person[]; hackathon?: string; likes?: number; award?: string; href?: string }
export declare function ProjectCard(props: ProjectCardProps): React.ReactElement;

/* More forms */
type Option = string | { value: string; label: React.ReactNode; hint?: React.ReactNode; disabled?: boolean };
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: React.ReactNode; hint?: React.ReactNode }
export declare function Checkbox(props: CheckboxProps): React.ReactElement;
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: React.ReactNode; hint?: React.ReactNode }
export declare function Switch(props: SwitchProps): React.ReactElement;
export interface RadioGroupProps { label?: React.ReactNode; options: Option[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; name?: string; className?: string }
export declare function RadioGroup(props: RadioGroupProps): React.ReactElement;
export interface SegmentedControlProps { /** Accessible name of the group; not shown. */ label: string; options: (string | { value: string; label: React.ReactNode; icon?: IconName; count?: number })[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; name?: string; className?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode }
export declare function Textarea(props: TextareaProps): React.ReactElement;

/* More display */
export interface SeparatorProps { label?: React.ReactNode; className?: string }
export declare function Separator(props: SeparatorProps): React.ReactElement;
export interface SkeletonProps { variant?: 'text' | 'circle' | 'block'; width?: number | string; height?: number | string; className?: string; style?: React.CSSProperties }
export declare function Skeleton(props: SkeletonProps): React.ReactElement;
export interface ProgressProps { value: number; max?: number; label?: React.ReactNode; /** Replaces the percentage; false hides it. */ valueLabel?: React.ReactNode | false; tone?: 'default' | 'live'; className?: string }
export declare function Progress(props: ProgressProps): React.ReactElement;
export interface TableColumn<Row = any> { key: string; label: React.ReactNode; align?: 'left' | 'right' | 'center'; width?: number | string; numeric?: boolean; render?: (row: Row) => React.ReactNode }
export interface TableProps<Row = any> { columns: TableColumn<Row>[]; rows: Row[]; rowKey?: string; caption?: React.ReactNode; empty?: React.ReactNode; className?: string }
export declare function Table(props: TableProps): React.ReactElement;
export interface AccordionProps { items: { id?: string; title: React.ReactNode; content: React.ReactNode; defaultOpen?: boolean }[]; /** Allow several open at once. */ multiple?: boolean; className?: string }
export declare function Accordion(props: AccordionProps): React.ReactElement;

/* Feedback */
export interface AlertProps { tone?: 'info' | 'live' | 'success' | 'danger'; title?: React.ReactNode; icon?: IconName; action?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Alert(props: AlertProps): React.ReactElement;
export interface TooltipProps { label: React.ReactNode; side?: 'top' | 'bottom'; className?: string; /** One focusable element. */ children: React.ReactElement }
export declare function Tooltip(props: TooltipProps): React.ReactElement;
export interface ToastOptions { id?: number; title: React.ReactNode; description?: React.ReactNode; tone?: 'live' | 'danger'; actor?: { name: string; src?: string; agent?: boolean }; action?: { label: string; onClick?: () => void }; /** ms; 0 keeps it until dismissed. Default 5000. */ duration?: number }
export interface ToasterProps { /** Render these instead of the global queue. */ items?: ToastOptions[]; onDismiss?: (id: number) => void; inline?: boolean; className?: string }
export declare function Toaster(props: ToasterProps): React.ReactElement;
export declare function toast(options: string | ToastOptions): number;
export declare function dismissToast(id: number): void;

/* Navigation */
export interface BreadcrumbProps { items: { label: React.ReactNode; href?: string }[]; className?: string }
export declare function Breadcrumb(props: BreadcrumbProps): React.ReactElement;
export interface PaginationProps { pageCount: number; page?: number; defaultPage?: number; onChange?: (page: number) => void; className?: string }
export declare function Pagination(props: PaginationProps): React.ReactElement;

/* Overlays */
export interface DialogProps { open: boolean; onClose: () => void; title: React.ReactNode; description?: React.ReactNode; footer?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Dialog(props: DialogProps): React.ReactElement;
export declare function Drawer(props: DialogProps): React.ReactElement;
export type MenuItem = 'separator' | { label: React.ReactNode; icon?: IconName; onSelect?: () => void; href?: string; danger?: boolean; disabled?: boolean };
export interface MenuProps { label?: React.ReactNode; items: MenuItem[]; align?: 'start' | 'end'; /** Props for the trigger Button. */ trigger?: ButtonProps; 'aria-label'?: string; className?: string }
export declare function Menu(props: MenuProps): React.ReactElement;
export interface PopoverProps { label: React.ReactNode; title?: string; align?: 'start' | 'end'; trigger?: ButtonProps; className?: string; children?: React.ReactNode | ((close: () => void) => React.ReactNode) }
export declare function Popover(props: PopoverProps): React.ReactElement;

/* Footer */
export interface FooterProps { tagline?: React.ReactNode; columns?: { title: React.ReactNode; links: { label: React.ReactNode; href?: string }[] }[]; note?: React.ReactNode; /** Words that replace "hacker". */ words?: string[]; /** Return to "hackerspace" after this many words. Default 3. */ joinEvery?: number; /** false keeps the name still. */ animate?: boolean; className?: string }
export declare function Footer(props: FooterProps): React.ReactElement;

declare global { interface Window { Hackerspace: {
  AppShell: typeof AppShell; PageHeader: typeof PageHeader; Section: typeof Section; Stack: typeof Stack; Grid: typeof Grid;
  Button: typeof Button; Tabs: typeof Tabs; Input: typeof Input; Select: typeof Select; Icon: typeof Icon;
  Badge: typeof Badge; Card: typeof Card; Avatar: typeof Avatar; AvatarStack: typeof AvatarStack; EmptyState: typeof EmptyState;
  PresencePill: typeof PresencePill; Countdown: typeof Countdown; AgentTag: typeof AgentTag; ActivityFeed: typeof ActivityFeed; TeamSlots: typeof TeamSlots;
  HackathonCard: typeof HackathonCard; TeamCard: typeof TeamCard; ProjectCard: typeof ProjectCard;
  Checkbox: typeof Checkbox; RadioGroup: typeof RadioGroup; Switch: typeof Switch; Textarea: typeof Textarea; SegmentedControl: typeof SegmentedControl; Separator: typeof Separator; Skeleton: typeof Skeleton; Progress: typeof Progress; Table: typeof Table; Accordion: typeof Accordion; Alert: typeof Alert; Tooltip: typeof Tooltip; Toaster: typeof Toaster; Breadcrumb: typeof Breadcrumb; Pagination: typeof Pagination; Dialog: typeof Dialog; Drawer: typeof Drawer; Menu: typeof Menu; Popover: typeof Popover;
  toast: typeof toast; dismissToast: typeof dismissToast; Footer: typeof Footer;
} } }
