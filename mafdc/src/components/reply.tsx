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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Send className="h-5 w-5 text-violet-600" />
            Reply to Inquiry
          </DialogTitle>
        </DialogHeader>
        
        {inquiry && (
          <div className="space-y-6 py-4">
            {/* Original Inquiry */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-violet-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Original Inquiry</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                    {inquiry.status}
                  </Badge>
                  {inquiry.isArchived && (
                    <Badge variant="secondary">Archived</Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-medium">{inquiry.fullName}</p>
                  <p className="text-sm text-gray-500">{inquiry.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(inquiry.createdAt)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subject</p>
                  <p className="font-medium">{inquiry.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Message</p>
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {inquiry.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Your Reply</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="replyMessage" className="text-sm font-medium">
                  Reply Message
                </Label>
                <Textarea
                  id="replyMessage"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Your reply will be sent to {inquiry.email}
                </p>
              </div>
            </div>

            {/* Email Preview */}
            {replyMessage.trim() && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Email Preview</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">To:</span> {inquiry.email}</p>
                  <p><span className="font-medium">Subject:</span> Re: {inquiry.subject}</p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {replyMessage}
                    </p>
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
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

        <DialogFooter className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSendReply}
            disabled={isLoading || !replyMessage.trim()}
            className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isLoading ? 'Sending...' : 'Send Reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
