import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Gallery } from "@/lib/mockFolderData";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Extended gallery type for table view
export interface GalleryTableItem extends Gallery {
  description?: string;
  creator?: string;
  createdDate?: Date;
  lastAdded?: Date | string;
  sharingCount?: number;
  downloads?: number;
  hasVideo?: boolean;
  isNew?: boolean;
}

const GALLERY_MOVE_LIMIT = 5;
const MOVE_LIMIT_MESSAGE = "Too many galleries selected. You may only move up to 5 at a time.";

interface GalleryTableViewProps {
  galleries: GalleryTableItem[];
  isLoading?: boolean;
  onNavigate?: (galleryId: string) => void;
  onMoveGalleries?: (galleryIds: string[]) => void;
}

type SortField = "name" | "description" | "creator" | "created" | "lastAdded" | "sharing" | "downloads" | "totalAssets" | null;
type SortDirection = "asc" | "desc";

// Mock data generator for richer gallery info
function enrichGallery(gallery: Gallery, index: number): GalleryTableItem {
  const creators = ["Sarah Mitchell", "David Chen", "Emma Rodriguez", "Marcus Thompson", "Olivia Park", "James Wilson", "Priya Sharma", "Lucas Adams"];
  const descriptions = [
    "Game night highlights and key plays",
    "Practice session footage - team drills",
    "Pregame warmup and player arrivals",
    "Court-side fan reactions and crowd moments",
    "Post-game interviews and locker room",
    "Slam dunk compilation - best of season",
    "Three-point shooting practice clips",
    "Team huddle and timeout moments",
    "Player close-ups and action shots",
    "Arena atmosphere and halftime show",
    "Championship celebration footage",
    "Rookie spotlight and debut games",
  ];
  
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  
  return {
    ...gallery,
    description: descriptions[index % descriptions.length] || undefined,
    creator: creators[index % creators.length],
    createdDate: daysAgo(index * 3 + 1),
    lastAdded: index === 0 ? "13 hours ago" : daysAgo(index * 2),
    sharingCount: index % 3 === 0 ? Math.floor(Math.random() * 40) : 0,
    downloads: Math.floor(Math.random() * 100),
    hasVideo: index % 2 === 0,
    isNew: index < 4,
  };
}

