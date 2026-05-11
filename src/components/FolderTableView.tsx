import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FolderItem } from "@/lib/mockFolderData";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Column definitions for manage columns
const COLUMNS = [
  { key: "icon", label: "Icon" },
  { key: "name", label: "Name" },
  { key: "subfolders", label: "Subfolders" },
  { key: "created", label: "Created" },
  { key: "createdBy", label: "Created By" },
] as const;

type ColumnKey = typeof COLUMNS[number]["key"];
type ColumnVisibility = Record<ColumnKey, boolean>;

const PER_PAGE_OPTIONS = [10, 20, 40, 80] as const;

interface FolderTableViewProps {
  folders: FolderItem[];
  onNavigate: (folderId: string) => void;
  isLoading?: boolean;
  archivedFoldersOnly?: boolean;
  onUnarchiveFolder?: (folderId: string) => void;
}

type SortField = "name" | "subfolders" | "created" | null;
type SortDirection = "asc" | "desc";

const CREATORS = ["Sarah Mitchell", "David Chen", "Emma Rodriguez", "Marcus Thompson", "Olivia Park", "James Wilson"];

function enrichFolder(folder: FolderItem, index: number) {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - (index * 5 + 2));
  return {
    ...folder,
    creator: CREATORS[index % CREATORS.length],
    createdDate: d,
    subfolderCount: folder.children?.filter(c => c.type === "folder").length || 0,
  };
}

type EnrichedFolder = ReturnType<typeof enrichFolder>;

export function FolderTableView({ folders, onNavigate, isLoading = false, archivedFoldersOnly = false, onUnarchiveFolder }: FolderTableViewProps) {
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [perPage, setPerPage] = useState<number>(40);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    icon: true,
    name: true,
    subfolders: true,
    created: true,
    createdBy: true,
  });

  const toggleColumn = (key: ColumnKey) => {
    setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enrichedFolders = folders.map((f, i) => enrichFolder(f, i));

  const handleSelectAll = (checked: boolean) => {
    setSelectedFolders(checked ? new Set(folders.map(f => f.id)) : new Set());
  };

  const handleSelectFolder = (id: string, checked: boolean) => {
    const next = new Set(selectedFolders);
    checked ? next.add(id) : next.delete(id);
    setSelectedFolders(next);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <i className="bi bi-arrow-down-up w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === "asc"
      ? <i className="bi bi-arrow-up w-3 h-3 ml-1" />
      : <i className="bi bi-arrow-down w-3 h-3 ml-1" />;
  };




  const sorted = [...enrichedFolders].sort((a, b) => {
    if (!sortField) return 0;
    let cmp = 0;
    switch (sortField) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "subfolders": cmp = a.subfolderCount - b.subfolderCount; break;
      case "created": cmp = (a.createdDate?.getTime() || 0) - (b.createdDate?.getTime() || 0); break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // Apply pagination
  const paginatedFolders = sorted.slice(0, perPage);

  const allSelected = folders.length > 0 && selectedFolders.size === folders.length;
  const someSelected = selectedFolders.size > 0 && selectedFolders.size < folders.length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "-";
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
  };

  const renderRow = (folder: EnrichedFolder) => (
    <TableRow key={folder.id} data-state={selectedFolders.has(folder.id) ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={selectedFolders.has(folder.id)}
          onCheckedChange={(checked) => handleSelectFolder(folder.id, !!checked)}
          aria-label={`Select ${folder.name}`}
        />
      </TableCell>
      {columnVisibility.icon && (
        <TableCell>
          <i className="bi bi-folder2-open text-lg text-muted-foreground" />
        </TableCell>
      )}
      {columnVisibility.name && (
        <TableCell>
          <button
            onClick={() => onNavigate(folder.id)}
            className="font-medium text-sm text-primary hover:underline text-left truncate max-w-[200px]"
          >
            {folder.name}
          </button>
        </TableCell>
      )}
      {columnVisibility.subfolders && (
        <TableCell>
          <span className="text-sm">{folder.subfolderCount}</span>
        </TableCell>
      )}
      {columnVisibility.created && (
        <TableCell>
          <span className="text-sm">{formatDate(folder.createdDate)}</span>
        </TableCell>
      )}
      {columnVisibility.createdBy && (
        <TableCell>
          <span className="text-sm">{folder.creator}</span>
        </TableCell>
      )}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {archivedFoldersOnly ? (
              <DropdownMenuItem onClick={() => onUnarchiveFolder?.(folder.id)}>
                <i className="bi bi-arrow-counterclockwise w-4 h-4 mr-2" />Unarchive
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onNavigate(folder.id)}>
                  <i className="bi bi-eye w-4 h-4 mr-2" />View
                </DropdownMenuItem>
                <DropdownMenuItem><i className="bi bi-pencil w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem><i className="bi bi-arrows-move w-4 h-4 mr-2" />Move</DropdownMenuItem>
                <DropdownMenuItem><i className="bi bi-archive w-4 h-4 mr-2" />Archive</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><i className="bi bi-trash w-4 h-4 mr-2" />Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Subfolders</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="w-4 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-8 h-8 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-32 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-12 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-24 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-6 h-6 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Table Controls Row */}
      <div className="flex justify-end gap-2 p-3 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
              {perPage} per page
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white">
            {PER_PAGE_OPTIONS.map(option => (
              <DropdownMenuItem key={option} onClick={() => setPerPage(option)}>
                {option} per page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
              <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
              Manage Columns
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-2">
              {COLUMNS.map(col => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded">
                  <Checkbox
                    checked={columnVisibility[col.key]}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all folders"
                  {...(someSelected ? { "data-state": "indeterminate" } : {})}
                />
              </TableHead>
              {columnVisibility.icon && <TableHead className="w-12"></TableHead>}
              {columnVisibility.name && (
                <TableHead className="min-w-[180px]">
                  <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                    Name{getSortIcon("name")}
                  </button>
                </TableHead>
              )}
              {columnVisibility.subfolders && (
                <TableHead className="min-w-[100px]">
                  <button onClick={() => handleSort("subfolders")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                    Subfolders{getSortIcon("subfolders")}
                  </button>
                </TableHead>
              )}
              {columnVisibility.created && (
                <TableHead className="min-w-[100px]">
                  <button onClick={() => handleSort("created")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                    Created{getSortIcon("created")}
                  </button>
                </TableHead>
              )}
              {columnVisibility.createdBy && (
                <TableHead className="min-w-[140px]">
                  <span className="uppercase text-xs tracking-wider">Created By</span>
                </TableHead>
              )}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFolders.map(folder => renderRow(folder))}
          </TableBody>
        </Table>
    </div>
  );
}
