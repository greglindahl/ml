import { Toaster as Sonner, toast } from "sonner";
import "bootstrap-icons/font/bootstrap-icons.css";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Styled per Web Portal Design System — Status Toast (Figma node 18631:2676).
// Tinted surface per variant, 20px status icon, Cerebri Sans heading/body,
// plain close X at top right. Enters from the bottom left of the viewport.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-left"
      closeButton
      className="toaster group"
      style={{ "--width": "400px" } as React.CSSProperties}
      icons={{
        success: <i className="bi bi-check-circle-fill text-[20px] leading-none text-[#00d97e]" />,
        warning: <i className="bi bi-exclamation-circle-fill text-[20px] leading-none text-[#f6c343]" />,
        error: <i className="bi bi-x-circle-fill text-[20px] leading-none text-[#e63757]" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[400px] !items-start gap-2 !rounded-[5px] !border-0 !p-4 !shadow-none font-sans bg-white",
          content: "!ml-0",
          icon: "!m-0 !size-5 shrink-0",
          title: "!text-[17px] !font-semibold !tracking-[-0.17px] !leading-[normal] !text-[#12263f]",
          description: "!text-[15px] !leading-[120%] !tracking-[-0.15px] !text-[#12263f]",
          success: "!bg-[#e5fbf2]",
          warning: "!bg-[#fef9ec]",
          error: "!bg-[#fdeaee]",
          actionButton:
            "!bg-transparent !border !border-solid !border-[#12263f]/25 !text-[#12263f] !rounded-md !h-8 !px-3 !text-[13px] !font-medium hover:!bg-[#12263f]/5 !transition-colors",
          closeButton:
            "!static !order-last !ml-auto !size-[15px] !border-0 !bg-transparent !text-[#6e84a3] hover:!text-[#12263f] [&>svg]:!size-[15px] !transform-none",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
