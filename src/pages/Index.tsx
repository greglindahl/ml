import { useState, useCallback, useEffect } from "react";
import { LeftNav, Screen } from "@/components/LeftNav";
import { ContentScreen } from "@/components/ContentScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LEFT_NAV_EXPANDED_KEY = "leftNavExpanded";

const Index = () => {
  const isMobile = useIsMobile();
  // Hydrate from localStorage on first render so the user's preference
  // (expanded/collapsed) survives reloads. Defaults to collapsed.
  const [isNavExpanded, setIsNavExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LEFT_NAV_EXPANDED_KEY) === "true";
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  // Folder/gallery id for Library to open on its next mount (e.g. deep-linked from Home).
  // Cleared right after Library mounts — LibraryScreen only reads it once, as a useState initializer.
  const [pendingLibraryFolderId, setPendingLibraryFolderId] = useState<string | null>(null);

  // Persist the desktop nav expanded/collapsed preference across sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEFT_NAV_EXPANDED_KEY, String(isNavExpanded));
  }, [isNavExpanded]);

  // Close mobile nav when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileNavOpen(false);
    }
  }, [isMobile]);

  const handleToggleNav = useCallback(() => {
    if (isMobile) {
      setIsMobileNavOpen((prev) => !prev);
    } else {
      setIsNavExpanded((prev) => !prev);
    }
  }, [isMobile]);

  const handleNavigate = useCallback((screen: Screen) => {
    setActiveScreen(screen);
    // Close mobile nav on navigation
    if (isMobile) {
      setIsMobileNavOpen(false);
    }
  }, [isMobile]);

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const handleOpenStarterGallery = useCallback(() => {
    setPendingLibraryFolderId("starter-gallery");
    setActiveScreen("library");
  }, []);

  // Consume the pending id once Library has mounted with it.
  useEffect(() => {
    if (pendingLibraryFolderId) {
      setPendingLibraryFolderId(null);
    }
  }, [pendingLibraryFolderId]);

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b flex items-center px-4 z-40">
          <button
            onClick={handleToggleNav}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={handleCloseMobileNav}
        />
      )}

      <LeftNav
        isExpanded={isMobile ? true : isNavExpanded}
        activeScreen={activeScreen}
        onToggle={handleToggleNav}
        onNavigate={handleNavigate}
        isMobile={isMobile}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={handleCloseMobileNav}
      />
      <ContentScreen
        screen={activeScreen}
        isMobile={isMobile}
        initialLibraryFolderId={pendingLibraryFolderId ?? undefined}
        onOpenStarterGallery={handleOpenStarterGallery}
      />
    </div>
  );
};

export default Index;
