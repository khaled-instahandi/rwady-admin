"use client"

import type React from "react"
import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableItemProps {
  id: string
  children: React.ReactNode
  className?: string
}

function SortableItem({ id, children, className }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-50 opacity-50", className)}
      {...attributes}
    >
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="pl-8">{children}</div>
    </div>
  )
}

interface SortableListProps {
  items: Array<{ id: string;[key: string]: any }>
  onReorder: (items: Array<{ id: string;[key: string]: any }>) => void
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
}

export function SortableList({ items, onReorder, renderItem, className }: SortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragStart(event: any) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      const targetorder = items[newIndex].position || 0
      console.log("items", items);

      console.log(`Reordering from index ${oldIndex} to index ${newIndex} with target order ${targetorder}`);

      const newItems = arrayMove(items, oldIndex, targetorder)
      onReorder(newItems)
    }

    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
