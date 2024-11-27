import { LucideIcon } from 'lucide-react';

export type IconProps = {
  icon: LucideIcon;
  title: string;
};

export type FeatureCardProps = IconProps & {
  description: string;
};

export type FormatSectionProps = IconProps & {
  formats: string[];
};

export type TermsSectionProps = IconProps & {
  content: string;
};
