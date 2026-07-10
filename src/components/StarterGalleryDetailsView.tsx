import "bootstrap-icons/font/bootstrap-icons.css";
import { AssetCard } from "@/components/AssetCard";
import starterAsset1 from "@/assets/starter-gallery/1.svg";
import starterAsset2 from "@/assets/starter-gallery/2.svg";
import starterAsset3 from "@/assets/starter-gallery/3.svg";
import starterAsset4 from "@/assets/starter-gallery/4.svg";
import starterAsset5 from "@/assets/starter-gallery/5.svg";
import starterAsset6 from "@/assets/starter-gallery/6.svg";
import starterAsset7 from "@/assets/starter-gallery/7.svg";
import starterAsset8 from "@/assets/starter-gallery/8.svg";
import starterAsset9 from "@/assets/starter-gallery/9.svg";
import starterAsset10 from "@/assets/starter-gallery/10.svg";
import starterAsset11 from "@/assets/starter-gallery/11.svg";
import starterAsset12 from "@/assets/starter-gallery/12.svg";
import starterAsset13 from "@/assets/starter-gallery/13.svg";
import starterAsset14 from "@/assets/starter-gallery/14.svg";
import starterAsset15 from "@/assets/starter-gallery/15.svg";
import starterAsset19 from "@/assets/starter-gallery/19.svg";
import starterAsset20 from "@/assets/starter-gallery/20.svg";
import starterAsset21 from "@/assets/starter-gallery/21.svg";

interface StarterGalleryDetailsViewProps {
  onBack: () => void;
  isMobile?: boolean;
}

const STARTER_ASSETS = [
  starterAsset1, starterAsset2, starterAsset3, starterAsset4, starterAsset5,
  starterAsset6, starterAsset7, starterAsset8, starterAsset9, starterAsset10,
  starterAsset11, starterAsset12, starterAsset13, starterAsset14, starterAsset15,
  starterAsset19, starterAsset20, starterAsset21,
].map((thumbnailUrl, i) => ({ id: `starter-gallery-asset-${i + 1}`, thumbnailUrl }));

export function StarterGalleryDetailsView({ onBack, isMobile = false }: StarterGalleryDetailsViewProps) {
  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full overflow-y-auto px-6 md:px-9 pb-12 ${isMobile ? "pt-[58px]" : ""}`}>
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
      >
        <i className="bi bi-arrow-left w-4 h-4 inline-flex items-center justify-center leading-none" />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-[82px] h-[82px] rounded-lg overflow-hidden flex-shrink-0 bg-black">
          <img src={STARTER_ASSETS[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-[26px] font-semibold text-foreground mb-1">Starter Gallery</h1>
          <p className="text-sm text-muted-foreground">
            {STARTER_ASSETS.length} assets · A quick tour of what the platform can do
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
        {STARTER_ASSETS.map((asset) => (
          <AssetCard
            key={asset.id}
            creatorName="Greenfly"
            timestamp="Starter content"
            thumbnailUrl={asset.thumbnailUrl}
          />
        ))}
      </div>
    </div>
  );
}
