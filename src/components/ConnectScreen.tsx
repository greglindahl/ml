import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SectionTabs } from "@/components/SectionTabs";
import { EmptyState } from "@/components/EmptyState";
import { useScreenSlug, validTab } from "@/hooks/useScreenSlug";
import { toast } from "@/hooks/use-toast";
import { ListToolbar, useListControls } from "./ListToolbar";
import { CREATED_DATE_OPTIONS, matchesFilter, type ListFilterDef, type ListPillDef } from "./ListFilters";
import {
  EXPORT_COLUMNS,
  ExportsTable,
  IMPORT_COLUMNS,
  ImportsTable,
  IntegrationsTable,
  ROUTING_RULE_COLUMNS,
  RoutingRulesTable,
} from "./ConnectTables";
import { matchesDateRange, type DateRangeValue } from "@/lib/dateRangeFilter";
import {
  EXPORT_STATUS_LABELS,
  IMPORT_RUN_STATE_LABELS,
  IMPORT_STATUS_LABELS,
  IMPORT_TYPE_LABELS,
  INTEGRATION_STATUS_LABELS,
  getDamTypeLabel,
  getExportDisplayStatus,
  getImportDisplayStatus,
  getImportRunState,
  getIntegrationStatus,
  mockExports,
  mockImports,
  mockIntegrations,
  mockRoutingRules,
  uniqueBy,
  type ConnectExport,
  type DamImport,
  type Integration,
  type RoutingRule,
} from "@/lib/mockConnectData";

const CONNECT_TABS = [
  { value: "imports", label: "Imports" },
  { value: "exports", label: "Exports" },
  { value: "routing-rules", label: "Routing Rules" },
  { value: "integrations", label: "Integrations" },
] as const;

type ConnectTab = (typeof CONNECT_TABS)[number]["value"];

const CTA_LABELS: Partial<Record<ConnectTab, string>> = {
  imports: "New Import",
  exports: "New Export",
  "routing-rules": "New Rule",
};

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

const includesText = (query: string, ...fields: (string | null | undefined)[]) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((f) => f?.toLowerCase().includes(q));
};

const matchesCreated = (filters: Record<string, { value: string }[]>, date: Date) => {
  const range = filters.created?.[0]?.value as DateRangeValue | undefined;
  return !range || matchesDateRange(date, range);
};

const toSettings = (defs: ListFilterDef[]) => defs.map((d) => ({ key: d.id, label: d.label }));

const archivedPill = (noun: string): ListPillDef => ({
  id: "archived",
  label: "Archived",
  icon: "bi-archive",
  // Prod's toggle copy: "View Only Archived Imports" / "…Exports".
  tooltip: `View only archived ${noun}`,
});

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

const allImportGalleries = uniqueBy(mockImports.flatMap((i) => i.galleries), (g) => g.id);
const allImportRules = uniqueBy(mockImports.flatMap((i) => i.routingRules), (r) => r.id);

// Prod's only Connect filters are the "View only archived" toggles on Imports and
// Exports. Every dropdown below is a design proposal, marked `proposed` so it stays
// hidden until prod supports it (see SHOW_PROPOSED_FILTERS in ListFilters).
const IMPORT_FILTERS: ListFilterDef[] = [
  {
    id: "service", proposed: true,
    label: "Service",
    icon: "bi-plug",
    searchable: true,
    options: uniqueBy(mockImports, (i) => i.credential.damType).map((i) => ({
      value: i.credential.damType,
      label: getDamTypeLabel(i.credential.damType),
    })),
  },
  { id: "status", proposed: true, label: "Status", icon: "bi-activity", options: options({ active: IMPORT_STATUS_LABELS.active, paused: IMPORT_STATUS_LABELS.paused }) },
  { id: "lastRun", proposed: true, label: "Last Run", icon: "bi-clock-history", options: options(IMPORT_RUN_STATE_LABELS) },
  { id: "type", proposed: true, label: "Import Type", icon: "bi-arrow-repeat", options: options(IMPORT_TYPE_LABELS) },
  {
    id: "destination", proposed: true,
    label: "Destination",
    icon: "bi-signpost-split",
    searchable: true,
    options: [
      ...allImportGalleries.map((g) => ({ value: `gallery:${g.id}`, label: g.name })),
      ...allImportRules.map((r) => ({ value: `rule:${r.id}`, label: `Rule: ${r.name}` })),
    ],
  },
  { id: "created", proposed: true, label: "Created Date", icon: "bi-calendar", multi: false, options: CREATED_DATE_OPTIONS },
];
const IMPORT_FILTER_SETTINGS = toSettings(IMPORT_FILTERS);
const IMPORT_PILLS = [archivedPill("imports")];

