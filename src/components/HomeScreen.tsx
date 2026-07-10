import { ReactNode } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AssetCard } from "@/components/AssetCard";
import { GalleryCard } from "@/components/GalleryCard";
import stGalleryCard from "@/assets/st-gallery-card.svg";
import stAssetOne from "@/assets/st-asset-one.svg";
import stAssetTwo from "@/assets/st-asset-two.svg";
import stAssetThree from "@/assets/st-asset-three.svg";

interface HomeScreenProps {
  isMobile?: boolean;
  onOpenStarterGallery?: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "upload", label: "Upload", icon: "bi-cloud-upload" },
  { id: "new-gallery", label: "New Gallery", icon: "bi-images" },
  { id: "add-user", label: "Add User", icon: "bi-person-plus" },
  { id: "uploads", label: "Uploads", icon: "bi-cloud-arrow-up" },
  { id: "favorites", label: "Favorites", icon: "bi-heart" },
];

interface RecentAsset {
  id: string;
  creatorName: string;
  thumbnailUrl: string;
  timestamp: string;
  duration?: string;
  isNew?: boolean;
  isRequested?: boolean;
}

const RECENT_ASSETS: RecentAsset[] = [
  { id: "home-asset-1", creatorName: "Amber Johnson", thumbnailUrl: "https://picsum.photos/seed/home-asset-1/400/300", timestamp: "1/14/26, 1:56 PM", duration: "0:05", isNew: true, isRequested: true },
  { id: "home-asset-2", creatorName: "David Chen", thumbnailUrl: "https://picsum.photos/seed/home-asset-2/400/300", timestamp: "1/14/26, 1:56 PM", duration: "0:05", isNew: true, isRequested: true },
  { id: "home-asset-3", creatorName: "Emma Rodriguez", thumbnailUrl: "https://picsum.photos/seed/home-asset-3/400/300", timestamp: "1/14/26, 1:56 PM", duration: "0:05", isNew: true, isRequested: true },
  { id: "home-asset-4", creatorName: "Marcus Thompson", thumbnailUrl: "https://picsum.photos/seed/home-asset-4/400/300", timestamp: "1/14/26, 1:56 PM", duration: "0:05", isNew: true, isRequested: true },
  { id: "home-asset-5", creatorName: "Olivia Park", thumbnailUrl: "https://picsum.photos/seed/home-asset-5/400/300", timestamp: "1/14/26, 1:56 PM", duration: "0:05", isNew: true, isRequested: true },
];

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
];

interface ActivityItem {
  id: string;
  iconBg: string;
  icon: string;
  description: ReactNode;
  date: string;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "activity-1",
    iconBg: "#fcedc4",
    icon: "bi-megaphone-fill",
    description: <>Amber Johnson (Admin) created an Announcement &quot;ANOTHER TEST!!!&quot; that was sent to 1 user</>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-2",
    iconBg: "#f9c1cc",
    icon: "bi-people-fill",
    description: <>User: 49654 joined Sportgeeks with invite code <a href="#" className="underline">SPORTGEEKS123</a></>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-3",
    iconBg: "#c1d6f3",
    icon: "bi-images",
    description: <>Tell Vickers (Admin) created gallery <a href="#" className="underline">tell create upload gallery</a></>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-4",
    iconBg: "#e3cbe9",
    icon: "bi-send-fill",
    description: <>Greg Lindahl TestAdmin sent a post to social request <a href="#" className="underline">Schedule Badge</a> to 1 user</>,
    date: "03/15/2025, 2:30 PM",
  },
  {
    id: "activity-5",
    iconBg: "#c1d6f3",
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

function SectionHeader({ title, size = "lg" }: { title: string; size?: "lg" | "md" }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={size === "lg" ? "text-[20px] font-medium text-black tracking-tight" : "text-[15px] font-medium text-black tracking-tight"}>
        {title}
      </h2>
      <Button variant="link" className="h-auto p-0 text-[15px]">
        View All
      </Button>
    </div>
  );
}

function ActivityCard({ title, icon, iconBg, children }: { title: string; icon: string; iconBg: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: iconBg }}>
            <i className={`bi ${icon} text-primary text-lg`} />
          </span>
          <h2 className="text-[20px] font-medium text-black tracking-tight">{title}</h2>
        </div>
        <Button variant="link" className="h-auto p-0 text-[15px]">
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
              <i className={`bi ${item.icon} text-primary text-sm`} />
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

