import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { GripVertical } from 'lucide-react';

interface SortableHandleProps {
  index: number;
  itemCount: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  label: string;
  className?: string;
}

export default function SortableHandle({ index, itemCount, onMove, label, className = '' }: SortableHandleProps) {
  const activeIndex = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const stopDragging = (event?: PointerEvent<HTMLButtonElement>) => {
    if (event && pointerId.current !== null && event.currentTarget.hasPointerCapture(pointerId.current)) {
      event.currentTarget.releasePointerCapture(pointerId.current);
    }
    activeIndex.current = null;
    pointerId.current = null;
    setDragging(false);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  };

  const beginDragging = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    activeIndex.current = index;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const moveDragging = (event: PointerEvent<HTMLButtonElement>) => {
    const fromIndex = activeIndex.current;
    if (fromIndex === null) return;
    event.preventDefault();

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-sortable-index]');
    if (!target) return;
    const toIndex = Number(target.dataset.sortableIndex);
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= itemCount || toIndex === fromIndex) return;

    onMove(fromIndex, toIndex);
    activeIndex.current = toIndex;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let target: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') target = index - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = index + 1;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = itemCount - 1;

    if (target === null || target < 0 || target >= itemCount || target === index) return;
    event.preventDefault();
    event.stopPropagation();
    onMove(index, target);
  };

  return (
    <button
      type="button"
      aria-label={`${label}. Glissez pour changer la position. Flèches du clavier pour déplacer.`}
      title="Glisser pour réordonner"
      onPointerDown={beginDragging}
      onPointerMove={moveDragging}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onKeyDown={handleKeyDown}
      className={`touch-none rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${dragging ? 'cursor-grabbing border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'cursor-grab'} ${className}`}
    >
      <GripVertical size={16} />
    </button>
  );
}
