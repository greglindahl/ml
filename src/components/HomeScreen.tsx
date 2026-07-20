import { ReactNode, useMemo, useRef, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { AssetCard } from "@/components/AssetCard";
import { AssetDetailModal } from "@/components/AssetDetailModal";
import { GalleryCard } from "@/components/GalleryCard";
import { CustomizeHomeDrawer, type ToggleItem, type QuickActionItem } from "@/components/CustomizeHomeDrawer";
import { getRelativeTime, mockLibraryAssets } from "@/lib/mockLibraryData";
import stGalleryCard from "@/assets/st-gallery-card.svg";
import stAssetOne from "@/assets/st-asset-one.svg";
import stAssetTwo from "@/assets/st-asset-two.svg";
import stTourFive from "@/assets/starter-gallery/5.svg";
import stTourSix from "@/assets/starter-gallery/6.svg";
import stTourSeven from "@/assets/starter-gallery/7.svg";
import stTourEight from "@/assets/starter-gallery/8.svg";
import stTourNine from "@/assets/starter-gallery/9.svg";
import stTourTen from "@/assets/starter-gallery/10.svg";
import stTourEleven from "@/assets/starter-gallery/11.svg";

export type HomeViewAllTarget =
  | "recent-assets"
  | "recent-galleries"
  | "recent-activity"
  | "recent-connect-jobs"
  | "recent-requests";

interface HomeScreenProps {
  isMobile?: boolean;
  onOpenStarterGallery?: () => void;
  /** Called when a module's "View All" is clicked; the owner navigates to the matching screen. */
  onViewAll?: (target: HomeViewAllTarget) => void;
}

// Starter gallery tour deck shown in the Get Started module. The row does not
// scroll — it ends with a "+ X more" card (backed by stTourTen) that opens the
// starter gallery. X = total deck size minus every card rendered in the row.
const TOUR_TOTAL_ASSETS = 18;
const TOUR_CARDS = [
  { src: stGalleryCard, alt: "Welcome to Greenfly" },
  { src: stAssetOne, alt: "Everyone is in the play" },
  { src: stAssetTwo, alt: "Collect content from every source" },
  { src: stTourFive, alt: "Distribute the right content to every stakeholder" },
  { src: stTourSix, alt: "Activate every relevant stakeholder" },
  { src: stTourSeven, alt: "Measure by sharing the team wins" },
  { src: stTourEight, alt: "Your team is on it" },
  { src: stTourNine, alt: "Starter gallery tour card" },
  { src: stTourTen, alt: "ProCapture tour card" },
];
const TOUR_REMAINING_COUNT = TOUR_TOTAL_ASSETS - TOUR_CARDS.length - 1;

const QUICK_ACTIONS_KEY = "homeQuickActions";
const ONBOARDING_MODULES_KEY = "homeOnboardingModules";
const RECENT_MEDIA_MODULES_KEY = "homeRecentMediaModules";
const ACTIVITY_MODULES_KEY = "homeActivityModules";

const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  { id: "upload", label: "Upload", icon: "bi-upload", visible: true },
  { id: "new-gallery", label: "New Gallery", icon: "bi-image", visible: true },
  { id: "add-user", label: "Add User", icon: "bi-person-add", visible: true },
  { id: "uploads", label: "Uploads", icon: "bi-cloud-arrow-up", visible: true },
  { id: "favorites", label: "Favorites", icon: "bi-heart", visible: true },
];

const DEFAULT_ONBOARDING_MODULES: ToggleItem[] = [
  { id: "get-started", label: "Starter Gallery", visible: true },
];

const DEFAULT_RECENT_MEDIA_MODULES: ToggleItem[] = [
  { id: "recent-assets", label: "Recent Assets", visible: true },
  { id: "recent-galleries", label: "Recent Galleries", visible: true },
];

