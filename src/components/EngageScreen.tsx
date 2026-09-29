import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { format } from "date-fns";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormField } from "@/components/ui/form-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionTabs } from "@/components/SectionTabs";
import { EmptyState } from "@/components/EmptyState";
import { useScreenSlug, validTab } from "@/hooks/useScreenSlug";
import { toast } from "@/hooks/use-toast";
import { ListToolbar, useListControls } from "./ListToolbar";
import { CREATED_DATE_OPTIONS, matchesFilter, type ListFilterDef, type ListPillDef } from "./ListFilters";
import { ENGAGE_CAMPAIGN_COLUMNS, EngageCampaignsTable, EngageThemesTable } from "./EngageTables";
import { EngageThemeDialog } from "./EngageThemeDialog";
import { matchesDateRange, type DateRangeValue } from "@/lib/dateRangeFilter";
import { cn } from "@/lib/utils";
import {
  MEDIA_REQUESTED_LABELS,
  campaignSlug,
  mockEngageCampaigns,
  mockEngageDefaultTOS,
  mockEngageThemes,
  type EngageCampaign,
  type EngageDefaultTOS,
  type EngageTheme,
} from "@/lib/mockEngageData";

const ENGAGE_TABS = [
  { value: "campaigns", label: "Campaigns" },
  { value: "themes", label: "Themes" },
  { value: "settings", label: "Settings" },
] as const;

type EngageTab = (typeof ENGAGE_TABS)[number]["value"];

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

// Prod's only campaign filter is Status (Active / Expired) — the Expired pill below.
// These dropdowns are proposals, hidden until prod supports them.
const CAMPAIGN_FILTERS: ListFilterDef[] = [
  {
    id: "creator", proposed: true,
    label: "Creator",
    icon: "bi-person",
    searchable: true,
    options: unique(mockEngageCampaigns.map((c) => c.createdBy)).map((name) => ({ value: name, label: name })),
  },
  {
    id: "mediaRequested", proposed: true,
    label: "Media Requested",
    icon: "bi-camera",
    options: Object.entries(MEDIA_REQUESTED_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    id: "gallery", proposed: true,
    label: "Gallery",
    icon: "bi-images",
    searchable: true,
    options: [
      ...new Map(mockEngageCampaigns.filter((c) => c.gallery).map((c) => [c.gallery!.id, c.gallery!.name])).entries(),
    ].map(([value, label]) => ({ value, label })),
  },
  { id: "created", proposed: true, label: "Created Date", icon: "bi-calendar", multi: false, options: CREATED_DATE_OPTIONS },
];
const CAMPAIGN_FILTER_SETTINGS = CAMPAIGN_FILTERS.map((f) => ({ key: f.id, label: f.label }));

// Prod's Status radio (Active default / Expired) maps onto the same toggle
// semantics as the Archived pill elsewhere: off = active only, on = expired only.
const CAMPAIGN_PILLS: ListPillDef[] = [
  { id: "expired", label: "Expired", icon: "bi-hourglass-bottom", tooltip: "View only expired campaigns" },
];

function CampaignsTab({ campaigns, onChange }: { campaigns: EngageCampaign[]; onChange: (next: EngageCampaign[]) => void }) {
  const controls = useListControls("engage.campaigns", { columns: ENGAGE_CAMPAIGN_COLUMNS, filters: CAMPAIGN_FILTER_SETTINGS });
  const { search, filters, pills } = controls;
  const [expireTarget, setExpireTarget] = useState<EngageCampaign | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = filters.created?.[0]?.value as DateRangeValue | undefined;
    return campaigns.filter(
      (c) =>
        (pills.expired ? c.expired : !c.expired) &&
        (!q || [c.content, c.instructions, campaignSlug(c), c.createdBy].some((f) => f.toLowerCase().includes(q))) &&
        matchesFilter(filters, "creator", c.createdBy) &&
        matchesFilter(filters, "mediaRequested", c.mediaRequested) &&
        matchesFilter(filters, "gallery", c.gallery?.id ?? []) &&
        (!range || matchesDateRange(c.created, range)),
    );
  }, [campaigns, search, filters, pills]);

  const onlyExpiredToggle = pills.expired && !search && Object.keys(filters).length === 0;

  return (
    <>
      <ListToolbar
        controls={controls}
        filterDefs={CAMPAIGN_FILTERS}
        pillDefs={CAMPAIGN_PILLS}
        columns={ENGAGE_CAMPAIGN_COLUMNS}
        searchPlaceholder="Search campaigns"
        sheetTitle="Campaign Filters"
      />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState
            icon="bi-megaphone"
            title={onlyExpiredToggle ? "No expired campaigns" : "No campaigns found."}
            onClearAll={controls.isFiltered && !onlyExpiredToggle ? controls.clearAll : undefined}
          />
        ) : (
          <EngageCampaignsTable
            campaigns={rows}
            perPage={controls.perPage}
            columnVisibility={controls.columnVisibility}
            actions={{
              onViewDetails: () => {},
              onEdit: () => {},
              onGetEmbedCode: (c) => {
                const code = `<iframe src="${c.attachmentUrl}?embed=true" width="100%" height="720" frameborder="0"></iframe>`;
                navigator.clipboard?.writeText(code).catch(() => {});
                toast({ title: "Embed code copied", description: campaignSlug(c) });
              },
              onExpire: setExpireTarget,
              onDownloadResults: (c) => toast({ title: "Preparing download", description: `${c.totalResponses} submissions from ${c.content}` }),
            }}
          />
        )}
      </div>

      {/* Prod's confirm copy, verbatim. */}
      <AlertDialog open={!!expireTarget} onOpenChange={(open) => !open && setExpireTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Expire Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to expire this campaign? Once expired, fans will no longer be able to submit content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!expireTarget) return;
                onChange(campaigns.map((c) => (c.id === expireTarget.id ? { ...c, expired: true, expires: new Date() } : c)));
                toast({ title: "Campaign has been expired." });
                setExpireTarget(null);
              }}
            >
              Expire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

