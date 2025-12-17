'use client'

import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stub implementation - react-resizable-panels API mismatch
// This component is not currently used in the application

const ResizablePanelGroup = ({ className, children, ...props }: any) => (
  <div
    className={cn('flex h-full w-full flex-row', className)}
    {...props}
  >
    {children}
  </div>
)

const ResizablePanel = ({ className, children, ...props }: any) => (
  <div
    className={cn('flex-1', className)}
    {...props}
  >
    {children}
  </div>
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: any) => (
  <div
    className={cn(
      'relative flex w-px items-center justify-center bg-border',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
