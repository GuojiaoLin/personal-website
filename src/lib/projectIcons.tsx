import {
  Bot,
  Brain,
  Code2,
  Database,
  FileSearch,
  FolderKanban,
  GraduationCap,
  Network,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export const DEFAULT_PROJECT_ICON = 'folder';

export const projectIconOptions = [
  { value: 'folder', label: '项目', Icon: FolderKanban },
  { value: 'bot', label: 'Agent', Icon: Bot },
  { value: 'research', label: '论文', Icon: GraduationCap },
  { value: 'search', label: '检索', Icon: FileSearch },
  { value: 'brain', label: '模型', Icon: Brain },
  { value: 'network', label: '链路', Icon: Network },
  { value: 'code', label: '代码', Icon: Code2 },
  { value: 'data', label: '数据', Icon: Database },
  { value: 'guard', label: '治理', Icon: ShieldCheck },
  { value: 'spark', label: '灵感', Icon: Sparkles },
] as const;

export type ProjectIconValue = typeof projectIconOptions[number]['value'];

export const getProjectIconOption = (value?: string | null) => (
  projectIconOptions.find((option) => option.value === value) ?? projectIconOptions[0]
);

export const ProjectIconGlyph = ({
  value,
  className = 'h-6 w-6',
}: {
  value?: string | null;
  className?: string;
}) => {
  const Icon = getProjectIconOption(value).Icon as LucideIcon;

  return <Icon className={className} />;
};