function TwoLineTable({ items, columnLabel, dateLabel, iconBg }: { items: TwoLineItem[]; columnLabel: string; dateLabel: string; iconBg: string }) {
  return (
    <div className="w-full">
      <div className="flex bg-gray-100 border border-gray-300 rounded-t-lg h-12">
        <div className="flex-1 flex items-center px-6">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{columnLabel}</span>
        </div>
        <div className="w-[180px] flex items-center px-6">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{dateLabel}</span>
        </div>
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 border-b border-l border-r border-gray-300 bg-white px-6 py-[17px] ${i === items.length - 1 ? "rounded-b-lg" : ""}`}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: iconBg }}>
            <i className={`bi ${item.icon} text-primary text-sm`} />
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

export function HomeScreen({ isMobile = false, onOpenStarterGallery }: HomeScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : ""}`}>
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}

      <div className="px-6 md:px-9 flex flex-col gap-8">
        <h1 className="text-[26px] font-medium text-black tracking-tight">Welcome</h1>

        {/* Quick Actions */}
        <section className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[20px] font-medium text-black tracking-tight">Quick Actions</h2>
              <p className="text-[17px] text-black">Quickly start an upload, create a gallery, or add a user.</p>
            </div>
            <Button
              variant="primary-outline"
              onClick={() => {
                // TODO: Open the customize homepage panel
              }}
            >
              Customize
            </Button>
          </div>
          <div className="flex gap-6 flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                className="flex-1 min-w-[180px] flex items-center gap-3 bg-white border border-gray-300 rounded-full px-6 py-3 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#d5e5fa] text-primary flex-shrink-0">
                  <i className={`bi ${action.icon} text-xl`} />
                </span>
                <span className="text-[15px] text-black whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Get Started with Greenfly */}
        <Accordion type="single" collapsible defaultValue="get-started" className="bg-white border border-gray-300 rounded-lg">
          <AccordionItem value="get-started" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:text-primary">
              <span className="flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#d5e5fa] flex-shrink-0">
                  <i className="bi bi-rocket-takeoff text-primary text-lg" />
                </span>
                <span className="text-[20px] font-medium text-black tracking-tight">Get Started with Greenfly</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-[280px] flex flex-col gap-2">
                  <p className="text-[15px] text-gray-700 leading-snug">
                    A quick tour of what the platform can do, explore anytime.
                  </p>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                  <button onClick={onOpenStarterGallery} className="flex-shrink-0">
                    <img src={stGalleryCard} alt="Welcome to Greenfly" className="h-40 w-auto rounded-xl hover:opacity-90 transition-opacity" />
                  </button>
                  <img src={stAssetOne} alt="Everyone is in the play" className="h-40 w-auto rounded-xl flex-shrink-0" />
                  <img src={stAssetTwo} alt="Collect content from every source" className="h-40 w-auto rounded-xl flex-shrink-0" />
                  <img src={stAssetThree} alt="Organize your content, view 14 more tour cards" className="h-40 w-auto rounded-xl flex-shrink-0" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Recent Assets */}
        <section className="flex flex-col gap-3">
          <SectionHeader title="Recent Assets" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
            {RECENT_ASSETS.map((asset) => (
              <AssetCard
                key={asset.id}
                creatorName={asset.creatorName}
                thumbnailUrl={asset.thumbnailUrl}
                timestamp={asset.timestamp}
                duration={asset.duration}
                isNew={asset.isNew}
                isRequested={asset.isRequested}
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

        {/* Recent Galleries */}
        <section className="flex flex-col gap-3">
          <SectionHeader title="Recent Galleries" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
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

        {/* Recent Activity */}
        <ActivityCard title="Recent Activity" icon="bi-activity" iconBg="#d5e5fa">
          <ActivityTable items={RECENT_ACTIVITY} />
        </ActivityCard>

        {/* Recent Connect Jobs + Recent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityCard title="Recent Connect Jobs" icon="bi-gear" iconBg="#d7eff6">
            <TwoLineTable items={CONNECT_JOBS} columnLabel="Activity" dateLabel="Date" iconBg="#d7eff6" />
          </ActivityCard>
          <ActivityCard title="Recent Requests" icon="bi-camera" iconBg="#e3cbe9">
            <TwoLineTable items={RECENT_REQUESTS} columnLabel="Request" dateLabel="Last Updated Date" iconBg="#e3cbe9" />
          </ActivityCard>
        </div>
      </div>
    </div>
  );
}