function ImportsTab({ imports, onChange }: { imports: DamImport[]; onChange: (next: DamImport[]) => void }) {
  const controls = useListControls("connect.imports", { columns: IMPORT_COLUMNS, filters: IMPORT_FILTER_SETTINGS });
  const { search, filters, pills } = controls;

  const rows = useMemo(
    () =>
      imports.filter((imp) => {
        const status = getImportDisplayStatus(imp);
        // Prod semantics: toggle off = everything but archived, on = archived only.
        if (pills.archived ? status !== "archived" : status === "archived") return false;
        return (
          includesText(search, imp.credential.name, getDamTypeLabel(imp.credential.damType), imp.folderName, ...imp.tags, ...imp.galleries.map((g) => g.name)) &&
          matchesFilter(filters, "service", imp.credential.damType) &&
          matchesFilter(filters, "status", status) &&
          matchesFilter(filters, "lastRun", getImportRunState(imp)) &&
          matchesFilter(filters, "type", imp.type) &&
          matchesFilter(filters, "destination", [...imp.galleries.map((g) => `gallery:${g.id}`), ...imp.routingRules.map((r) => `rule:${r.id}`)]) &&
          matchesCreated(filters, imp.dateRequested)
        );
      }),
    [imports, search, filters, pills],
  );

  const update = (target: DamImport, change: Partial<DamImport>, message: string) => {
    onChange(imports.map((i) => (i.id === target.id ? { ...i, ...change } : i)));
    toast({ title: message });
  };

  return (
    <>
      <ListToolbar
        controls={controls}
        filterDefs={IMPORT_FILTERS}
        pillDefs={IMPORT_PILLS}
        columns={IMPORT_COLUMNS}
        searchPlaceholder="Search imports"
        sheetTitle="Import Filters"
      />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState
            icon="bi-cloud-arrow-down"
            title={pills.archived && !controls.search && Object.keys(filters).length === 0 ? "No archived imports" : "No imports found."}
            onClearAll={controls.isFiltered ? controls.clearAll : undefined}
          />
        ) : (
          <ImportsTable
            imports={rows}
            perPage={controls.perPage}
            columnVisibility={controls.columnVisibility}
            onPauseToggle={(imp) =>
              getImportDisplayStatus(imp) === "paused"
                ? update(imp, { status: "COMPLETED" }, "Import resumed")
                : update(imp, { status: "STOPPED" }, "Import paused")
            }
            onArchiveToggle={(imp) =>
              getImportDisplayStatus(imp) === "archived"
                ? update(imp, { status: "COMPLETED" }, "Import unarchived")
                : update(imp, { status: "ARCHIVED" }, "Import archived")
            }
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const EXPORT_FILTERS: ListFilterDef[] = [
  {
    id: "integration", proposed: true,
    label: "Integration",
    icon: "bi-plug",
    options: uniqueBy(mockExports, (e) => e.damType).map((e) => ({ value: e.damType, label: getDamTypeLabel(e.damType) })),
  },
  { id: "status", proposed: true, label: "Status", icon: "bi-activity", options: options({ active: EXPORT_STATUS_LABELS.active, invalid: EXPORT_STATUS_LABELS.invalid }) },
  {
    id: "sourceGallery", proposed: true,
    label: "Source Gallery",
    icon: "bi-images",
    searchable: true,
    options: uniqueBy(mockExports.map((e) => e.sourceGallery), (g) => g.id).map((g) => ({ value: g.id, label: g.name })),
  },
  { id: "created", proposed: true, label: "Created Date", icon: "bi-calendar", multi: false, options: CREATED_DATE_OPTIONS },
];
const EXPORT_FILTER_SETTINGS = toSettings(EXPORT_FILTERS);
const EXPORT_PILLS = [archivedPill("exports")];

function ExportsTab({ exports, onChange }: { exports: ConnectExport[]; onChange: (next: ConnectExport[]) => void }) {
  const controls = useListControls("connect.exports", { columns: EXPORT_COLUMNS, filters: EXPORT_FILTER_SETTINGS });
  const { search, filters, pills } = controls;

  const rows = useMemo(
    () =>
      exports.filter((exp) => {
        const status = getExportDisplayStatus(exp);
        if (pills.archived ? status !== "archived" : status === "archived") return false;
        return (
          includesText(search, exp.sourceGallery.name, exp.destinationChannel, exp.credential?.name, exp.createdBy) &&
          matchesFilter(filters, "integration", exp.damType) &&
          matchesFilter(filters, "status", status) &&
          matchesFilter(filters, "sourceGallery", exp.sourceGallery.id) &&
          matchesCreated(filters, exp.created)
        );
      }),
    [exports, search, filters, pills],
  );

  return (
    <>
      <ListToolbar
        controls={controls}
        filterDefs={EXPORT_FILTERS}
        pillDefs={EXPORT_PILLS}
        columns={EXPORT_COLUMNS}
        searchPlaceholder="Search exports"
        searchProposed
        sheetTitle="Export Filters"
      />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState
            icon="bi-cloud-arrow-up"
            title={pills.archived && !controls.search && Object.keys(filters).length === 0 ? "No archived exports" : "No exports found."}
            onClearAll={controls.isFiltered ? controls.clearAll : undefined}
          />
        ) : (
          <ExportsTable
            exports={rows}
            perPage={controls.perPage}
            columnVisibility={controls.columnVisibility}
            onArchiveToggle={(exp) => {
              const archiving = exp.enabled;
              onChange(exports.map((e) => (e.id === exp.id ? { ...e, enabled: !archiving } : e)));
              toast({ title: archiving ? "Export archived" : "Export unarchived" });
            }}
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Routing rules
// ---------------------------------------------------------------------------

const RULE_FILTERS: ListFilterDef[] = [
  {
    id: "tag", proposed: true,
    label: "Tag",
    icon: "bi-tag",
    searchable: true,
    options: uniqueBy(mockRoutingRules.flatMap((r) => r.tagMappings.map((m) => m.tag)), (t) => t.toLowerCase()).map((t) => ({ value: t, label: t })),
  },
  {
    id: "gallery", proposed: true,
    label: "Gallery",
    icon: "bi-images",
    searchable: true,
    options: uniqueBy(mockRoutingRules.flatMap((r) => r.tagMappings.flatMap((m) => m.galleries)), (g) => g.id).map((g) => ({ value: g.id, label: g.name })),
  },
  { id: "created", proposed: true, label: "Created Date", icon: "bi-calendar", multi: false, options: CREATED_DATE_OPTIONS },
];
const RULE_FILTER_SETTINGS = toSettings(RULE_FILTERS);

function RoutingRulesTab({ rules, onChange }: { rules: RoutingRule[]; onChange: (next: RoutingRule[]) => void }) {
  const controls = useListControls("connect.routingRules", { columns: ROUTING_RULE_COLUMNS, filters: RULE_FILTER_SETTINGS });
  const { search, filters } = controls;

  const rows = useMemo(
    () =>
      rules.filter(
        (rule) =>
          includesText(search, rule.name, ...rule.tagMappings.map((m) => m.tag)) &&
          matchesFilter(filters, "tag", rule.tagMappings.map((m) => m.tag)) &&
          matchesFilter(filters, "gallery", rule.tagMappings.flatMap((m) => m.galleries.map((g) => g.id))) &&
          matchesCreated(filters, rule.created),
      ),
    [rules, search, filters],
  );

  return (
    <>
      <ListToolbar
        controls={controls}
        filterDefs={RULE_FILTERS}
        columns={ROUTING_RULE_COLUMNS}
        searchPlaceholder="Search rules and tags"
        sheetTitle="Routing Rule Filters"
      />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState
            icon="bi-signpost-split"
            title="No routing rules found."
            onClearAll={controls.isFiltered ? controls.clearAll : undefined}
          />
        ) : (
          <RoutingRulesTable
            rules={rows}
            perPage={controls.perPage}
            columnVisibility={controls.columnVisibility}
            onDelete={(rule) => {
              onChange(rules.filter((r) => r.id !== rule.id));
              toast({ title: "Routing rule deleted", description: rule.name });
            }}
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

const INTEGRATION_FILTERS: ListFilterDef[] = [
  { id: "status", proposed: true, label: "Status", icon: "bi-activity", options: options(INTEGRATION_STATUS_LABELS) },
];
const INTEGRATION_FILTER_SETTINGS = toSettings(INTEGRATION_FILTERS);

function IntegrationsTab({ integrations, onChange }: { integrations: Integration[]; onChange: (next: Integration[]) => void }) {
  const controls = useListControls("connect.integrations", { filters: INTEGRATION_FILTER_SETTINGS });
  const { search, filters } = controls;

  const rows = useMemo(
    () =>
      integrations.filter(
        (i) => includesText(search, i.label, i.credential?.name) && matchesFilter(filters, "status", getIntegrationStatus(i)),
      ),
    [integrations, search, filters],
  );

  const setCredential = (target: Integration, credential: Integration["credential"]) =>
    onChange(integrations.map((i) => (i.damType === target.damType ? { ...i, credential } : i)));

  return (
    <>
      {/* No gear: prod's integrations list has no pagination or column manager. */}
      <ListToolbar controls={controls} filterDefs={INTEGRATION_FILTERS} searchPlaceholder="Search integrations" sheetTitle="Integration Filters" searchProposed />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState icon="bi-plug" title="No integrations found." onClearAll={controls.clearAll} />
        ) : (
          <IntegrationsTable
            integrations={rows}
            onAuthorize={(i) => {
              setCredential(i, {
                id: `cred-${i.damType.toLowerCase()}`,
                name: i.credential?.name ?? i.label,
                damType: i.damType,
                status: "ACTIVE",
                authorizedBy: "You",
              });
              toast({ title: `${i.label} is now connected.` });
            }}
            onDisconnect={(i) => {
              setCredential(i, null);
              toast({ title: `${i.label} disconnected` });
            }}
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface ConnectScreenProps {
  isMobile?: boolean;
  /** ?screen=connect&tab=... deep link */
  initialTab?: string;
}

export function ConnectScreen({ isMobile = false, initialTab }: ConnectScreenProps) {
  const [activeTab, setActiveTab] = useState<ConnectTab>(validTab(initialTab, CONNECT_TABS.map((t) => t.value)) ?? "imports");
  useScreenSlug("connect", activeTab);

  // Data lives here so row actions survive tab switches. Search/filter state
  // lives in each tab and starts fresh on switch — each tab is a different list,
  // not a different view of the same one.
  const [imports, setImports] = useState(mockImports);
  const [exports, setExports] = useState(mockExports);
  const [rules, setRules] = useState(mockRoutingRules);
  const [integrations, setIntegrations] = useState(mockIntegrations);

  const cta = CTA_LABELS[activeTab];

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3 min-h-[56px]">
        {/* min-h = 40px CTA + pb-4, so tabs without a CTA don't shift the title. */}
        <h1 className="text-[26px] font-semibold text-foreground">Connect</h1>
        {cta && (
          <Button onClick={() => {}}>
            <i className="bi bi-plus-circle text-base" />
            {cta}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConnectTab)} className="flex flex-col px-6 md:px-9">
        <SectionTabs tabs={[...CONNECT_TABS]} value={activeTab} onValueChange={(v) => setActiveTab(v as ConnectTab)} isMobile={isMobile} />

        <TabsContent value="imports" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <ImportsTab imports={imports} onChange={setImports} />
        </TabsContent>
        <TabsContent value="exports" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <ExportsTab exports={exports} onChange={setExports} />
        </TabsContent>
        <TabsContent value="routing-rules" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <RoutingRulesTab rules={rules} onChange={setRules} />
        </TabsContent>
        <TabsContent value="integrations" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <IntegrationsTab integrations={integrations} onChange={setIntegrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
