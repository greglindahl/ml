import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { THEME_COLOR_FIELDS, type EngageTheme, type ThemeColorKey } from "@/lib/mockEngageData";

/**
 * Prod's theme-editor-modal: name (max 50), "Make theme default", and the five
 * colors. Prod previews in a separate window; here the preview is inline so the
 * colors can be judged without leaving the dialog.
 */

const NAME_MAX = 50;
const HEX = /^#[0-9a-f]{6}$/i;

const BLANK: Omit<EngageTheme, "id"> = {
  name: "",
  default: false,
  foregroundColor: "#12263F",
  backgroundColor: "#FFFFFF",
  ctaForegroundColor: "#FFFFFF",
  ctaBackgroundColor: "#2C7BE5",
  bannerColor: "#12263F",
};

interface EngageThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create. */
  theme: EngageTheme | null;
  existingNames: string[];
  onSave: (theme: Omit<EngageTheme, "id">) => void;
}

function ThemePreview({ draft }: { draft: Omit<EngageTheme, "id"> }) {
  return (
    <div className="rounded-lg border overflow-hidden text-[12px]" aria-label="Theme preview">
      <div className="h-12 flex items-end px-3 pb-2" style={{ backgroundColor: draft.bannerColor }}>
        <span className="w-8 h-8 rounded-full bg-white/90 border inline-flex items-center justify-center text-[10px] font-semibold text-[#12263F]">
          ZI
        </span>
      </div>
      <div className="p-3 space-y-2" style={{ backgroundColor: draft.backgroundColor, color: draft.foregroundColor }}>
        <p className="font-semibold text-[13px]">Fan Cam: Home Opener</p>
        <p className="opacity-80">Share your best photos from today's game.</p>
        <p>
          By submitting you agree to the{" "}
          <span className="underline" style={{ color: draft.ctaBackgroundColor }}>terms of service</span>.
        </p>
        <span
          className="inline-flex items-center justify-center h-8 px-3 rounded-md font-medium"
          style={{ backgroundColor: draft.ctaBackgroundColor, color: draft.ctaForegroundColor }}
        >
          Upload
        </span>
      </div>
    </div>
  );
}

export function EngageThemeDialog({ open, onOpenChange, theme, existingNames, onSave }: EngageThemeDialogProps) {
  const [draft, setDraft] = useState<Omit<EngageTheme, "id">>(BLANK);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(theme ? { ...theme } : BLANK);
    setSubmitted(false);
  }, [open, theme]);

  const trimmed = draft.name.trim();
  const duplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase() && n !== theme?.name);
  const nameError = !trimmed ? "Please enter a theme name." : duplicate ? "A theme with this name already exists." : undefined;
  const badColors = THEME_COLOR_FIELDS.filter((f) => !HEX.test(draft[f.key]));

  const setColor = (key: ThemeColorKey, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    setSubmitted(true);
    if (nameError || badColors.length > 0) return;
    onSave({ ...draft, name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{theme ? "Edit Theme" : "Create a Theme"}</DialogTitle>
          <DialogDescription>Reuse a color scheme across your Engage campaigns.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <FormField
              label="Name Your Theme"
              htmlFor="theme-name"
              required
              error={submitted ? nameError : undefined}
              description={`${draft.name.length}/${NAME_MAX}`}
            >
              <Input
                id="theme-name"
                placeholder="Enter Name"
                maxLength={NAME_MAX}
                value={draft.name}
                variant={submitted && nameError ? "error" : "default"}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </FormField>

            <div className="flex items-center gap-2">
              <Checkbox
                id="theme-default"
                checked={draft.default}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, default: checked === true }))}
              />
              <Label
                htmlFor="theme-default"
                className="font-normal cursor-pointer"
                tooltip="New campaigns start with the default theme. Only one theme can be the default."
              >
                Make theme default
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_COLOR_FIELDS.map((field) => {
                const invalid = submitted && !HEX.test(draft[field.key]);
                return (
                  <FormField key={field.key} label={field.label} htmlFor={`theme-${field.key}`} error={invalid ? "Use a hex color like #2C7BE5." : undefined}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${field.label} picker`}
                        value={HEX.test(draft[field.key]) ? draft[field.key] : "#000000"}
                        onChange={(e) => setColor(field.key, e.target.value.toUpperCase())}
                        className="h-10 w-10 flex-shrink-0 rounded-md border border-input bg-white p-1 cursor-pointer"
                      />
                      <Input
                        id={`theme-${field.key}`}
                        value={draft[field.key]}
                        maxLength={7}
                        variant={invalid ? "error" : "default"}
                        onChange={(e) => setColor(field.key, e.target.value)}
                        className="font-mono uppercase"
                      />
                    </div>
                  </FormField>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <ThemePreview draft={draft} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{theme ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
