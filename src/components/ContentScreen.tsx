import "bootstrap-icons/font/bootstrap-icons.css";
import { Screen } from "./LeftNav";
import { HomeScreen } from "./HomeScreen";
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
  onOpenStarterGallery?: () => void;
}

export function ContentScreen({ screen, isMobile = false, initialLibraryFolderId, onOpenStarterGallery }: ContentScreenProps) {
  // Home has its own dedicated screen
  if (screen === "home") {
    return <HomeScreen isMobile={isMobile} onOpenStarterGallery={onOpenStarterGallery} />;
  }

  // Library has its own dedicated screen with secondary nav
  if (screen === "library") {
    return <LibraryScreen isMobile={isMobile} initialActiveFolder={initialLibraryFolderId} />;
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
    return <StatsScreen isMobile={isMobile} />;
  }

  // Network has its own dedicated screen with tabs
  if (screen === "network") {
    return <AdminScreen isMobile={isMobile} />;
  }

  const exhaustiveCheck: never = screen;
  throw new Error(`Unhandled screen: ${exhaustiveCheck}`);
}