const DEFAULT_ACTIVITY_MODULES: ToggleItem[] = [
  { id: "recent-activity", label: "Recent Activity", visible: true },
  { id: "recent-connect-jobs", label: "Recent Connect Jobs", visible: true },
  { id: "recent-requests", label: "Recent Requests", visible: true },
];

// Activity modules that may share a row (two-up). Recent Activity is
// intentionally absent — it always needs the full width. Add future compact
// modules (e.g. Engage Campaigns, Workflows) here and to the defaults above.
const COMPACT_ACTIVITY_MODULES = new Set(["recent-connect-jobs", "recent-requests"]);

function loadPersistedList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

// The 5 most recently created real library assets, so this tile links straight
// into the same asset data (and detail modal) used everywhere else in the app.
const RECENT_ASSETS = [...mockLibraryAssets]
  .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
  .slice(0, 5);

interface RecentGallery {
  id: string;
  name: string;
  assetCount: number;
  thumbnailUrl: string;
}

const RECENT_GALLERIES: RecentGallery[] = [
  { id: "home-gallery-1", name: "Season Highlights", assetCount: 48, thumbnailUrl: "https://picsum.photos/seed/home-gallery-1/400/300" },
  { id: "home-gallery-2", name: "Media Day", assetCount: 32, thumbnailUrl: "https://picsum.photos/seed/home-gallery-2/400/300" },
  { id: "home-gallery-3", name: "Fan Engagement", assetCount: 22, thumbnailUrl: "https://picsum.photos/seed/home-gallery-3/400/300" },
  { id: "home-gallery-4", name: "Behind the Scenes", assetCount: 40, thumbnailUrl: "https://picsum.photos/seed/home-gallery-4/400/300" },
  { id: "home-gallery-5", name: "Community Day", assetCount: 26, thumbnailUrl: "https://picsum.photos/seed/home-gallery-5/400/300" },
];

interface ActivityItem {
  id: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  description: ReactNode;
  date: string;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "activity-1",
    iconBg: "#fcedc4",
    iconColor: "text-accent-yellow",
    icon: "bi-megaphone-fill",
    description: <>Amber Johnson (Admin) created an Announcement &quot;ANOTHER TEST!!!&quot; that was sent to 1 user</>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-2",
    iconBg: "#f9c1cc",
    iconColor: "text-accent-pink",
    icon: "bi-people-fill",
    description: <>User: 49654 joined Sportgeeks with invite code <a href="#" className="underline">SPORTGEEKS123</a></>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-3",
    iconBg: "#c1d6f3",
    iconColor: "text-accent-blue",
    icon: "bi-images",
    description: <>Tell Vickers (Admin) created gallery <a href="#" className="underline">tell create upload gallery</a></>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-4",
    iconBg: "#e3cbe9",
    iconColor: "text-accent-purple",
    icon: "bi-send-fill",
    description: <>Greg Lindahl TestAdmin sent a post to social request <a href="#" className="underline">Schedule Badge</a> to 1 user</>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-5",
    iconBg: "#c1d6f3",
    iconColor: "text-accent-blue",
    icon: "bi-images",
    description: <>Tell Vickers (Admin) created gallery <a href="#" className="underline">tell create upload gallery</a></>,
    date: "03/15/2025, 2:30 PM",
  },
];

interface TwoLineItem {
  id: string;
  icon: string;
  description: ReactNode;
  subLabel: string;
}

const CONNECT_JOBS: TwoLineItem[] = [
  { id: "job-1", icon: "bi-gear-fill", description: "Greenfly created an import from WebDam to gallery test gallery...", subLabel: "Last run date: 03/15/2025, 2:30 PM" },
  { id: "job-2", icon: "bi-tag-fill", description: <>Greenfly imported 68 assets from GettyImages from tag &quot;lebron...</>, subLabel: "Last run date: 03/15/2025, 2:30 PM" },
  { id: "job-3", icon: "bi-gear-fill", description: <>Greenfly created an import from Sam&apos;s S3 bucket to gallery <a href="#" className="underline">S3</a>...</>, subLabel: "Last run date: 03/15/2025, 2:30 PM" },
];

