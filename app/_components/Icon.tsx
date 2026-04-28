import type { CSSProperties } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  LogIn,
  Map,
  MapPin,
  Plus,
  Search,
  Train,
  TrainFront,
  User,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  map: Map,
  "map-pin": MapPin,
  train: Train,
  user: User,
  heart: Heart,
  plus: Plus,
  x: X,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "train-front": TrainFront,
  "user-circle": UserCircle,
  "log-in": LogIn,
  search: Search,
};

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: string;
  size?: number;
  sw?: number;
  color?: string;
  fill?: string;
  style?: CSSProperties;
};

export function Icon({
  name,
  size = 20,
  sw = 1.5,
  color = "currentColor",
  fill = "none",
  style = {},
}: IconProps) {
  const Component = ICONS[name];
  if (!Component) return null;
  return (
    <Component
      size={size}
      strokeWidth={sw}
      color={color}
      fill={fill}
      style={{ display: "block", flexShrink: 0, ...style }}
    />
  );
}
