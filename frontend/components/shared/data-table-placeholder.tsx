import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTablePlaceholderProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  title?: string;
  filterComponent?: React.ReactNode;
  className?: string;
}

export function DataTablePlaceholder<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Filter records...",
  title,
  filterComponent,
  className,
}: DataTablePlaceholderProps<T>) {
  return (
    <div className={cn("space-y-3.5", className)}>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {title && (
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Input
              placeholder={searchPlaceholder}
              icon={<Search className="h-3.5 w-3.5" />}
              className="h-8 text-xs"
            />
          </div>
          {filterComponent || (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Grid */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className={col.className}>
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground text-xs"
              >
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col, idx) => (
                  <TableCell key={idx} className={col.className}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "")
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
