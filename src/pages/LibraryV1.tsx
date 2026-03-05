import { useState, useCallback, useEffect } from "react";
import { LeftNav, Screen } from "@/components/LeftNav";
import { LibraryScreen } from "@/components/LibraryScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";

const LibraryV1 = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
    if (screen === "library") {
      // Stay on current variation
      return;
    }
    // Navigate to main app for other screens
    navigate("/");
  }, [navigate]);

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

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
        activeScreen="library"
        onToggle={handleToggleNav}
        onNavigate={handleNavigate}
        isMobile={isMobile}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={handleCloseMobileNav}
      />
      <LibraryScreen isMobile={isMobile} />
    </div>
  );
};

export default LibraryV1;
