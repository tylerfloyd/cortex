'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

type DeleteItemButtonProps = {
  deleteAction: () => Promise<void>
}

export function DeleteItemButton({ deleteAction }: DeleteItemButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
      >
        Delete item
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center">Are you sure? This cannot be undone.</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteAction()
            })
          }}
        >
          {isPending ? 'Deleting…' : 'Confirm delete'}
        </Button>
      </div>
    </div>
  )
}
