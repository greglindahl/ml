import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import "bootstrap-icons/font/bootstrap-icons.css";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    // TODO: Handle dropped files
    const files = Array.from(e.dataTransfer.files);
    console.log("Dropped files:", files);
  }, []);

  const handleClick = useCallback(() => {
    // TODO: Trigger file input click
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".jpg,.jpeg,.png,.gif,.mp4,.mov";
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      console.log("Selected files:", files);
    };
    input.click();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-[15px] font-medium">Upload Assets</DialogTitle>
          <DialogDescription className="sr-only">
            Upload images and videos to your media library
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-4">
          {/* Upload To section */}
          <div className="flex items-center justify-between border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground">Upload To:</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#EDF2F9] flex items-center justify-center">
                  <i className="bi bi-images text-[#6e84a3] text-sm" />
                </div>
                <span className="text-[13px] text-foreground">All Assets</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6e84a3]">
              <i className="bi bi-plus w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </div>

          {/* Drop zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragOver
                ? "border-primary bg-primary/10"
                : "border-[#B1C2D9] bg-[#F0F5FA]"
              }
            `}
            style={{ minHeight: "360px" }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[15px] text-[#95AAC9]">
                Drop files or click here to upload
              </span>
            </div>
          </div>

          {/* Format hint */}
          <p className="text-[13px] text-primary">
            (.jpg, .jpeg, .png, .gif, .mp4 and .mov formats / Max 100 files)
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
