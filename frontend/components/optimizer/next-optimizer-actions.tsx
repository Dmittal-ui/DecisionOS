import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Beaker, FileCheck, Dna } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NextOptimizerActionsProps {
  className?: string;
}

export function NextOptimizerActions({ className }: NextOptimizerActionsProps) {
  const actions = [
    {
      title: 'Test in Scenario Lab',
      description: 'Experiment with the recommended variables in a simulation sandbox',
      icon: Beaker,
      href: '/scenario',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      title: 'Create Governed Decision',
      description: 'Submit the recommended configuration for formal approval',
      icon: FileCheck,
      href: '/decisions',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      title: 'View Decision DNA',
      description: 'Track the full lineage from detection to optimized decision',
      icon: Dna,
      href: '/decision-dna',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} href={action.href} className="block group">
                <div className="border rounded-lg p-5 h-full transition-all hover:shadow-md hover:border-slate-300">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", action.bg, action.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
