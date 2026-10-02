import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizationHistoryEntry } from '@/types/optimizer-workspace';

interface OptimizationHistoryProps {
  history: OptimizationHistoryEntry[];
  className?: string;
}

export function OptimizationHistory({ history, className }: OptimizationHistoryProps) {
  const getStatusVariant = (status: OptimizationHistoryEntry['status']) => {
    switch (status) {
      case 'optimal': return 'positive';
      case 'feasible': return 'secondary';
      case 'infeasible': return 'critical';
      default: return 'default';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Optimization History
        </CardTitle>
        <CardDescription>Recent optimization runs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No optimization history available.</p>
          ) : (
            <div className="flex flex-col border rounded-md divide-y">
              {history.map((entry, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm font-medium">{entry.objective}</p>
                    <p className="text-sm text-slate-600">{entry.result}</p>
                  </div>
                  <div>
                    <Badge variant={getStatusVariant(entry.status) as any} className="capitalize">
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