const RECENT_REQUESTS: TwoLineItem[] = [
  { id: "request-1", icon: "bi-camera-fill", description: "Amber Johnson (Admin) re-sent a review content request Test to...", subLabel: "03/15/2025, 2:30 PM" },
  { id: "request-2", icon: "bi-camera-fill", description: "Tell Vickers (Admin) modified a post to social request tell test ...", subLabel: "03/15/2025, 2:30 PM" },
  { id: "request-3", icon: "bi-camera-fill", description: "Tell Vickers (Admin) deleted Request tell test request", subLabel: "03/15/2025, 2:30 PM" },
  { id: "request-4", icon: "bi-camera-fill", description: "Amber Johnson (Admin) created a post to social request [Name]", subLabel: "03/15/2025, 2:30 PM" },
];

function SectionHeader({ title, size = "lg", onViewAll }: { title: string; size?: "lg" | "md"; onViewAll?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={size === "lg" ? "text-[20px] font-medium text-black tracking-tight" : "text-[15px] font-medium text-black tracking-tight"}>
        {title}
      </h2>
      <Button variant="link" className="h-auto p-0 text-[15px]" onClick={onViewAll}>
        View All
      </Button>
    </div>
  );
}

function ActivityCard({ title, icon, iconBg, iconColor, onViewAll, children }: { title: string; icon: string; iconBg: string; iconColor: string; onViewAll?: () => void; children: ReactNode }) {
  return (
    <div className="h-full bg-white border border-gray-300 rounded-lg p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: iconBg }}>
            <i className={`bi ${icon} ${iconColor} text-lg`} />
          </span>
          <h2 className="text-[20px] font-medium text-black tracking-tight">{title}</h2>
        </div>
        <Button variant="link" className="h-auto p-0 text-[15px]" onClick={onViewAll}>
          View All
        </Button>
      </div>
      {children}
    </div>
  );
}

