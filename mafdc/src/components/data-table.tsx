"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconEye,
  IconPencil,
  IconArchive,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddPatientDialog } from "@/components/add-patient-dialog"
import { usePatients } from "@/hooks/patients/patientHooks"
import { useCallback, useEffect } from "react"
import { useState } from "react"

export const schema = z.object({
  _id: z.string(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  birthDate: z.string(),
  age: z.number(),
  gender: z.string(),
  contactNumber: z.string(),
  email: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    contactNumber: z.string().optional(),
  }).optional(),
  allergies: z.string().optional(),
  lastVisit: z.string().optional(),
  isActive: z.boolean(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id} />,
    size: 40,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: ({ row }) => {
      return <div className="text-violet-700">{row.original.firstName}</div>
    },
    enableHiding: false,
    size: 120,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: ({ row }) => {
      return <div className="text-violet-700">{row.original.lastName}</div>
    },
    enableHiding: false,
    size: 120,
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => (
      <div className="text-left">{row.original.age}</div>
    ),
    size: 80,
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
        <Badge variant="outline" className="text-violet-600 border-violet-200 px-1.5">
        {row.original.gender}
        </Badge>
    ),
    size: 100,
  },
  {
    accessorKey: "contactNumber",
    header: "Contact",
    cell: ({ row }) => (
      <div className="text-left">{row.original.contactNumber}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "Status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-violet-600 border-violet-200 px-1.5">
        {row.original.isActive ? (
          <IconCircleCheckFilled className="fill-violet-500 dark:fill-violet-400 mr-1" />
        ) : (
          <IconLoader className="text-violet-500 mr-1" />
        )}
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
    size: 100,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const router = useRouter();
      const [isNavigating, setIsNavigating] = useState(false);
      
      const handleViewProfile = () => {
        if (isNavigating) return;
        
        const patientId = row.original._id;
        if (!patientId) {
          toast.error('Invalid patient ID');
          return;
        }
        
        setIsNavigating(true);
        router.push(`/patients/${patientId}`);
      };
      
      const handleUpdate = () => {
        toast.info("Update functionality coming soon");
      };
      
      const handleArchive = () => {
        toast.info("Archive functionality coming soon");
      };
      
      return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewProfile} disabled={isNavigating}>
              <IconEye className="mr-2 h-4 w-4" />
              {isNavigating ? 'Loading...' : 'See Profile'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpdate}>
              <IconPencil className="mr-2 h-4 w-4" />
              Update
            </DropdownMenuItem>
          <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchive} className="text-red-600">
              <IconArchive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      );
    },
    size: 80,
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 border-b border-slate-200 hover:bg-slate-50/50 data-[state=selected]:bg-slate-100/50"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="border-b border-slate-200 p-4">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const [isLoading, setIsLoading] = useState(true);
  const { getPatients, loading: patientsLoading } = usePatients();
  const [patients, setPatients] = useState<z.infer<typeof schema>[]>([]);

  // Watch for changes to both initialData and patients state
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Also update data when patients state changes
  React.useEffect(() => {
    if (patients && patients.length > 0) {
      // Ensure patients have _id property by mapping if needed
      const formattedPatients = patients.map(patient => {
        // Use type assertion to safely access properties
        const patientObj = patient as any;
        return {
          ...patientObj,
          _id: patientObj._id || patientObj.id || '' // Fallback to id if _id not present
        };
      });
      setData(formattedPatients as z.infer<typeof schema>[]);
    }
  }, [patients]);

  // Memoize the fetchPatients function
  const fetchPatients = useCallback(async () => {
    try {
      const response = await getPatients();
      setPatients(response.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, [getPatients]);

  // Load patients on initial render
  useEffect(() => {
    let isMounted = true;

    const loadPatients = async () => {
      if (!isLoading) {
        await fetchPatients();
      }
    };

    loadPatients();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isLoading, fetchPatients]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ _id }) => _id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                <IconLayoutColumns className="text-violet-600 mr-1" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-slate-200">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize hover:bg-slate-50"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddPatientDialog onPatientAdded={fetchPatients} />
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table className="border-collapse">
              <TableHeader className="bg-zinc-800 text-white border-b border-zinc-700/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className="text-zinc-100">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8 bg-white/5">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-violet-300 italic"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-slate-500 hidden flex-1 text-sm lg:flex">
            <span className="font-medium">{table.getFilteredSelectedRowModel().rows.length}</span> of{" "}
            <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium text-violet-600">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20 border-violet-200" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <div 
                      key={pageSize} 
                      className="hover:bg-violet-50/20 cursor-pointer px-2 py-1.5 text-sm"
                      onClick={() => table.setPageSize(Number(pageSize))}
                    >
                      {pageSize}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page <span className="text-violet-600 mx-1 font-semibold">{table.getState().pagination.pageIndex + 1}</span> of{" "}
              <span className="text-violet-600 mx-1 font-semibold">{table.getPageCount()}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex border-slate-200 hover:bg-slate-50"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="size-8 border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="size-8 border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="text-violet-600" />
              </Button>
            </div>
          </div>
        </div>
              </div>
            </div>
  )
}