function ThemesTab({
  themes,
  onChange,
  editorOpen,
  onEditorOpenChange,
}: {
  themes: EngageTheme[];
  onChange: (next: EngageTheme[]) => void;
  editorOpen: boolean;
  onEditorOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState<EngageTheme | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EngageTheme | null>(null);

  const openEditor = (theme: EngageTheme | null) => {
    setEditing(theme);
    onEditorOpenChange(true);
  };

  const save = (draft: Omit<EngageTheme, "id">) => {
    // Only one default: promoting this theme demotes whichever held it.
    const demote = (t: EngageTheme) => (draft.default ? { ...t, default: false } : t);
    if (editing) {
      onChange(themes.map((t) => (t.id === editing.id ? { ...draft, id: t.id } : demote(t))));
      toast({ title: "Theme saved", description: draft.name });
    } else {
      onChange([...themes.map(demote), { ...draft, id: `theme-${Date.now()}` }]);
      toast({ title: "Theme created", description: draft.name });
    }
    onEditorOpenChange(false);
  };

  return (
    <>
      {themes.length === 0 ? (
        <EmptyState
          variant="empty"
          icon="bi-palette"
          title="No themes yet."
          description="Create a theme to easily reuse a color scheme in your Engage Campaigns."
        >
          <Button onClick={() => openEditor(null)}>Create Theme</Button>
        </EmptyState>
      ) : (
        // Prod has no search or filters here: companies keep a handful of themes.
        <EngageThemesTable
          themes={themes}
          onEdit={openEditor}
          onPreview={(t) => toast({ title: "Preview opened", description: `${t.name} opens in a preview window in prod.` })}
          onDelete={setDeleteTarget}
        />
      )}

      <EngageThemeDialog
        open={editorOpen}
        onOpenChange={(open) => {
          onEditorOpenChange(open);
          if (!open) setEditing(null);
        }}
        theme={editing}
        existingNames={themes.map((t) => t.name)}
        onSave={save}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete the theme "{deleteTarget?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                onChange(themes.filter((t) => t.id !== deleteTarget.id));
                toast({ title: "Theme deleted", description: deleteTarget.name });
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function SettingsTab({ saved, onSave }: { saved: EngageDefaultTOS; onSave: (next: EngageDefaultTOS) => void }) {
  const [terms, setTerms] = useState(saved.termsOfService);
  const [date, setDate] = useState<Date | null>(saved.termsOfServiceDate);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Prod: the date is required only once there are terms to date.
  const dateError = terms.trim() && !date ? "Please enter the last updated date." : undefined;
  const dirty = terms !== saved.termsOfService || date?.getTime() !== saved.termsOfServiceDate?.getTime();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (dateError) return;
    setSaving(true);
    window.setTimeout(() => {
      onSave({ termsOfService: terms, termsOfServiceDate: terms.trim() ? date : null });
      setSaving(false);
      setSubmitted(false);
      toast({ title: "Default terms of service saved" });
    }, 600);
  };

  return (
    <form onSubmit={handleSave} className="max-w-[720px] border rounded-lg bg-white p-6 space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[17px] font-semibold text-foreground">Default Terms of Service</h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          These terms of service will be included by default in each campaign. These will be appended to our existing{" "}
          <a href="/termsofservice-engage" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Engage terms of service
          </a>
          . You can customize them later in each campaign if necessary. If you do not need a custom terms of service, you can
          leave this empty.
        </p>
      </div>

      {/* Prod uses a rich-text editor (ngx-editor); a plain textarea stands in here. */}
      <FormField label="Terms of Service" htmlFor="engage-tos">
        <Textarea
          id="engage-tos"
          placeholder="Default Terms of Service"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          className="min-h-[200px] text-[15px] bg-white"
        />
      </FormField>

      <FormField label="Last Updated Date" htmlFor="engage-tos-date" required={!!terms.trim()} error={submitted ? dateError : undefined}>
        <div>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id="engage-tos-date"
              type="button"
              variant="outline"
              className={cn(
                "w-[240px] justify-between font-normal h-10 bg-white",
                !date && "text-muted-foreground",
                submitted && dateError && "border-destructive",
              )}
            >
              {date ? format(date, "MMM d, yyyy") : "Select date"}
              <i className="bi bi-calendar w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              // Not clearable, as in prod: picking the selected day again keeps it.
              onSelect={(d) => {
                if (d) setDate(d);
                setDateOpen(false);
              }}
              disabled={(d) => d > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        </div>
      </FormField>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={saving || !dirty}>
          {saving && <i className="bi bi-arrow-repeat animate-spin motion-reduce:animate-none" />}
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface EngageScreenProps {
  isMobile?: boolean;
  /** ?screen=engage&tab=... deep link */
  initialTab?: string;
}

export function EngageScreen({ isMobile = false, initialTab }: EngageScreenProps) {
  const [activeTab, setActiveTab] = useState<EngageTab>(validTab(initialTab, ENGAGE_TABS.map((t) => t.value)) ?? "campaigns");
  useScreenSlug("engage", activeTab);

  // Data lives here so it survives tab switches; list search/filter state
  // resets per tab, same as Connect.
  const [campaigns, setCampaigns] = useState(mockEngageCampaigns);
  const [themes, setThemes] = useState(mockEngageThemes);
  const [tos, setTos] = useState(mockEngageDefaultTOS);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3 min-h-[56px]">
        {/* min-h = 40px CTA + pb-4, so tabs without a CTA don't shift the title. */}
        <h1 className="text-[26px] font-semibold text-foreground">Engage</h1>
        {activeTab === "campaigns" && (
          <Button onClick={() => {}}>
            <i className="bi bi-plus-circle text-base" />
            New Campaign
          </Button>
        )}
        {activeTab === "themes" && (
          <Button onClick={() => setThemeEditorOpen(true)}>
            <i className="bi bi-plus-circle text-base" />
            New Theme
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EngageTab)} className="flex flex-col px-6 md:px-9">
        <SectionTabs tabs={[...ENGAGE_TABS]} value={activeTab} onValueChange={(v) => setActiveTab(v as EngageTab)} isMobile={isMobile} />

        <TabsContent value="campaigns" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <CampaignsTab campaigns={campaigns} onChange={setCampaigns} />
        </TabsContent>
        <TabsContent value="themes" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <ThemesTab themes={themes} onChange={setThemes} editorOpen={themeEditorOpen} onEditorOpenChange={setThemeEditorOpen} />
        </TabsContent>
        <TabsContent value="settings" className="py-6 mt-0 data-[state=inactive]:hidden">
          <SettingsTab saved={tos} onSave={setTos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
