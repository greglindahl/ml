import { useState } from "react";
import { MoreHorizontal, Video, Image, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LibraryAsset, getRelativeTime } from "@/lib/mockLibraryData";
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

interface AssetTableViewProps {
  assets: LibraryAsset[];
  isLoading?: boolean;
}

type SortField = "creator" | "dateCreated" | "captureDate" | "downloads" | "shares" | "galleries" | "tags" | "viewers" | "publicViews" | "status" | "favorites" | "lastDownloadDate" | null;
type SortDirection = "asc" | "desc";

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <Video className={className} />;
    default:
      return <Image className={className} />;
  }
}

// Format file size for display
function formatFileSize(size: string): string {
  return size;
}

// Get orientation from aspect ratio
function getOrientation(aspectRatio: LibraryAsset["aspectRatio"]): string {
  switch (aspectRatio) {
    case "16:9":
    case "4:3":
      return "Landscape";
    case "9:16":
      return "Portrait";
    case "1:1":
      return "Square";
    default:
      return "Unknown";
  }
}


export function AssetTableView({ assets, isLoading = false }: AssetTableViewProps) {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    const newSelected = new Set(selectedAssets);
    if (checked) {
      newSelected.add(assetId);
    } else {
      newSelected.delete(assetId);
    }
    setSelectedAssets(newSelected);
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
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortField) return 0;
    
    let comparison = 0;
    switch (sortField) {
      case "creator":
        comparison = a.creator.localeCompare(b.creator);
        break;
      case "dateCreated":
        comparison = a.dateCreated.getTime() - b.dateCreated.getTime();
        break;
      case "captureDate":
        comparison = a.captureDate.getTime() - b.captureDate.getTime();
        break;
      case "downloads": comparison = a.downloads - b.downloads; break;
      case "shares": comparison = a.shares - b.shares; break;
      case "galleries": comparison = a.galleries - b.galleries; break;
      case "tags": comparison = a.tags.length - b.tags.length; break;
      case "viewers": comparison = a.viewers - b.viewers; break;
      case "publicViews": comparison = a.publicViews - b.publicViews; break;
      case "status": comparison = a.status.localeCompare(b.status); break;
      case "favorites": comparison = a.favorites - b.favorites; break;
      case "lastDownloadDate":
        comparison = (a.lastDownloadDate?.getTime() ?? 0) - (b.lastDownloadDate?.getTime() ?? 0);
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const allSelected = assets.length > 0 && selectedAssets.size === assets.length;
  const someSelected = selectedAssets.size > 0 && selectedAssets.size < assets.length;

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              <TableHead className="w-20">Thumbnail</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Captured</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="w-4 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-12 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-24 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-32 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all assets"
                {...(someSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead className="w-24">Thumbnail</TableHead>
            <TableHead className="min-w-[120px]">
              <button 
                onClick={() => handleSort("creator")}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Creator
                {getSortIcon("creator")}
              </button>
            </TableHead>
            <TableHead className="min-w-[100px]">
              <button 
                onClick={() => handleSort("dateCreated")}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Added
                {getSortIcon("dateCreated")}
              </button>
            </TableHead>
            <TableHead className="min-w-[100px]">
              <button 
                onClick={() => handleSort("captureDate")}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Captured
                {getSortIcon("captureDate")}
              </button>
            </TableHead>
            <TableHead className="min-w-[200px]">Details</TableHead>
            <TableHead className="min-w-[140px]">Metadata</TableHead>
            <TableHead className="text-right min-w-[90px]">
              <button 
                onClick={() => handleSort("downloads")}
                className="flex items-center justify-end w-full hover:text-foreground transition-colors"
              >
                Downloads
                {getSortIcon("downloads")}
              </button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.map((asset) => (
            <TableRow 
              key={asset.id}
              data-state={selectedAssets.has(asset.id) ? "selected" : undefined}
            >
              {/* Checkbox */}
              <TableCell>
                <Checkbox 
                  checked={selectedAssets.has(asset.id)}
                  onCheckedChange={(checked) => handleSelectAsset(asset.id, !!checked)}
                  aria-label={`Select ${asset.name}`}
                />
              </TableCell>
              
              {/* Thumbnail */}
              <TableCell>
                <div className="relative w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                  <AssetTypeIcon type={asset.type} className="w-6 h-6 text-muted-foreground/40" />
                  {/* Video duration overlay */}
                  {asset.type === "video" && asset.duration && (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-medium text-white bg-black/70 px-1 rounded">
                      {asset.duration}
                    </span>
                  )}
                  {/* Status indicator */}
                  <span 
                    className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full ${
                      asset.status === "approved" ? "bg-green-500" :
                      asset.status === "pending" ? "bg-yellow-500" : "bg-gray-400"
                    }`}
                  />
                </div>
              </TableCell>
              
              {/* Creator */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{asset.creator}</span>
                  {asset.tags.length > 0 && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {asset.tags.slice(0, 2).join(", ")}
                    </span>
                  )}
                </div>
              </TableCell>
              
              {/* Added Date */}
              <TableCell>
                <span className="text-sm">{getRelativeTime(asset.dateCreated)}</span>
              </TableCell>
              
              {/* Capture Date (using same date for mock) */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {asset.dateCreated.toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric",
                    year: "2-digit"
                  })}
                </span>
              </TableCell>
              
              {/* Details (Title / Notes) */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[250px]" title={asset.name}>
                    {asset.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {asset.type === "video" ? "Video" : "Image"} • {asset.fileSize}
                  </span>
                </div>
              </TableCell>
              
              {/* Metadata */}
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{getOrientation(asset.aspectRatio)}</span>
                  <span className="text-xs text-muted-foreground">
                    {asset.aspectRatio} • {asset.dimensions || "N/A"}
                  </span>
                </div>
              </TableCell>
              
              {/* Downloads */}
              <TableCell className="text-right">
                <span className="text-sm font-medium">{asset.downloads}</span>
              </TableCell>
              
              {/* Actions Menu */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Download</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem>Add to Gallery</DropdownMenuItem>
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
