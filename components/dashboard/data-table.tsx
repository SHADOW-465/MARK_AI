import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Column<T> {
  key: keyof T
  header: string
}

interface DataTableProps<T extends Record<string, string | number>> {
  columns: Column<T>[]
  rows: T[]
}

export function DataTable<T extends Record<string, string | number>>({ columns, rows }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={String(col.key)}>{row[col.key]}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell className="text-muted-foreground" colSpan={columns.length}>
              No records available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
