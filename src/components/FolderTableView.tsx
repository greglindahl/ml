import { useState } from "react";
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, FolderOpen, Eye, Pencil, Move, Archive, Trash2, ArchiveRestore } from "lucide-react";
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
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
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
      <TableCell>
        <FolderOpen className="w-5 h-5 text-muted-foreground" />
      </TableCell>
      <TableCell>
        <button
          onClick={() => !archivedFoldersOnly && onNavigate(folder.id)}
          className="font-medium text-sm text-primary hover:underline text-left truncate max-w-[200px]"
        >
          {folder.name}
        </button>
      </TableCell>
      <TableCell>
        <span className="text-sm">{folder.subfolderCount}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{formatDate(folder.createdDate)}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{folder.creator}</span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {archivedFoldersOnly ? (
              <DropdownMenuItem onClick={() => onUnarchiveFolder?.(folder.id)}>
                <ArchiveRestore className="w-4 h-4 mr-2" />Unarchive
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onNavigate(folder.id)}>
                  <Eye className="w-4 h-4 mr-2" />View
                </DropdownMenuItem>
                <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem><Move className="w-4 h-4 mr-2" />Move</DropdownMenuItem>
                <DropdownMenuItem><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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
            <TableHead className="w-12"></TableHead>
            <TableHead className="min-w-[180px]">
              <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                Name{getSortIcon("name")}
              </button>
            </TableHead>
            <TableHead className="min-w-[100px]">
              <button onClick={() => handleSort("subfolders")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                Subfolders{getSortIcon("subfolders")}
              </button>
            </TableHead>
            <TableHead className="min-w-[100px]">
              <button onClick={() => handleSort("created")} className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider">
                Created{getSortIcon("created")}
              </button>
            </TableHead>
            <TableHead className="min-w-[140px]">
              <span className="uppercase text-xs tracking-wider">Created By</span>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(folder => renderRow(folder))}
        </TableBody>
      </Table>
    </div>
  );
}
