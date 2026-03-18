'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks, useUpdateTask, useCreateTask, useDeleteTask } from '@/lib/queries'
import type { Task, TaskStatus } from '@/types'
import { KanbanCard } from './KanbanCard'
import { Plus } from 'lucide-react'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: '할 일', color: 'bg-slate-100' },
  { id: 'in_progress', label: '진행 중', color: 'bg-orange-50' },
  { id: 'done', label: '완료', color: 'bg-green-50' },
]

interface Props {
  projectId: string
}

export function KanbanBoard({ projectId }: Props) {
  const { data: tasks = [] } = useTasks(projectId)
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const draggedTask = tasks.find(t => t.id === active.id)
    if (!draggedTask) return

    // 다른 컬럼으로 드롭한 경우
    const newStatus = COLUMN_IDS.includes(over.id as TaskStatus)
      ? (over.id as TaskStatus)
      : tasks.find(t => t.id === over.id)?.status

    if (newStatus && newStatus !== draggedTask.status) {
      await updateTask.mutateAsync({
        id: draggedTask.id,
        project_id: projectId,
        status: newStatus,
      })
    }
  }

  async function handleAddTask(status: TaskStatus) {
    if (!newTitle.trim()) {
      setAddingTo(null)
      return
    }

    await createTask.mutateAsync({
      project_id: projectId,
      title: newTitle.trim(),
      status,
      priority: 'medium',
    })
    setNewTitle('')
    setAddingTo(null)
  }

  const COLUMN_IDS: TaskStatus[] = ['todo', 'in_progress', 'done']

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-5 h-full">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} id={col.id} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    col.id === 'todo' ? 'bg-slate-400' :
                    col.id === 'in_progress' ? 'bg-orange-primary' : 'bg-green-500'
                  }`} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-orange-text/70">{col.label}</h3>
                  <span className="text-[10px] font-black bg-white/60 px-2 py-0.5 rounded-full text-orange-text/40">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAddingTo(col.id); setNewTitle('') }}
                  className="p-1 rounded-lg hover:bg-white/60 text-orange-text/30 hover:text-orange-primary transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Column Body */}
              <div className={`flex-1 rounded-3xl p-3 ${col.color} min-h-[200px]`}>
                <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        onDelete={() => deleteTask.mutate({ id: task.id, project_id: projectId })}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Quick Add */}
                {addingTo === col.id ? (
                  <div className="mt-2">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddTask(col.id)
                        if (e.key === 'Escape') setAddingTo(null)
                      }}
                      onBlur={() => handleAddTask(col.id)}
                      className="w-full px-3 py-2 text-sm font-bold bg-white rounded-xl border border-orange-primary/30 focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                      placeholder="태스크 제목 입력..."
                    />
                    <p className="text-[9px] font-bold opacity-40 mt-1 px-1">Enter로 추가, Esc로 취소</p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