function ActivityTable({ items }: { items: ActivityItem[] }) {
  return (
    <div className="w-full">
      <div className="flex bg-gray-100 border border-gray-300 rounded-t-lg h-12">
        <div className="flex-1 flex items-center px-6">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">Activity</span>
        </div>
        <div className="w-[250px] flex items-center px-6">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">Date</span>
        </div>
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`flex border-b border-l border-r border-gray-300 bg-white ${i === items.length - 1 ? "rounded-b-lg" : ""}`}
        >
          <div className="flex-1 flex items-center gap-3 px-6 py-[17px] min-w-0">
            <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: item.iconBg }}>
              <i className={`bi ${item.icon} ${item.iconColor} text-sm`} />
            </span>
            <p className="text-[13px] text-black min-w-0">{item.description}</p>
          </div>
          <div className="w-[250px] flex items-center gap-1.5 px-6 py-[17px] flex-shrink-0">
            <i className="bi bi-clock text-gray-600 text-sm" />
            <span className="text-[13px] text-gray-700">{item.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TwoLineTable({ items, columnLabel, iconBg, iconColor }: { items: TwoLineItem[]; columnLabel: string; iconBg: string; iconColor: string }) {
  return (
    <div className="w-full">
      <div className="flex bg-gray-100 border border-gray-300 rounded-t-lg h-12">
        <div className="flex-1 flex items-center px-6">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{columnLabel}</span>
        </div>
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 border-b border-l border-r border-gray-300 bg-white px-6 py-[17px] ${i === items.length - 1 ? "rounded-b-lg" : ""}`}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: iconBg }}>
            <i className={`bi ${item.icon} ${iconColor} text-sm`} />
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[13px] text-black">{item.description}</p>
            <p className="text-[13px] text-gray-700">{item.subLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderActivityModule(id: string, onViewAll?: (target: HomeViewAllTarget) => void) {
  switch (id) {
    case "recent-activity":
      return (
        <ActivityCard title="Recent Activity" icon="bi-activity" iconBg="#d5e5fa" iconColor="text-accent-blue" onViewAll={() => onViewAll?.("recent-activity")}>
          <ActivityTable items={RECENT_ACTIVITY} />
        </ActivityCard>
      );
    case "recent-connect-jobs":
      return (
        <ActivityCard title="Recent Connect Jobs" icon="bi-gear" iconBg="#d7eff6" iconColor="text-accent-cyan" onViewAll={() => onViewAll?.("recent-connect-jobs")}>
          <TwoLineTable items={CONNECT_JOBS} columnLabel="Activity" iconBg="#d7eff6" iconColor="text-accent-cyan" />
        </ActivityCard>
      );
    case "recent-requests":
      return (
        <ActivityCard title="Recent Requests" icon="bi-camera" iconBg="#e3cbe9" iconColor="text-accent-purple" onViewAll={() => onViewAll?.("recent-requests")}>
          <TwoLineTable items={RECENT_REQUESTS} columnLabel="Request" iconBg="#e3cbe9" iconColor="text-accent-purple" />
        </ActivityCard>
      );
    default:
      return null;
  }
}

export function HomeScreen({ isMobile = false, onOpenStarterGallery, onViewAll }: HomeScreenProps) {
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);

  const viewingAssetIndex = useMemo(
    () => RECENT_ASSETS.findIndex((a) => a.id === viewingAssetId),
    [viewingAssetId]
  );
  const viewingAsset = viewingAssetIndex >= 0 ? RECENT_ASSETS[viewingAssetIndex] : null;

  // Customize Homepage state — this drives the live page render directly, so
  // toggling/reordering in the drawer previews instantly behind it. Opening the
  // drawer snapshots the committed state; Cancel restores it, Save persists it.
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>(() =>
    // Icons always come from the defaults — localStorage only decides order
    // and visibility, so icon changes in code reach users with saved lists.
    loadPersistedList(QUICK_ACTIONS_KEY, DEFAULT_QUICK_ACTIONS).map((item) => ({
      ...item,
      icon: DEFAULT_QUICK_ACTIONS.find((d) => d.id === item.id)?.icon ?? item.icon,
    }))
  );
  const [onboardingModules, setOnboardingModules] = useState<ToggleItem[]>(() =>
    loadPersistedList(ONBOARDING_MODULES_KEY, DEFAULT_ONBOARDING_MODULES)
  );
  const [recentMediaModules, setRecentMediaModules] = useState<ToggleItem[]>(() =>
    loadPersistedList(RECENT_MEDIA_MODULES_KEY, DEFAULT_RECENT_MEDIA_MODULES)
  );
  const [activityModules, setActivityModules] = useState<ToggleItem[]>(() =>
    loadPersistedList(ACTIVITY_MODULES_KEY, DEFAULT_ACTIVITY_MODULES)
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isGetStartedExpanded, setIsGetStartedExpanded] = useState(true);
  const customizeSnapshotRef = useRef<{
    quickActions: QuickActionItem[];
    onboardingModules: ToggleItem[];
    recentMediaModules: ToggleItem[];
    activityModules: ToggleItem[];
  } | null>(null);

  const handleOpenCustomize = () => {
    customizeSnapshotRef.current = { quickActions, onboardingModules, recentMediaModules, activityModules };
    setCustomizeOpen(true);
  };

  const handleCancelCustomize = () => {
    const snapshot = customizeSnapshotRef.current;
    if (snapshot) {
      setQuickActions(snapshot.quickActions);
      setOnboardingModules(snapshot.onboardingModules);
      setRecentMediaModules(snapshot.recentMediaModules);
      setActivityModules(snapshot.activityModules);
    }
    setCustomizeOpen(false);
  };

  const handleSaveCustomize = () => {
    window.localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(quickActions));
    window.localStorage.setItem(ONBOARDING_MODULES_KEY, JSON.stringify(onboardingModules));
    window.localStorage.setItem(RECENT_MEDIA_MODULES_KEY, JSON.stringify(recentMediaModules));
    window.localStorage.setItem(ACTIVITY_MODULES_KEY, JSON.stringify(activityModules));
    setCustomizeOpen(false);
  };

  const visibleQuickActions = quickActions.filter((a) => a.visible);
  const isOnboardingVisible = onboardingModules.find((m) => m.id === "get-started")?.visible ?? false;
  const visibleRecentMediaModules = recentMediaModules.filter((m) => m.visible);

  // Group visible activity modules into layout blocks. Modules in
  // COMPACT_ACTIVITY_MODULES pair up side-by-side: each consecutive run of
  // them chunks into rows of two, and an odd one out takes the full row.
  // Everything else (Recent Activity) always renders as its own full-width
  // block, wherever the user places it.
  const activityBlocks: { key: string; ids: string[] }[] = [];
  {
    let pairBuffer: string[] = [];
    const flushPairs = () => {
      for (let i = 0; i < pairBuffer.length; i += 2) {
        const ids = pairBuffer.slice(i, i + 2);
        activityBlocks.push({ key: ids.join("-"), ids });
      }
      pairBuffer = [];
    };
    for (const m of activityModules) {
      if (!m.visible) continue;
      if (COMPACT_ACTIVITY_MODULES.has(m.id)) {
        pairBuffer.push(m.id);
      } else {
        flushPairs();
        activityBlocks.push({ key: m.id, ids: [m.id] });
      }
    }
    flushPairs();
  }

  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : ""}`}>
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}

      <div className="px-6 md:px-9 flex flex-col gap-8">
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-[26px] font-medium text-black tracking-tight">Welcome</h1>
          {visibleQuickActions.length === 0 && (
            <Button variant="primary-outline" onClick={handleOpenCustomize}>
              Customize
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        {visibleQuickActions.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[20px] font-medium text-black tracking-tight">Quick Actions</h2>
                <p className="text-[17px] text-black">Quickly start an upload, create a gallery, or add a user.</p>
              </div>
              <Button variant="primary-outline" onClick={handleOpenCustomize}>
                Customize
              </Button>
            </div>
            <div className="flex gap-6 flex-wrap">
              {visibleQuickActions.map((action) => (
                <button
                  key={action.id}
                  className="flex-shrink-0 flex-grow-0 basis-full sm:basis-[calc(50%-0.75rem)] xl:basis-[calc(33.333%-1rem)] xxl:basis-[clamp(11rem,calc(20%-1.2rem),18rem)] flex items-center gap-3 bg-white border border-gray-300 rounded-full px-6 py-3 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#d5e5fa] text-primary flex-shrink-0">
                    <i className={`bi ${action.icon} text-xl`} />
                  </span>
                  <span className="text-[15px] text-black whitespace-nowrap">{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Get Started with Greenfly */}
        {isOnboardingVisible && (
          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[20px] font-medium text-black tracking-tight">Get Started with Greenfly</h2>
                <p className="text-[17px] text-gray-700">A quick tour of what the platform can do, explore anytime.</p>
              </div>
              <Button
                variant="link"
                className="h-auto p-0 text-[15px]"
                onClick={() => setIsGetStartedExpanded((v) => !v)}
                aria-label={isGetStartedExpanded ? "Collapse Get Started" : "Expand Get Started"}
              >
                <i className={`bi ${isGetStartedExpanded ? "bi-chevron-up" : "bi-chevron-down"} text-lg`} />
              </Button>
            </div>
            {isGetStartedExpanded && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <div className="flex gap-4 overflow-hidden min-w-0 max-w-full w-full">
                  {TOUR_CARDS.map((card, i) => (
                    <button key={i} onClick={onOpenStarterGallery} className={`${i === 0 ? "" : "hidden sm:block "}flex-shrink-0`}>
                      <img src={card.src} alt={card.alt} className={`h-40 ${i === 0 ? "w-auto" : "w-[132px] object-cover"} rounded-xl hover:opacity-90 transition-opacity`} />
                    </button>
                  ))}
                  <button onClick={onOpenStarterGallery} className="hidden sm:block flex-shrink-0 relative">
                    <img src={stTourEleven} alt={`View ${TOUR_REMAINING_COUNT} more tour cards`} className="h-40 w-[132px] object-cover rounded-xl" />
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-white text-[17px] font-medium hover:bg-black/40 transition-colors">
                      + {TOUR_REMAINING_COUNT} more
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Recent Media (Recent Assets / Recent Galleries) */}
        {visibleRecentMediaModules.map((module) => {
          if (module.id === "recent-assets") {
            return (
              <section key={module.id} className="flex flex-col gap-3">
                <SectionHeader title="Recent Assets" onViewAll={() => onViewAll?.("recent-assets")} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {RECENT_ASSETS.map((asset) => (
                    <div key={asset.id} onClick={() => setViewingAssetId(asset.id)}>
                      <AssetCard
                        creatorName={asset.creator}
                        thumbnailUrl={asset.thumbnailUrl}
                        timestamp={getRelativeTime(asset.dateCreated)}
                        duration={asset.duration}
                        onFavorite={() => {
                          // TODO: Implement favorite functionality
                        }}
                        onMoreOptions={() => {
                          // TODO: Implement more options menu
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          if (module.id === "recent-galleries") {
            return (
              <section key={module.id} className="flex flex-col gap-3">
                <SectionHeader title="Recent Galleries" onViewAll={() => onViewAll?.("recent-galleries")} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                  {RECENT_GALLERIES.map((gallery) => (
                    <GalleryCard
                      key={gallery.id}
                      name={gallery.name}
                      assetCount={gallery.assetCount}
                      newAssetCount={100}
                      thumbnailUrl={gallery.thumbnailUrl}
                      isNew
                      isInFolder
                      onFavorite={() => {
                        // TODO: Implement favorite functionality
                      }}
                      onMoreOptions={() => {
                        // TODO: Implement more options menu
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          }
          return null;
        })}

        {/* Recent Portal Activity (Recent Activity / Connect Jobs / Requests) */}
        {activityBlocks.map((block) =>
          block.ids.length === 2 ? (
            <div key={block.key} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {block.ids.map((id) => (
                <div key={id}>{renderActivityModule(id, onViewAll)}</div>
              ))}
            </div>
          ) : (
            <div key={block.key}>{renderActivityModule(block.ids[0], onViewAll)}</div>
          )
        )}
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        open={viewingAssetId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingAssetId(null);
        }}
        asset={viewingAsset}
        currentIndex={viewingAssetIndex}
        totalAssets={RECENT_ASSETS.length}
        onPrevious={() => {
          if (viewingAssetIndex > 0) setViewingAssetId(RECENT_ASSETS[viewingAssetIndex - 1].id);
        }}
        onNext={() => {
          if (viewingAssetIndex < RECENT_ASSETS.length - 1) setViewingAssetId(RECENT_ASSETS[viewingAssetIndex + 1].id);
        }}
      />

      {/* Customize Homepage Drawer */}
      <CustomizeHomeDrawer
        open={customizeOpen}
        onCancel={handleCancelCustomize}
        onSave={handleSaveCustomize}
        quickActions={quickActions}
        onQuickActionsChange={setQuickActions}
        onboardingModules={onboardingModules}
        onOnboardingModulesChange={setOnboardingModules}
        recentMediaModules={recentMediaModules}
        onRecentMediaModulesChange={setRecentMediaModules}
        activityModules={activityModules}
        onActivityModulesChange={setActivityModules}
      />
    </div>
  );
}
