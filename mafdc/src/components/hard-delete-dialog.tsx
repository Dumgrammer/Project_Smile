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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconAlertTriangle, IconTrash, IconLoader, IconSkull } from "@tabler/icons-react"

interface HardDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  patientName: string
  loading?: boolean
}

export function HardDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
  loading = false
}: HardDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const expectedText = "DELETE PERMANENTLY"
  const isConfirmValid = confirmText === expectedText

  const handleConfirm = async () => {
    if (!isConfirmValid) return

    setIsSubmitting(true)
    try {
      await onConfirm()
      setConfirmText("")
      onOpenChange(false)
    } catch (error) {
      console.error('Error in hard delete:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setConfirmText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-red-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <IconSkull className="h-6 w-6 text-red-600" />
            Permanently Delete Patient
          </DialogTitle>
          <DialogDescription className="text-red-700">
            <strong>⚠️ DANGER: This action cannot be undone!</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Warning Section */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-start">
              <IconAlertTriangle className="h-5 w-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-2">You are about to permanently delete:</p>
                <p className="font-mono bg-red-100 px-2 py-1 rounded text-red-900">
                  {patientName}
                </p>
              </div>
            </div>
          </div>

          {/* Consequences List */}
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">This will permanently:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Remove all patient data from the database</li>
              <li>• Delete all medical records and case history</li>
              <li>• Remove all appointment history</li>
              <li>• Delete all payment records</li>
              <li>• Remove all notes and documentation</li>
            </ul>
            <p className="text-xs text-red-600 mt-3 font-semibold">
              This data cannot be recovered even by system administrators!
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="grid gap-2">
            <Label htmlFor="confirm-text" className="text-sm font-medium text-red-700">
              Type <span className="font-mono bg-red-100 px-1 text-red-900">{expectedText}</span> to confirm:
            </Label>
            <Input
              id="confirm-text"
              placeholder={expectedText}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border-red-300 focus:border-red-500 focus:ring-red-500"
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || loading}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isSubmitting || loading}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {(isSubmitting || loading) && (
              <IconLoader className="mr-2 h-4 w-4 animate-spin" />
            )}
            <IconTrash className="mr-2 h-4 w-4" />
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