export function GalleryTableView({ galleries, isLoading = false, onNavigate, onMoveGalleries }: GalleryTableViewProps) {
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Enrich galleries with additional data for display
  const enrichedGalleries = galleries.map((g, i) => enrichGallery(g, i));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGalleries(new Set(galleries.map(g => g.id)));
    } else {
      setSelectedGalleries(new Set());
    }
  };

  const handleSelectGallery = (galleryId: string, checked: boolean) => {
    const newSelected = new Set(selectedGalleries);
    if (checked) {
      newSelected.add(galleryId);
    } else {
      newSelected.delete(galleryId);
    }
    setSelectedGalleries(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc"
      ? <i className="bi bi-arrow-up w-3 h-3 ml-1" />
      : <i className="bi bi-arrow-down w-3 h-3 ml-1" />;
  };

  // Sort galleries
  const sortedGalleries = [...enrichedGalleries].sort((a, b) => {
    if (!sortField) return 0;
    
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "description":
        comparison = (a.description || "").localeCompare(b.description || "");
        break;
      case "creator":
        comparison = (a.creator || "").localeCompare(b.creator || "");
        break;
      case "created":
        comparison = (a.createdDate?.getTime() || 0) - (b.createdDate?.getTime() || 0);
        break;
      case "lastAdded":
        const aTime = typeof a.lastAdded === "string" ? 0 : (a.lastAdded?.getTime() || 0);
        const bTime = typeof b.lastAdded === "string" ? 0 : (b.lastAdded?.getTime() || 0);
        comparison = aTime - bTime;
        break;
      case "sharing":
        comparison = (a.sharingCount || 0) - (b.sharingCount || 0);
        break;
      case "downloads":
        comparison = (a.downloads || 0) - (b.downloads || 0);
        break;
      case "totalAssets":
        comparison = a.assetCount - b.assetCount;
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const allSelected = galleries.length > 0 && selectedGalleries.size === galleries.length;
  const someSelected = selectedGalleries.size > 0 && selectedGalleries.size < galleries.length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "-";
    return date.toLocaleDateString("en-US", { 
      month: "numeric", 
      day: "numeric",
      year: "2-digit"
    });
  };

  const formatLastAdded = (value: Date | string | undefined) => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    return formatDate(value);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              <TableHead className="w-24">Thumbnail</TableHead>
              <TableHead>Gallery Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Added</TableHead>
              <TableHead>Sharing</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
              <TableHead className="text-right">Total Assets</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="w-4 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-12 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-32 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-24 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse ml-auto" /></TableCell>
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
      {/* Bulk action bar */}
      {selectedGalleries.size > 0 && onMoveGalleries && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b">
          <span className="text-sm text-muted-foreground">
            {selectedGalleries.size} selected
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={selectedGalleries.size > GALLERY_MOVE_LIMIT}
                    onClick={() => onMoveGalleries(Array.from(selectedGalleries))}
                  >
                    <i className="bi bi-arrows-move w-3 h-3" />
                    Move
                  </Button>
                </div>
              </TooltipTrigger>
              {selectedGalleries.size > GALLERY_MOVE_LIMIT && (
                <TooltipContent>
                  {MOVE_LIMIT_MESSAGE}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all galleries"
                {...(someSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead className="w-24"></TableHead>
            <TableHead className="min-w-[180px]">
              <button 
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Gallery Name
                {getSortIcon("name")}
              </button>
            </TableHead>
            <TableHead className="min-w-[150px]">
              <button 
                onClick={() => handleSort("description")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Description
                {getSortIcon("description")}
              </button>
            </TableHead>
            <TableHead className="min-w-[140px]">
              <button 
                onClick={() => handleSort("creator")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Creator
                {getSortIcon("creator")}
              </button>
            </TableHead>
            <TableHead className="min-w-[100px]">
              <button 
                onClick={() => handleSort("created")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Created
                {getSortIcon("created")}
              </button>
            </TableHead>
            <TableHead className="min-w-[110px]">
              <button 
                onClick={() => handleSort("lastAdded")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Last Added
                {getSortIcon("lastAdded")}
              </button>
            </TableHead>
            <TableHead className="min-w-[80px]">
              <button 
                onClick={() => handleSort("sharing")}
                className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Sharing
                {getSortIcon("sharing")}
              </button>
            </TableHead>
            <TableHead className="text-right min-w-[100px]">
              <button 
                onClick={() => handleSort("downloads")}
                className="flex items-center justify-end w-full hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Downloads
                {getSortIcon("downloads")}
              </button>
            </TableHead>
            <TableHead className="text-right min-w-[100px]">
              <button 
                onClick={() => handleSort("totalAssets")}
                className="flex items-center justify-end w-full hover:text-foreground transition-colors uppercase text-xs tracking-wider"
              >
                Total Assets
                {getSortIcon("totalAssets")}
              </button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGalleries.map((gallery) => (
            <TableRow 
              key={gallery.id}
              data-state={selectedGalleries.has(gallery.id) ? "selected" : undefined}
            >
              {/* Checkbox */}
              <TableCell>
                <Checkbox 
                  checked={selectedGalleries.has(gallery.id)}
                  onCheckedChange={(checked) => handleSelectGallery(gallery.id, !!checked)}
                  aria-label={`Select ${gallery.name}`}
                />
              </TableCell>
              
              {/* Thumbnail */}
              <TableCell>
                <div className="relative w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                  <i className="bi bi-images text-2xl text-muted-foreground/40" />
                  {/* Asset count badge */}
                  <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded">
                    {gallery.assetCount}
                  </span>
                  {/* Video indicator */}
                  {gallery.hasVideo && (
                    <span className="absolute bottom-0.5 left-0.5 p-0.5 bg-primary rounded">
                      <i className="bi bi-camera-video text-[10px] text-primary-foreground" />
                    </span>
                  )}
                </div>
              </TableCell>
              
              {/* Gallery Name */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => onNavigate?.(gallery.id)}
                    className="font-medium text-sm text-primary hover:underline text-left truncate max-w-[200px]"
                  >
                    {gallery.name}
                  </button>
                  {gallery.isNew && (
                    <Badge variant="default" className="w-fit text-[10px] px-1.5 py-0 h-5">
                      NEW
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              {/* Description */}
              <TableCell>
                <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                  {gallery.description || "-"}
                </span>
              </TableCell>
              
              {/* Creator */}
              <TableCell>
                <span className="text-sm">{gallery.creator || "-"}</span>
              </TableCell>
              
              {/* Created Date */}
              <TableCell>
                <span className="text-sm">{formatDate(gallery.createdDate)}</span>
              </TableCell>
              
              {/* Last Added */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatLastAdded(gallery.lastAdded)}
                </span>
              </TableCell>
              
              {/* Sharing */}
              <TableCell>
                <span className={`text-sm ${gallery.sharingCount && gallery.sharingCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {gallery.sharingCount || 0}
                </span>
              </TableCell>
              
              {/* Downloads */}
              <TableCell className="text-right">
                <span className="text-sm">{gallery.downloads || 0}</span>
              </TableCell>
              
              {/* Total Assets */}
              <TableCell className="text-right">
                <span className="text-sm font-medium">{gallery.assetCount}</span>
              </TableCell>
              
              {/* Actions Menu */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <i className="bi bi-three-dots w-4 h-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>View Gallery</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveGalleries?.([gallery.id])}>Move</DropdownMenuItem>
                    <DropdownMenuItem>Download All</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
