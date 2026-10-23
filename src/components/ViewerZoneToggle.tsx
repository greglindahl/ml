import { VIEWER_ZONES, setViewerZone, useViewerZone } from "@/lib/captureTime";

/** Prototype only: review capture-date time zones as a viewer somewhere else. */
export function ViewerZoneToggle({ className = "" }: { className?: string }) {
  const { id } = useViewerZone();
  return (
    <label className={`inline-flex items-center gap-1.5 border border-dashed border-muted-foreground/40 rounded-md px-1.5 py-0.5 text-[12px] text-muted-foreground ${className}`}>
      Viewing as
      <select
        value={id}
        onChange={(e) => setViewerZone(e.target.value as (typeof VIEWER_ZONES)[number]["id"])}
        className="bg-transparent text-foreground focus:outline-none cursor-pointer"
        aria-label="Viewer time zone (prototype)"
      >
        {VIEWER_ZONES.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label}
          </option>
        ))}
      </select>
    </label>
  );
}
