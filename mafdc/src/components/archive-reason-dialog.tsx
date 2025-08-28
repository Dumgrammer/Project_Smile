"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { IconAlertTriangle, IconArchive, IconLoader } from "@tabler/icons-react"

interface ArchiveReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
  patientName?: string
  patientCount?: number
  isArchiving?: boolean
  loading?: boolean
}

export function ArchiveReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
  patientCount,
  isArchiving = true,
  loading = false
}: ArchiveReasonDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (isArchiving && (!reason || reason.trim() === "")) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(reason.trim())
      setReason("")
      onOpenChange(false)
    } catch (error) {
      console.error('Error in archive action:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setReason("")
    onOpenChange(false)
  }

  const isDisabled = isArchiving && (!reason || reason.trim() === "")
  const actionText = isArchiving ? "Archive" : "Restore"
  const actionColor = isArchiving ? "text-red-600" : "text-green-600"
  
  const getTitle = () => {
    if (patientCount && patientCount > 1) {
      return `${actionText} ${patientCount} Patients`
    }
    return `${actionText} Patient${patientName ? `: ${patientName}` : ""}`
  }

  const getDescription = () => {
    if (patientCount && patientCount > 1) {
      return `Are you sure you want to ${actionText.toLowerCase()} ${patientCount} selected patients?`
    }
    return `Are you sure you want to ${actionText.toLowerCase()} ${patientName ? `${patientName}` : "this patient"}?`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className={`h-5 w-5 ${actionColor}`} />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
            {isArchiving && " Please provide a reason for archiving."}
          </DialogDescription>
        </DialogHeader>
        
                 <div className="grid gap-4 py-2 sm:py-4">
           <div className="grid gap-2">
             <Label htmlFor="reason" className="text-sm font-medium">
               {isArchiving ? "Archive Reason *" : "Restore Reason (Optional)"}
             </Label>
             <Textarea
               id="reason"
               placeholder={
                 isArchiving 
                   ? "Please explain why you're archiving this patient..." 
                   : "Optional: Explain why you're restoring this patient..."
               }
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               className="min-h-[80px] sm:min-h-[100px] resize-none"
               disabled={isSubmitting || loading}
             />
            {isArchiving && (
              <p className="text-xs text-muted-foreground">
                This reason will be logged for audit purposes.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isSubmitting || loading}
          >
            Cancel
          </Button>
          <Button
            className={`flex-1 ${isArchiving ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            onClick={handleConfirm}
            disabled={isDisabled || isSubmitting || loading}
          >
            {(isSubmitting || loading) && (
              <IconLoader className="mr-2 h-4 w-4 animate-spin" />
            )}
            <IconArchive className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
