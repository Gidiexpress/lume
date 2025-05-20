
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
  onClose: () => void;
  onConfirmPayment: () => void; // This will be called by Paystack's onSuccess
  isLoading: boolean; // To disable button while AI is working post-payment
  userEmail: string | undefined;
}

const PREMIUM_AMOUNT_NAIRA = 1000;
const PREMIUM_AMOUNT_KOBO = PREMIUM_AMOUNT_NAIRA * 100;

export function PaymentModal({ isOpen, onClose, onConfirmPayment, isLoading, userEmail }: PaymentModalProps) {
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const config: PaystackProps = {
    reference: new Date().getTime().toString(), // Generate a unique reference
    email: userEmail || 'guest@example.com', // Fallback email if not provided
    amount: PREMIUM_AMOUNT_KOBO, 
    publicKey: paystackPublicKey || '', // Handled below if not set
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

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    if (!paystackPublicKey) {
      // This case should ideally be handled more gracefully,
      // e.g., by disabling the button or showing a persistent error.
      // For now, an alert is shown.
      alert("Paystack Public Key is not configured. Payment cannot proceed.");
      console.error("Paystack Public Key is missing. Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your .env file.");
      return;
    }
    initializePayment({
      onSuccess: (transaction) => {
        // IMPORTANT: In a real app, you MUST verify this transaction on your backend
        // using Paystack's API and the transaction reference before granting premium access.
        console.log('Paystack transaction successful (client-side):', transaction);
        onConfirmPayment(); // Trigger AI report generation
        // The modal will be closed by the parent component's logic after AI generation starts/completes.
      },
      onClose: () => {
        console.log('Paystack modal closed by user.');
        // Do not close our Lume modal here if payment was not successful.
        // The main onClose prop of Dialog handles Lume modal closing.
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onClose(); }}>
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
            <span>Payment gateway is not configured. Please contact support or ensure `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set.</span>
          </div>
        )}

        <DialogFooter className="mt-6 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handlePayment} 
            disabled={isLoading || !paystackPublicKey} 
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
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
