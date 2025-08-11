"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, Check, Loader2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface CategoryTreeProps {
  categories: Category[]
  selectedId?: number
  onSelect: (category: Category) => void
  onToggleCollapse: (categoryId: number) => void
  collapsedIds: Set<number>
  loading?: boolean
  onReorder?: (categoryId: number, targetOrder: number) => Promise<void>
  reorderingId?: number | null
}

interface CategoryNodeProps {
  category: Category
  level: number
  isSelected: boolean
  isCollapsed: boolean
  onSelect: (category: Category) => void
  onToggleCollapse: (categoryId: number) => void
  selectedId?: number
  collapsedIds: Set<number>
  enableReorder?: boolean
  dragAttributes?: any
  dragListeners?: any
}

interface SortableCategoryProps {
  category: Category
  level: number
  isSelected: boolean
  isCollapsed: boolean
  onSelect: (category: Category) => void
  onToggleCollapse: (categoryId: number) => void
  selectedId?: number
  collapsedIds: Set<number>
  enableReorder?: boolean
}

function SortableCategory({
  category,
  level,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleCollapse,
  selectedId,
  collapsedIds,
  enableReorder = true,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-blue-50 border border-blue-200 rounded-md p-2"
      >
        <CategoryNode
          category={category}
          level={level}
          isSelected={isSelected}
          isCollapsed={isCollapsed}
          onSelect={onSelect}
          onToggleCollapse={onToggleCollapse}
          selectedId={selectedId}
          collapsedIds={collapsedIds}
          enableReorder={true}
        />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryNode
        category={category}
        level={level}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onSelect={onSelect}
        onToggleCollapse={onToggleCollapse}
        selectedId={selectedId}
        collapsedIds={collapsedIds}
        enableReorder={true}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}

function CategoryNode({
  category,
  level,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleCollapse,
  selectedId,
  collapsedIds,
  enableReorder = false,
  dragAttributes,
  dragListeners,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const paddingLeft = level * 16
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div>
      <motion.div
        className={cn(
          "flex items-center py-2 px-2 cursor-pointer rounded-md transition-colors",
          isSelected ? "bg-blue-100 border-l-2 border-blue-500 text-blue-700" : "hover:bg-gray-100",
        )}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={() => onSelect(category)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
      >
        {/* Drag Handle */}
        {enableReorder && (isHovered || isSelected) && (
          <div 
            {...dragAttributes} 
            {...dragListeners}
            className="mr-2 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-200 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {hasChildren ? (
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(category.id)
            }}
            className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </motion.button>
        ) : (
          <div className="w-5 mr-1" />
        )}

        {hasChildren ? (
          isCollapsed ? (
            <Folder className="h-4 w-4 text-blue-600 mr-2" />
          ) : (
            <FolderOpen className="h-4 w-4 text-blue-600 mr-2" />
          )
        ) : (
          <div className="w-4 h-4 bg-blue-600 rounded-sm mr-2" />
        )}

        <span className="text-sm truncate flex-1">{category.name.ar || category.name.en || "Unnamed Category"}</span>

        {category.orders !== undefined && enableReorder && (
          <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full font-medium">
            #{category.orders}
          </span>
        )}

        {category.products_count !== null && (
          <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {category.products_count}
          </span>
        )}

        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2 bg-blue-500 rounded-full p-0.5"
          >
            <Check className="h-3 w-3 text-white" />
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {enableReorder ? (
              <SortableContext items={category.children!.map(c => c.id.toString())} strategy={verticalListSortingStrategy}>
                {category.children!.map((child) => (
                  <SortableCategory
                    key={child.id}
                    category={child}
                    level={level + 1}
                    isSelected={child.id === selectedId}
                    isCollapsed={collapsedIds.has(child.id)}
                    onSelect={onSelect}
                    onToggleCollapse={onToggleCollapse}
                    selectedId={selectedId}
                    collapsedIds={collapsedIds}
                    enableReorder={true}
                  />
                ))}
              </SortableContext>
            ) : (
              category.children!.map((child) => (
                <CategoryNode
                  key={child.id}
                  category={child}
                  level={level + 1}
                  isSelected={child.id === selectedId}
                  isCollapsed={collapsedIds.has(child.id)}
                  onSelect={onSelect}
                  onToggleCollapse={onToggleCollapse}
                  selectedId={selectedId}
                  collapsedIds={collapsedIds}
                  enableReorder={false}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onToggleCollapse = () => {},
  collapsedIds = new Set(),
  loading = false,
  onReorder,
  reorderingId,
}: CategoryTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Build tree structure
  const buildTree = (cats: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>()
    const rootCategories: Category[] = []

    // First pass: create map of all categories
    cats.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree structure
    cats.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!
        parent.children!.push(category)
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const treeData = buildTree(categories)
  
  // Only show root level categories for reordering (same parent level)
  const rootCategories = categories.filter(cat => !cat.parent_id)
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id || !onReorder) {
      return
    }

    const activeCategory = findCategoryInTree(rootCategories, active.id as string)
    const overCategory = findCategoryInTree(rootCategories, over.id as string)

    if (!activeCategory || !overCategory) {
      return
    }

    // Get the target order from the category we're dropping over
    const targetOrder = overCategory.orders || 0

    try {
      await onReorder(activeCategory.id, targetOrder)
    } catch (error) {
      console.error('Failed to reorder category:', error)
    }
  }

  // Helper function to find category in tree (including children)
  const findCategoryInTree = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id.toString() === id) {
        return cat
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryInTree(cat.children, id)
        if (found) return found
      }
    }
    return null
  }

  const activeCategory = activeId ? findCategoryInTree(rootCategories, activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
          <span className="text-sm text-gray-600">Loading categories...</span>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p>No categories found</p>
        <p className="text-sm">Create your first category to get started</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rootCategories.map(cat => cat.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {rootCategories.map((category) => (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <div>
                    {onReorder ? (
                      <SortableCategory
                        category={category}
                        level={0}
                        isSelected={category.id === selectedId}
                        isCollapsed={collapsedIds.has(category.id)}
                        onSelect={onSelect}
                        onToggleCollapse={onToggleCollapse}
                        selectedId={selectedId}
                        collapsedIds={collapsedIds}
                        enableReorder={true}
                      />
                    ) : (
                      <CategoryNode
                        category={category}
                        level={0}
                        isSelected={category.id === selectedId}
                        isCollapsed={collapsedIds.has(category.id)}
                        onSelect={onSelect}
                        onToggleCollapse={onToggleCollapse}
                        selectedId={selectedId}
                        collapsedIds={collapsedIds}
                        enableReorder={false}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div>
                    <div className="font-medium">{category.name.ar || category.name.en}</div>
                    {category.products_count !== null && (
                      <div className="text-xs text-gray-500">Products: {category.products_count}</div>
                    )}
                    {onReorder && category.orders !== undefined && (
                      <div className="text-xs text-blue-600">Order: {category.orders}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCategory ? (
            <div className="bg-white border border-blue-200 rounded-md shadow-lg p-2 opacity-90">
              <CategoryNode
                category={activeCategory}
                level={0}
                isSelected={false}
                isCollapsed={false}
                onSelect={() => {}}
                onToggleCollapse={() => {}}
                selectedId={selectedId}
                collapsedIds={new Set()}
                enableReorder={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  )
}
