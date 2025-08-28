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
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable"
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
  IconEye,
  IconPencil,
  IconArchive,
  IconTrash,
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
import { UpdatePatientDialog } from "@/components/update-patient-dialog"
import { ArchiveReasonDialog } from "@/components/archive-reason-dialog"
import { HardDeleteDialog } from "@/components/hard-delete-dialog"
import { usePatients } from "@/hooks/patients/patientHooks"
import { useCallback, useEffect } from "react"
import { useState } from "react"
import { Toggle } from "@/components/ui/toggle"

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
  cases: z.array(z.object({
    title: z.string(),
    description: z.string(),
    treatmentPlan: z.string().optional(),
    status: z.enum(['Active', 'Completed', 'Cancelled']),
  })).optional(),
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

// Define the table meta interface
interface TableMeta {
  onUpdate?: (patient: z.infer<typeof schema>) => void;
  onArchive?: (patientId: string, isActive: boolean) => void;
  onHardDelete?: (patientId: string, patientName: string) => void;
}

// Add this before the columns definition
function ActionsCell({ row, onUpdate, onArchive, onHardDelete }: {
  row: Row<z.infer<typeof schema>>,
  onUpdate?: (patient: z.infer<typeof schema>) => void,
  onArchive?: (patientId: string, isActive: boolean) => void,
  onHardDelete?: (patientId: string, patientName: string) => void
}) {
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
    if (onUpdate) {
      onUpdate(row.original);
    }
  };

  const handleArchive = () => {
    const isActive = row.original.isActive;
    const actionText = isActive ? "Archive" : "Restore";

    toast.message(`${actionText} ${row.original.firstName} ${row.original.lastName}?`, {
      action: {
        label: actionText,
        onClick: () => onArchive?.(row.original._id, !isActive)
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { }
      }
    });
  };

  const handleHardDelete = () => {
    if (onHardDelete) {
      const patientName = `${row.original.firstName} ${row.original.lastName}`;
      onHardDelete(row.original._id, patientName);
    }
  };

  return (
    <div className="tour-actions-menu">
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
          <DropdownMenuItem
            onClick={handleArchive}
            className={row.original.isActive ? "text-red-600" : "text-green-600"}
          >
            <IconArchive className="mr-2 h-4 w-4" />
            {row.original.isActive ? "Archive Patient" : "Restore Patient"}
          </DropdownMenuItem>
          {/* Hard Delete - Only show for archived patients */}
          {!row.original.isActive && onHardDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleHardDelete}
                className="text-red-800 focus:text-red-900 focus:bg-red-50"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete Permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
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
      return <div className="text-violet-700 dark:text-white">{row.original.firstName}</div>
    },
    enableHiding: false,
    size: 120,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: ({ row }) => {
      return <div className="text-violet-700 dark:text-white">{row.original.lastName}</div>
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
    accessorKey: "caseStatus",
    header: "Case Status",
    cell: ({ row }) => {
      const activeCases = row.original.cases?.filter(c => c.status === 'Active') || [];
      const completedCases = row.original.cases?.filter(c => c.status === 'Completed') || [];
      const cancelledCases = row.original.cases?.filter(c => c.status === 'Cancelled') || [];

      let statusText = "No Cases";
      let statusColor = "text-gray-600 border-gray-200";

      if (activeCases.length > 0) {
        statusText = `${activeCases.length} Active`;
        statusColor = "text-green-600 border-green-200 bg-green-50";
      } else if (completedCases.length > 0 && cancelledCases.length === 0) {
        statusText = "All Completed";
        statusColor = "text-blue-600 border-blue-200 bg-blue-50";
      } else if (cancelledCases.length > 0) {
        statusText = "Has Cancelled";
        statusColor = "text-orange-600 border-orange-200 bg-orange-50";
      }

      return (
        <Badge variant="outline" className={`px-1.5 ${statusColor}`}>
          {statusText}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "patientStatus",
    header: "Patient Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={`px-1.5 ${row.original.isActive
            ? "text-violet-600 border-violet-200"
            : "text-red-600 border-red-200 bg-red-50"
          }`}
      >
        {row.original.isActive ? (
          <IconCircleCheckFilled className="fill-violet-500 dark:fill-violet-400 mr-1" />
        ) : (
          <IconArchive className="text-red-500 mr-1" />
        )}
        {row.original.isActive ? "Active" : "Archived"}
      </Badge>
    ),
    size: 120,
  },
  {
    id: "actions",
    header: () => <div id="tour-actions-column">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta;
      return <ActionsCell row={row} onUpdate={meta?.onUpdate} onArchive={meta?.onArchive} onHardDelete={meta?.onHardDelete} />;
    },
    size: 80,
  },
]

interface PaginationData {
  page: number;
  limit: number;
  totalPages: number;
  totalPatients: number;
}

export function DataTable({
  data: initialData,
  pagination: externalPagination,
  showArchived = false,
  onShowArchivedChange,
  onPageChange,
}: {
  data: z.infer<typeof schema>[]
  pagination?: PaginationData;
  showArchived?: boolean;
  onShowArchivedChange?: (showArchived: boolean) => void;
  onPageChange?: (page: number, limit: number) => void;
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<z.infer<typeof schema> | null>(null)

  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false)
  const [archiveAction, setArchiveAction] = React.useState<{
    type: 'single' | 'multiple';
    isArchiving: boolean;
    patientId?: string;
    patientIds?: string[];
    patientName?: string;
  } | null>(null)

  // Hard delete dialog state
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = React.useState(false)
  const [hardDeletePatientData, setHardDeletePatientData] = React.useState<{
    id: string;
    name: string;
  } | null>(null)

  // Use external pagination if provided, otherwise fall back to internal
  const currentPage = externalPagination ? externalPagination.page - 1 : internalPagination.pageIndex;
  const pageSize = externalPagination ? externalPagination.limit : internalPagination.pageSize;
  const totalPages = externalPagination ? externalPagination.totalPages : Math.ceil(data.length / pageSize);

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const { getPatients, archivePatient, restorePatient, archiveMultiplePatients, restoreMultiplePatients, hardDeletePatient, loading } = usePatients();
  const [patients, setPatients] = useState<z.infer<typeof schema>[]>([]);

  // Patient management functions
  const handleUpdatePatient = (patient: z.infer<typeof schema>) => {
    setSelectedPatient(patient);
    setUpdateDialogOpen(true);
  };

  const handleArchivePatient = async (patientId: string, newIsActive: boolean) => {
    const patient = data.find(p => p._id === patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : undefined;

    setArchiveAction({
      type: 'single',
      isArchiving: !newIsActive,
      patientId,
      patientName
    });
    setArchiveDialogOpen(true);
  };

  const handleMultipleArchive = async (isArchive: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const patientIds = selectedRows.map(row => row.original._id);

    if (patientIds.length === 0) {
      toast.error('Please select patients to archive/restore');
      return;
    }

    setArchiveAction({
      type: 'multiple',
      isArchiving: isArchive,
      patientIds
    });
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async (reason: string) => {
    if (!archiveAction) return;

    try {
      if (archiveAction.type === 'single' && archiveAction.patientId) {
        if (archiveAction.isArchiving) {
          await archivePatient(archiveAction.patientId, reason);
        } else {
          await restorePatient(archiveAction.patientId, reason || undefined);
        }
      } else if (archiveAction.type === 'multiple' && archiveAction.patientIds) {
        if (archiveAction.isArchiving) {
          await archiveMultiplePatients(archiveAction.patientIds, reason);
        } else {
          await restoreMultiplePatients(archiveAction.patientIds, reason || undefined);
        }
        setRowSelection({}); // Clear selection after bulk operation
      }

      // Refresh data
      if (onPageChange) {
        onPageChange(currentPage + 1, pageSize);
      } else {
        fetchPatients();
      }
    } catch (error) {
      console.error('Error in archive operation:', error);
      throw error; // Re-throw to let dialog handle it
    } finally {
      setArchiveAction(null);
    }
  };

  const handleHardDelete = (patientId: string, patientName: string) => {
    setHardDeletePatientData({
      id: patientId,
      name: patientName
    });
    setHardDeleteDialogOpen(true);
  };

  const handleHardDeleteConfirm = async () => {
    if (!hardDeletePatientData) return;

    try {
      await hardDeletePatient(hardDeletePatientData.id);

      // Refresh data
      if (onPageChange) {
        onPageChange(currentPage + 1, pageSize);
      } else {
        fetchPatients();
      }
    } catch (error) {
      console.error('Error in hard delete operation:', error);
      throw error; // Re-throw to let dialog handle it
    } finally {
      setHardDeletePatientData(null);
    }
  };

  // Watch for changes to both initialData and patients state
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Also update data when patients state changes
  React.useEffect(() => {
    if (patients && patients.length > 0) {
      // Ensure patients have _id property by mapping if needed
      const formattedPatients = patients.map(patient => {
        const patientObj = patient as z.infer<typeof schema>;
        return {
          ...patientObj,
          _id: patientObj._id || ''
        };
      });
      setData(formattedPatients);
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

  // Load patients on initial render only if no external pagination is provided
  useEffect(() => {
    if (!externalPagination) {
      fetchPatients();
    }
  }, [fetchPatients, externalPagination]);

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
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
    meta: {
      onUpdate: handleUpdatePatient,
      onArchive: handleArchivePatient,
      onHardDelete: handleHardDelete,
    },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (externalPagination && onPageChange) {
        const newPagination = typeof updater === 'function'
          ? updater({ pageIndex: currentPage, pageSize: pageSize })
          : updater;
        onPageChange(newPagination.pageIndex + 1, newPagination.pageSize);
      } else {
        setInternalPagination(prev => typeof updater === 'function' ? updater(prev) : updater);
      }
    },
    pageCount: externalPagination ? totalPages : -1,
    manualPagination: !!externalPagination,
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
    <div className="w-full flex-col justify-start gap-6" style={{ minHeight: '600px' }}>
      <div className="flex items-center justify-between px-4 lg:px-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {onShowArchivedChange && (
            <Toggle
              pressed={showArchived}
              onPressedChange={onShowArchivedChange}
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 data-[state=on]:bg-red-100 dark:data-[state=on]:bg-red-900/30 data-[state=on]:text-red-700 dark:data-[state=on]:text-red-400 data-[state=on]:border-red-200 dark:data-[state=on]:border-red-800 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">
                {showArchived ? "Show Active Patients" : "Show Archived Patients"}
              </span>
              <span className="sm:hidden">
                {showArchived ? "Active" : "Archived"}
              </span>
            </Toggle>
          )}
          
        </div>
        <div className="flex items-center gap-2">
                  {/* Mobile: Show Archive button when items selected, or nothing when no selection */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMultipleArchive(!showArchived)}
            className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm whitespace-nowrap min-w-fit lg:hidden"
          >
            <IconArchive className="text-violet-600 mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{showArchived ? "Restore" : "Archive"} Selected</span>
            <span className="sm:hidden">{showArchived ? "Restore" : "Archive"}</span>
            <span className="ml-1">({table.getFilteredSelectedRowModel().rows.length})</span>
          </Button>
        )}
        
        {/* Desktop: Show Archive when items selected */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMultipleArchive(!showArchived)}
            className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm whitespace-nowrap min-w-fit hidden lg:flex"
          >
            <IconArchive className="text-violet-600 mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{showArchived ? "Restore" : "Archive"} Selected</span>
            <span className="sm:hidden">{showArchived ? "Restore" : "Archive"}</span>
            <span className="ml-1">({table.getFilteredSelectedRowModel().rows.length})</span>
          </Button>
        )}
        
        {/* Desktop: Always show Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm min-w-fit hidden lg:flex">
              <IconLayoutColumns className="text-violet-600 mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <IconChevronDown className="ml-1 text-slate-400 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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
                    className="capitalize hover:bg-slate-50 dark:hover:bg-slate-700"
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
          <AddPatientDialog onPatientAdded={onPageChange ? () => onPageChange(1, pageSize) : fetchPatients} />
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-6">
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm min-h-[400px] bg-sidebar">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table className="border-collapse min-w-full text-xs md:text-sm text-slate-900 dark:text-white">
              <TableHeader className="bg-zinc-800 text-white border-b border-zinc-700/50">
                <TableRow>
                  {/* Mobile: Name, Number, and Actions header in a single row */}
                  <TableHead colSpan={table.getAllColumns().length} className="block md:hidden p-2 text-white align-middle">
                    <div className="flex flex-row items-center justify-between w-full">
                      <span className="font-semibold mr-2">Select</span>
                      <span className="font-semibold flex-1 text-left">Name</span>
                      <span className="font-semibold flex-1 text-center">Number</span>
                      <span className="font-semibold text-right">Actions</span>
                    </div>
                  </TableHead>
                  {/* Desktop: Show all headers */}
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan} className="hidden md:table-cell text-zinc-100">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[300px]">
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      {/* Mobile: Name, Number, and Actions in a single row */}
                      <TableCell colSpan={table.getAllColumns().length} className="block md:hidden p-2 align-middle text-slate-900 dark:text-white">
                        <div className="flex flex-row items-center justify-between w-full">
                          {/* Checkbox for mobile selection */}
                          <div className="flex items-center mr-2">
                            {(() => {
                              const cell = row.getVisibleCells().find(cell => cell.column.id === 'select');
                              return cell
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : null;
                            })()}
                          </div>
                          <span className="flex-1 text-violet-700 dark:text-white font-medium whitespace-normal break-words text-left">
                            {row.original.firstName} {row.original.lastName}
                          </span>
                          <span className="flex-1 text-xs text-gray-500 text-center">
                            {row.original.contactNumber}
                          </span>
                          <span className="flex justify-end">
                            {(() => {
                              const cell = row.getVisibleCells().find(cell => cell.column.id === 'actions');
                              return cell
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : null;
                            })()}
                          </span>
                        </div>
                      </TableCell>
                      {/* Desktop: Show all cells */}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="hidden md:table-cell border-b border-slate-200 dark:border-slate-700 p-4 text-slate-900 dark:text-white">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center text-violet-300 italic">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-slate-500 flex-1 text-sm">
            <span className="font-medium">{table.getFilteredSelectedRowModel().rows.length}</span> of{" "}
            <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium text-violet-600">
                Rows per page
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  if (externalPagination && onPageChange) {
                    onPageChange(1, newPageSize);
                  } else {
                    table.setPageSize(newPageSize);
                  }
                }}
              >
                <SelectTrigger className="w-20 border-violet-200" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((size) => (
                    <div
                      key={size}
                      className="hover:bg-violet-50/20 cursor-pointer px-2 py-1.5 text-sm"
                      onClick={() => {
                        if (externalPagination && onPageChange) {
                          onPageChange(1, size);
                        } else {
                          table.setPageSize(size);
                        }
                      }}
                    >
                      {size}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page <span className="text-violet-600 mx-1 font-semibold">{currentPage + 1}</span> of{" "}
              <span className="text-violet-600 mx-1 font-semibold">{totalPages}</span>
              {externalPagination && (
                <span className="ml-2 text-xs text-slate-500">
                  ({externalPagination.totalPatients} total)
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex border-slate-200 hover:bg-slate-50"
                onClick={() => {
                  if (externalPagination && onPageChange) {
                    onPageChange(1, pageSize);
                  } else {
                    table.setPageIndex(0);
                  }
                }}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="size-8 border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => {
                  if (externalPagination && onPageChange) {
                    onPageChange(currentPage, pageSize);
                  } else {
                    table.previousPage();
                  }
                }}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="size-8 border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => {
                  if (externalPagination && onPageChange) {
                    onPageChange(currentPage + 2, pageSize);
                  } else {
                    table.nextPage();
                  }
                }}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="text-violet-600" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex border-slate-200 hover:bg-slate-50"
                size="icon"
                onClick={() => {
                  if (externalPagination && onPageChange) {
                    onPageChange(totalPages, pageSize);
                  } else {
                    table.setPageIndex(table.getPageCount() - 1);
                  }
                }}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="text-violet-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Patient Dialog */}
      {selectedPatient && (
        <UpdatePatientDialog
          patient={selectedPatient}
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          onPatientUpdated={() => {
            if (onPageChange) {
              onPageChange(currentPage + 1, pageSize);
            } else {
              fetchPatients();
            }
          }}
        />
      )}

      {/* Archive Reason Dialog */}
      <ArchiveReasonDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        onConfirm={handleArchiveConfirm}
        patientName={archiveAction?.patientName}
        patientCount={archiveAction?.patientIds?.length}
        isArchiving={archiveAction?.isArchiving ?? true}
        loading={loading}
      />

      {/* Hard Delete Dialog */}
      <HardDeleteDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
        onConfirm={handleHardDeleteConfirm}
        patientName={hardDeletePatientData?.name || ""}
        loading={loading}
      />
    </div>
  )
}
