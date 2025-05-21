
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
import { Loader2, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import type { PaystackProps } from 'react-paystack/dist/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void; // Callback to close this Lume modal
  onConfirmPayment: () => void; // Callback after Paystack's client-side success
  isLoading: boolean; // True if AI report is currently generating post-payment
  userEmail: string | undefined;
}

const PREMIUM_AMOUNT_NAIRA = 1000;
const PREMIUM_AMOUNT_KOBO = PREMIUM_AMOUNT_NAIRA * 100;

export function PaymentModal({ isOpen, onClose, onConfirmPayment, isLoading, userEmail }: PaymentModalProps) {
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const paystackConfig: PaystackProps = {
    reference: new Date().getTime().toString(),
    email: userEmail || 'guest@example.com',
    amount: PREMIUM_AMOUNT_KOBO, 
    publicKey: paystackPublicKey || '',
    metadata: {
      custom_fields: [
        {
          display_name: "Service",
          variable_name: "service",
          value: "Lume Premium Career Report"
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaystackPayment = () => {
    if (!paystackPublicKey) {
      alert("Paystack Public Key is not configured. Payment cannot proceed.");
      console.error("Paystack Public Key is missing. Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your .env file.");
      return;
    }
    initializePayment({
      onSuccess: (transaction) => {
        console.log('Paystack transaction successful (client-side):', transaction);
        // IMPORTANT: In a real app, verify transaction on your backend.
        onConfirmPayment(); // This will trigger AI report generation and potentially close this modal via parent state
      },
      onClose: () => {
        // This is Paystack's modal closing, not necessarily Lume's modal.
        // If payment wasn't successful, Lume modal remains open unless user clicks Cancel.
        console.log('Paystack modal closed by user.');
      },
    });
  };

  return (
    <Dialog 
      modal={false} // Key change: Disable Radix focus trapping and overlay interaction blocking
      open={isOpen} 
      onOpenChange={(openState) => {
        // Only call onClose if the modal is being closed AND AI is not loading
        if (!openState && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Upgrade to Premium Report
          </DialogTitle>
          <DialogDescription className="pt-2">
            Unlock a comprehensive, personalized career report for a one-time fee of <strong>₦{PREMIUM_AMOUNT_NAIRA}</strong>. This will be processed securely via Paystack.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 text-center">
          <p className="text-4xl font-bold text-primary">₦{PREMIUM_AMOUNT_NAIRA}</p>
          <p className="text-sm text-muted-foreground">One-time payment</p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-md border border-dashed">
            <h4 className="font-semibold mb-2 flex items-center"><ShieldCheck size={18} className="mr-2 text-green-500" /> What you'll get:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Multiple Tailored Career Path Suggestions</li>
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
        
        {!paystackPublicKey && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
            <span>Payment gateway is not configured. Ensure `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set.</span>
          </div>
        )}

        <DialogFooter className="mt-6 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handlePaystackPayment} 
            disabled={isLoading || !paystackPublicKey} 
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? ( // This isLoading is for the AI generation part
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
             <CreditCard className="mr-2 h-4 w-4" />
            )}
            Pay ₦{PREMIUM_AMOUNT_NAIRA} with Paystack
          </Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground text-center mt-4">
            You will be redirected to Paystack to complete your payment.
        </p>
      </DialogContent>
    </Dialog>
  );
}
