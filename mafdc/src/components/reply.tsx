'use client';

import { useState, useEffect } from 'react';
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

// Predefined reply messages for each subject
const predefinedReplies: Record<string, string> = {
  'Orthodontic Braces': `Thank you for your inquiry regarding orthodontic braces. We offer comprehensive orthodontic treatment including traditional braces, clear aligners, and other orthodontic solutions.

Our experienced orthodontist will assess your specific needs during a consultation and create a personalized treatment plan. The duration and cost of treatment vary depending on individual cases.

We would be happy to schedule a consultation to discuss your orthodontic needs in detail. Please let us know your preferred date and time, and we will arrange an appointment for you.`,

  'Cleaning/Oral Prophylaxis': `Thank you for your interest in our cleaning and oral prophylaxis services. Regular dental cleanings are essential for maintaining optimal oral health.

We recommend professional cleanings every 6 months to prevent plaque buildup, gum disease, and other dental issues. Our hygienists use the latest techniques and equipment to ensure a thorough and comfortable cleaning experience.

We would be delighted to schedule your cleaning appointment. Please let us know your preferred date and time, and we will confirm your appointment.`,

  'Extraction': `Thank you for contacting us regarding tooth extraction. We understand that tooth extraction can be a concern, and we are here to help.

Our experienced dentists perform extractions with care and precision, ensuring your comfort throughout the procedure. We offer various sedation options if needed.

To determine the best approach for your situation, we recommend scheduling a consultation. During this visit, we will examine the affected tooth, discuss treatment options, and address any concerns you may have.`,

  'Teeth Whitening': `Thank you for your inquiry about teeth whitening services. We offer professional teeth whitening treatments that can significantly brighten your smile.

We provide both in-office whitening procedures and take-home whitening kits. Our team will help you choose the option that best fits your needs and lifestyle.

During a consultation, we can assess your current tooth color and discuss the expected results. We would be happy to schedule an appointment to discuss your whitening options.`,

  'Restoration/Pasta': `Thank you for your inquiry regarding dental restoration (pasta/filling) services. We provide high-quality dental fillings using modern materials that are both durable and aesthetically pleasing.

Our restorations are designed to restore the function and appearance of your teeth while maintaining a natural look. We use composite resin and other advanced materials that match your natural tooth color.

If you have a cavity or damaged tooth that needs restoration, we recommend scheduling an appointment. Our dentist will examine the affected area and recommend the best treatment option for you.`,

  'Dental Crown': `Thank you for your interest in dental crown services. Dental crowns are an excellent solution for restoring damaged, weakened, or discolored teeth.

We offer various types of crowns including porcelain, ceramic, and metal crowns, each with their own benefits. Our team will help you choose the best option based on your specific needs and preferences.

The crown procedure typically requires two visits: one for preparation and impression, and another for placement. We would be happy to schedule a consultation to discuss your crown treatment in detail.`,

  'Fixed Bridge': `Thank you for your inquiry about fixed bridge services. A fixed bridge is an effective solution for replacing one or more missing teeth.

Our bridges are custom-made to match your natural teeth in both appearance and function. They are securely anchored to adjacent teeth, providing a stable and long-lasting solution.

We would be happy to schedule a consultation to assess your situation and discuss whether a fixed bridge is the right option for you. During the visit, we will explain the procedure, timeline, and answer any questions you may have.`,

  'Veneers': `Thank you for your interest in dental veneers. Veneers are a popular cosmetic solution for improving the appearance of your smile.

We offer porcelain and composite veneers that can address various cosmetic concerns such as discoloration, gaps, chips, or misalignment. Veneers are custom-made to match your desired smile.

A consultation will allow us to assess your teeth and discuss your smile goals. We can show you what your new smile could look like and create a treatment plan tailored to your needs.`,

  'Denture': `Thank you for your inquiry about denture services. We provide both complete and partial dentures to restore your smile and ability to chew comfortably.

Our dentures are custom-made to fit your mouth perfectly and are designed to look natural and feel comfortable. We use high-quality materials to ensure durability and aesthetics.

We would be happy to schedule a consultation to discuss your denture options. During the visit, we will take impressions, discuss your preferences, and create a treatment plan that meets your needs.`,

  'General Inquiry': `Thank you for contacting MA Florencio Dental Clinic. We appreciate your interest in our services.

We are committed to providing high-quality dental care in a comfortable and welcoming environment. Our team of experienced professionals is here to help you achieve and maintain optimal oral health.

If you have any specific questions or would like to schedule an appointment, please feel free to contact us. We look forward to serving you and your family's dental needs.`,

  'Appointment Scheduling': `Thank you for your interest in scheduling an appointment with us. We are happy to help you find a convenient time for your visit.

Our clinic offers flexible scheduling to accommodate your busy lifestyle. We have appointments available during weekdays and can discuss weekend availability if needed.

Please let us know your preferred date and time, and we will do our best to accommodate your request. You can also call us directly to speak with our scheduling team.`,

  'Emergency': `Thank you for contacting us regarding your dental emergency. We understand that dental emergencies require immediate attention, and we are here to help.

For urgent dental issues, we recommend calling our clinic directly at your earliest convenience. Our team will assess the situation and provide guidance on the next steps.

If you are experiencing severe pain, swelling, or trauma, please seek immediate care. We will do our best to see you as soon as possible or direct you to the appropriate emergency care facility.`,

  'Insurance Questions': `Thank you for your inquiry regarding dental insurance. We understand that insurance coverage can be confusing, and we are here to help clarify your benefits.

We accept most major dental insurance plans and will work with your insurance provider to maximize your benefits. Our team can help you understand your coverage and estimate your out-of-pocket costs.

Please provide us with your insurance information, and we can verify your benefits before your appointment. If you have specific questions about your coverage, feel free to contact our office.`,

  'Payment Options': `Thank you for your inquiry about payment options. We want to make dental care accessible and affordable for all our patients.

We accept various payment methods including cash, credit cards, and debit cards. We also offer flexible payment plans for more extensive treatments.

For your convenience, we can discuss payment options during your consultation. Our team will work with you to find a payment arrangement that fits your budget. Please don't hesitate to ask about our payment plans.`,

  'Other': `Thank you for contacting MA Florencio Dental Clinic. We appreciate you reaching out to us.

We are here to assist you with any questions or concerns you may have about our services, procedures, or general dental care. Our team is committed to providing you with the information and support you need.

Please feel free to provide more details about your inquiry, and we will be happy to assist you further. You can also call us directly if you prefer to speak with someone in person.`
};

export function ReplyDialog({ inquiry, open, onOpenChange, onReplySuccess }: ReplyDialogProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-populate reply message based on inquiry subject
  useEffect(() => {
    if (inquiry && open && inquiry.subject) {
      const predefinedMessage = predefinedReplies[inquiry.subject] || predefinedReplies['Other'];
      setReplyMessage(predefinedMessage);
    } else if (!open) {
      // Clear message when dialog closes
      setReplyMessage('');
    }
  }, [inquiry, open]);

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="replyMessage" className="text-xs sm:text-sm font-medium dark:text-gray-300">
                    Reply Message
                  </Label>
                  {inquiry?.subject && predefinedReplies[inquiry.subject] && replyMessage === predefinedReplies[inquiry.subject] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyMessage('')}
                      className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear template
                    </Button>
                  )}
                </div>
                <Textarea
                  id="replyMessage"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your reply will be sent to {inquiry.email}
                  </p>
                  {inquiry?.subject && predefinedReplies[inquiry.subject] && replyMessage === predefinedReplies[inquiry.subject] && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Using predefined template
                    </p>
                  )}
                </div>
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
