import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsNarrowScreen } from "@/hooks/use-mobile";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ToggleItem {
  id: string;
  label: string;
  visible: boolean;
}

export interface QuickActionItem extends ToggleItem {
  icon: string;
}

interface CustomizeHomeDrawerProps {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  quickActions: QuickActionItem[];
  onQuickActionsChange: (items: QuickActionItem[]) => void;
  onboardingModules: ToggleItem[];
  onOnboardingModulesChange: (items: ToggleItem[]) => void;
  recentMediaModules: ToggleItem[];
  onRecentMediaModulesChange: (items: ToggleItem[]) => void;
  activityModules: ToggleItem[];
  onActivityModulesChange: (items: ToggleItem[]) => void;
}

function SortableRow<T extends ToggleItem>({ item, onToggle }: { item: T; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
        item.visible ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200 opacity-60"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 touch-none flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <i className="bi bi-grip-vertical" />
      </button>
      <span className={`flex-1 text-[15px] font-medium ${item.visible ? "text-gray-700" : "text-gray-500"}`}>
        {item.label}
      </span>
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ${
          item.visible ? "text-primary" : "text-gray-500"
        }`}
        aria-label={item.visible ? "Hide" : "Show"}
      >
        <i className={`bi ${item.visible ? "bi-eye" : "bi-eye-slash"}`} />
      </button>
    </div>
  );
}

function SortableGroup<T extends ToggleItem>({
  title,
  description,
  items,
  onChange,
}: {
  title: string;
  description?: string;
  items: T[];
  onChange: (items: T[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const toggleItem = (id: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i)));
  };

  return (
    <section>
      <h3 className="text-[13px] font-semibold text-black uppercase tracking-wide mb-1">{title}</h3>
      {description && <p className="text-[13px] text-gray-600 mb-3">{description}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function CustomizeGroups({
  quickActions,
  onQuickActionsChange,
  onboardingModules,
  onOnboardingModulesChange,
  recentMediaModules,
  onRecentMediaModulesChange,
  activityModules,
  onActivityModulesChange,
}: Omit<CustomizeHomeDrawerProps, "open" | "onCancel" | "onSave">) {
  return (
    <>
      <SortableGroup
        title="Quick Actions"
        description="Drag to reorder or toggle visibility."
        items={quickActions}
        onChange={onQuickActionsChange}
      />
      <hr className="border-gray-300" />
      <SortableGroup title="Onboarding" items={onboardingModules} onChange={onOnboardingModulesChange} />
      <hr className="border-gray-300" />
      <SortableGroup title="Recent Media" items={recentMediaModules} onChange={onRecentMediaModulesChange} />
      <hr className="border-gray-300" />
      <SortableGroup title="Recent Portal Activity" items={activityModules} onChange={onActivityModulesChange} />
    </>
  );
}

export function CustomizeHomeDrawer(props: CustomizeHomeDrawerProps) {
  const { open, onCancel, onSave } = props;
  const isNarrow = useIsNarrowScreen();

  // Below ~425px a right-side drawer is essentially full-width anyway, just
  // awkwardly anchored — a bottom sheet (matching the Library page's Filters
  // pattern) is the more natural mobile gesture here.
  if (isNarrow) {
    return (
      <Sheet open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[700px] flex flex-col p-0 rounded-t-lg">
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <i className="bi bi-sliders text-lg" />
              <SheetTitle className="text-base font-semibold">Customize Homepage</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <CustomizeGroups {...props} />
          </div>

          <div className="flex-shrink-0 border-t px-4 py-3 flex items-center gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={onSave}>
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onCancel} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between bg-gray-100 flex-shrink-0">
          <h2 className="text-[17px] font-semibold text-black">Customize Homepage</h2>
          <button onClick={onCancel} className="text-gray-600 hover:text-black transition-colors" aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <CustomizeGroups {...props} />
        </div>

        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-end gap-3 flex-shrink-0">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </>
  );
}
