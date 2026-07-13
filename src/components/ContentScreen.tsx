import "bootstrap-icons/font/bootstrap-icons.css";
import { Screen } from "./LeftNav";
import { HomeScreen, HomeViewAllTarget } from "./HomeScreen";
import { LibraryScreen } from "./LibraryScreen";
import { EngageScreen } from "./EngageScreen";
import { ConnectScreen } from "./ConnectScreen";
import { RequestsScreen } from "./RequestsScreen";
import { StatsScreen } from "./StatsScreen";
import { AdminScreen } from "./AdminScreen";

interface ContentScreenProps {
  screen: Screen;
  isMobile?: boolean;
  /** Gallery/folder id Library should open on mount (e.g. the Starter Gallery deep-linked from Home). */
  initialLibraryFolderId?: string;
  /** Tab Library should open on mount (e.g. "galleries" via Home's View All). */
  initialLibraryTab?: string;
  /** Tab Insights should open on mount (e.g. "activity" via Home's View All). */
  initialStatsTab?: string;
  onOpenStarterGallery?: () => void;
  onViewAll?: (target: HomeViewAllTarget) => void;
}

export function ContentScreen({ screen, isMobile = false, initialLibraryFolderId, initialLibraryTab, initialStatsTab, onOpenStarterGallery, onViewAll }: ContentScreenProps) {
  // Home has its own dedicated screen
  if (screen === "home") {
    return <HomeScreen isMobile={isMobile} onOpenStarterGallery={onOpenStarterGallery} onViewAll={onViewAll} />;
  }

  // Library has its own dedicated screen with secondary nav
  if (screen === "library") {
    return <LibraryScreen isMobile={isMobile} initialActiveFolder={initialLibraryFolderId} initialActiveTab={initialLibraryTab} />;
  }

  // Engage has its own dedicated screen with tabs
  if (screen === "engage") {
    return <EngageScreen isMobile={isMobile} />;
  }

  // Connect has its own dedicated screen with tabs
  if (screen === "connect") {
    return <ConnectScreen isMobile={isMobile} />;
  }

  // Requests has its own dedicated screen with tabs
  if (screen === "requests") {
    return <RequestsScreen isMobile={isMobile} />;
  }

  // Stats has its own dedicated screen with tabs
  if (screen === "stats") {
    return <StatsScreen isMobile={isMobile} initialTab={initialStatsTab} />;
  }

  // Network has its own dedicated screen with tabs
  if (screen === "network") {
    return <AdminScreen isMobile={isMobile} />;
  }

  const exhaustiveCheck: never = screen;
  throw new Error(`Unhandled screen: ${exhaustiveCheck}`);
}
