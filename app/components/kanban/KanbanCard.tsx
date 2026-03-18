'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types'
import { PRIORITY_COLORS } from '@/lib/utils'
import { Trash2, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  task: Task
  isDragging?: boolean
  onDelete?: () => void
}

export function KanbanCard({ task, isDragging, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group p-3 bg-white rounded-2xl shadow-sm border border-white/50 cursor-grab active:cursor-grabbing select-none',
        'hover:shadow-md transition-all',
        (isDragging || isSorting) && 'opacity-50 shadow-xl scale-105',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-orange-text leading-tight flex-1">{task.title}</p>
        {onDelete && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-orange-text/30 transition-all flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-[11px] font-bold opacity-50 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full', PRIORITY_COLORS[task.priority])}>
          {task.priority === 'low' ? '낮음' : task.priority === 'medium' ? '보통' : '높음'}
        </span>

        {task.due_date && (
          <span className="flex items-center gap-1 text-[9px] font-black opacity-40">
            <Calendar size={8} />
            {new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}

        {task.assignee && (
          <span className="flex items-center gap-1 text-[9px] font-black opacity-40">
            <User size={8} />
            {task.assignee.full_name}
          </span>
        )}
      </div>
    </div>
  )
}
