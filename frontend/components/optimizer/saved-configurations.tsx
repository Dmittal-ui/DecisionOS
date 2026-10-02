"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavedOptimizerConfig } from '@/types/optimizer-workspace';

interface SavedConfigurationsProps {
  configs: SavedOptimizerConfig[];
  onSave: (name: string) => void;
  className?: string;
}

export function SavedConfigurations({ configs, onSave, className }: SavedConfigurationsProps) {
  const [newConfigName, setNewConfigName] = useState('');

  const handleSave = () => {
    if (newConfigName.trim()) {
      onSave(newConfigName.trim());
      setNewConfigName('');
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Saved Configurations
        </CardTitle>
        <CardDescription>Saved scenarios and constraints</CardDescription>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4 mb-4">No configurations saved yet.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {configs.map((config, idx) => (
              <div key={idx} className="border rounded-md p-3 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{config.name}</h4>
                    <span className="text-xs text-slate-400">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <p><span className="font-medium">Objective:</span> {config.objective}</p>
                    <p><span className="font-medium">Profit:</span> {config.projectedProfit}</p>
                    <p><span className="font-medium">Marketing:</span> {config.marketingBudget}</p>
                    <p><span className="font-medium">Inventory:</span> {config.inventory}</p>
                    <p><span className="font-medium">Price:</span> {config.unitPrice}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 items-center mt-4 pt-4 border-t">
          <input 
            type="text" 
            placeholder="Configuration name..." 
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button onClick={handleSave} disabled={!newConfigName.trim()} size="sm">
            Save Current
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
