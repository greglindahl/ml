import "bootstrap-icons/font/bootstrap-icons.css";
import { Link } from "react-router-dom";
import { Screen } from "./LeftNav";
import { LibraryScreen } from "./LibraryScreen";
import { EngageScreen } from "./EngageScreen";
import { ConnectScreen } from "./ConnectScreen";
import { RequestsScreen } from "./RequestsScreen";
import { StatsScreen } from "./StatsScreen";
import { AdminScreen } from "./AdminScreen";
import { Button } from "./ui/button";

interface ContentScreenProps {
  screen: Screen;
  history: Screen[];
  onBack: () => void;
  isMobile?: boolean;
}

const screenTitles: Record<Screen, string> = {
  home: "Home",
  library: "Library",
  network: "Network",
  connect: "Connect",
  engage: "Engage",
  requests: "Requests",
  stats: "Insights",
};

const screenDescriptions: Record<Screen, string> = {
  home: "Dashboard overview and quick actions",
  library: "Your content library and media files",
  network: "Manage your network and members",
  connect: "Integrations and connected services",
  engage: "Customer engagement and conversations",
  requests: "Content requests and campaigns",
  stats: "Analytics and performance metrics",
};

export function ContentScreen({ screen, history, onBack, isMobile = false }: ContentScreenProps) {
  const canGoBack = history.length > 1;

  // Library has its own dedicated screen with secondary nav
  if (screen === "library") {
    return <LibraryScreen isMobile={isMobile} />;
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

  return (
    <div className={`flex-1 bg-background px-4 md:px-8 xl:px-16 pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Back button */}
      {canGoBack && screen !== "home" && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <i className="bi bi-arrow-left w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Lo-fi content placeholder */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 max-w-2xl">
        <div className="space-y-4">
          {/* Title placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded" />
            <div>
              <h1 className="text-xl font-medium">{screenTitles[screen]}</h1>
              <p className="text-sm text-muted-foreground">
                {screenDescriptions[screen]}
              </p>
            </div>
          </div>

          {/* Content placeholders */}
          <div className="pt-6 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>

          {/* Card placeholders */}
          <div className="pt-6 grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded border" />
            <div className="h-24 bg-muted rounded border" />
            <div className="h-24 bg-muted rounded border" />
            <div className="h-24 bg-muted rounded border" />
          </div>

          {/* Action placeholder */}
          <div className="pt-6 flex gap-3">
            <div className="h-9 w-24 bg-muted rounded border" />
            <div className="h-9 w-24 bg-muted/50 rounded border border-dashed" />
          </div>

          {/* Dev Spec link - hidden for now */}
          {/* {screen === "home" && (
            <div className="pt-8 border-t border-border mt-8">
              <Link to="/dev-spec">
                <Button variant="outline" className="gap-2">
                  <FileCode className="w-4 h-4" />
                  View Developer Spec
                </Button>
              </Link>
            </div>
          )} */}
        </div>
      </div>

      {/* Screen indicator - hidden for now */}
      {/* <div className="mt-8 text-xs text-muted-foreground">
        Current screen: <span className="font-mono">{screen}</span>
        {history.length > 1 && (
          <span className="ml-4">
            History: {history.map((s) => screenTitles[s]).join(" → ")}
          </span>
        )}
      </div> */}
    </div>
  );
}
