
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  isLoading: boolean;
}

export function PaymentModal({ isOpen, onClose, onConfirmPayment, isLoading }: PaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Upgrade to Premium Report
          </DialogTitle>
          <DialogDescription className="pt-2">
            You're about to unlock a comprehensive, personalized career report for a one-time fee of <strong>₦1,000</strong>. This will be processed securely (simulated via Monnify).
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 text-center">
          <p className="text-4xl font-bold text-primary">₦1,000</p>
          <p className="text-sm text-muted-foreground">One-time payment</p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-md border border-dashed">
            <h4 className="font-semibold mb-2 flex items-center"><ShieldCheck size={18} className="mr-2 text-green-500" /> What you'll get:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Detailed Career Role Summary & Specializations</li>
                <li>Personalized 3-Stage Career Roadmap</li>
                <li>Skill Gap Analysis & Readiness Score</li>
                <li>Curated Learning Resources (Free & Paid)</li>
                <li>Top Certification Recommendations</li>
                <li>Essential Tools & Software List</li>
                <li>Real-world Sample Project Ideas</li>
                <li>Key Soft Skills Development Plan</li>
                <li>Nigerian & Global Job Market Insights</li>
                <li>Targeted Resume Writing Tips</li>
            </ul>
        </div>
        
        <DialogFooter className="mt-6 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={onConfirmPayment} 
            disabled={isLoading} 
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
             <CreditCard className="mr-2 h-4 w-4" />
            )}
            Proceed with Simulated Payment
          </Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground text-center mt-4">
            Note: This is a simulated payment for demonstration purposes. No actual charge will be made.
        </p>
      </DialogContent>
    </Dialog>
  );
}
