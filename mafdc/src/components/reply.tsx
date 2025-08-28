'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { Inquiry } from '@/interface/Inquiry';

interface ReplyDialogProps {
  inquiry: Inquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplySuccess?: (inquiryId: string) => void;
}

export function ReplyDialog({ inquiry, open, onOpenChange, onReplySuccess }: ReplyDialogProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendReply = async () => {
    if (!inquiry || !replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // await sendReply(inquiry.id, replyMessage);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Reply sent successfully');
      setReplyMessage('');
      onOpenChange(false);
      
      // Mark inquiry as replied
      if (onReplySuccess) {
        onReplySuccess(inquiry.id);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Unread': return 'destructive';
      case 'Read': return 'secondary';
      case 'Replied': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2 dark:text-white">
            <Send className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
            Reply to Inquiry
          </DialogTitle>
        </DialogHeader>
        
        {inquiry && (
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {/* Original Inquiry */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border-l-4 border-violet-600 dark:border-violet-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Original Inquiry</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusBadgeVariant(inquiry.status)} className="text-xs dark:bg-violet-700 dark:text-white dark:border-violet-600">
                    {inquiry.status}
                  </Badge>
                  {inquiry.isArchived && (
                    <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">Archived</Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">From</p>
                  <p className="font-medium text-sm sm:text-base dark:text-white">{inquiry.fullName}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">{inquiry.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-medium text-sm sm:text-base dark:text-white">{formatDate(inquiry.createdAt)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                  <p className="font-medium text-sm sm:text-base dark:text-white">{inquiry.subject}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Message</p>
                  <div className="bg-white dark:bg-gray-900 rounded-md p-3 border dark:border-gray-600">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                      {inquiry.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Your Reply</h3>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="replyMessage" className="text-xs sm:text-sm font-medium dark:text-gray-300">
                  Reply Message
                </Label>
                <Textarea
                  id="replyMessage"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your reply will be sent to {inquiry.email}
                </p>
              </div>
            </div>

            {/* Email Preview */}
            {replyMessage.trim() && (
              <div className="border rounded-lg p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 text-sm sm:text-base">Email Preview</h4>
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="dark:text-gray-300"><span className="font-medium">To:</span> {inquiry.email}</p>
                  <p className="dark:text-gray-300"><span className="font-medium">Subject:</span> Re: {inquiry.subject}</p>
                  <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border dark:border-gray-700">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm sm:text-base">
                      {replyMessage}
                    </p>
                    <div className="mt-4 pt-3 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <p>Best regards,</p>
                      <p>MA Florencio Dental Clinic Team</p>
                      <p>M&F Building National Road cor. Govic Highway</p>
                      <p>Brgy. Del Pilar, Castillejos, Philippines</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-2 pt-4 sm:pt-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSendReply}
            disabled={isLoading || !replyMessage.trim()}
            className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            {isLoading ? 'Sending...' : 'Send Reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
