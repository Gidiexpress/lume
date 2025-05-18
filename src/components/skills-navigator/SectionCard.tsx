import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon: Icon, children, className }: SectionCardProps) {
  return (
    <Card className={cn("shadow-lg w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center">
          {Icon && <Icon className="mr-3 h-6 w-6 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
