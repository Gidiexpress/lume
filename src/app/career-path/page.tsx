
'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { CareerForm } from '@/components/skills-navigator/CareerForm';
import { CareerPathDisplay } from '@/components/skills-navigator/CareerPathDisplay';
import type { CareerPathInput, CareerPathOutput } from '@/ai/flows/career-path-generator';
import type { PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator';
import { generatePremiumReportAction, type FormState as PremiumFormActionState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, ShieldCheck, Github } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from '@/components/skills-navigator/PaymentModal';

export default function CareerPathPage() {
  const [currentReportData, setCurrentReportData] = useState<CareerPathOutput | PremiumCareerPathOutput | null>(null);
  const [originalFormInput, setOriginalFormInput] = useState<CareerPathInput | null>(null);
  const [freeReportError, setFreeReportError] = useState<string | null>(null);
  const [currentReportType, setCurrentReportType] = useState<'free' | 'premium' | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const { toast } = useToast();

  const initialPremiumState: PremiumFormActionState = { message: null, success: false, data: null, reportType: 'premium' };
  const [premiumState, premiumFormAction, isPremiumGenerating] = useActionState(generatePremiumReportAction, initialPremiumState);

  useEffect(() => {
    document.title = 'Career Path Generator | Lume';
  }, []);

  const handleFreeFormSubmitSuccess = (data: CareerPathOutput, originalInput: CareerPathInput, type: 'free' | 'premium') => {
    setCurrentReportData(data);
    setOriginalFormInput(originalInput);
    setCurrentReportType(type as 'free');
    setFreeReportError(null);
  };

  const handleFreeFormSubmitError = (errorMessage: string) => {
    setFreeReportError(errorMessage);
    setCurrentReportData(null);
    setOriginalFormInput(null);
  };

  useEffect(() => {
    if (premiumState?.message) {
      if (premiumState.success && premiumState.data) {
        setCurrentReportData(premiumState.data as PremiumCareerPathOutput);
        setCurrentReportType('premium');
        toast({
          title: 'Premium Report Generated!',
          description: premiumState.message,
        });
      } else if (!premiumState.success) {
        toast({
          title: 'Premium Generation Failed',
          description: premiumState.message || "Could not generate premium report.",
          variant: 'destructive',
        });
      }
    }
  }, [premiumState, toast]);

  const handleUpgradeToPremiumRequest = () => {
    if (originalFormInput) {
      setIsPaymentModalOpen(true); // Open payment modal instead of directly calling action
    } else {
      toast({
        title: 'Error',
        description: 'Original form data is missing. Cannot generate premium report.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPayment = () => {
    setIsPaymentModalOpen(false);
    if (originalFormInput) {
      premiumFormAction(originalFormInput);
    }
  };

  const handleReset = () => {
    setCurrentReportData(null);
    setOriginalFormInput(null);
    setFreeReportError(null);
    setCurrentReportType(null);
    setIsPaymentModalOpen(false);
  };

  const error = freeReportError || (!premiumState?.success && premiumState?.message ? premiumState.message : null);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="py-4 px-6 shadow-md bg-card sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Lume</h1>
          </Link>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin" aria-label="Admin Dashboard">
                <ShieldCheck className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/firebase/genkit/tree/main/studio" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {!currentReportData && !error && (
          <section id="input-form" className="mb-12 flex flex-col items-center">
            <CareerForm 
              onFormSubmitSuccess={handleFreeFormSubmitSuccess}
              onFormSubmitError={handleFreeFormSubmitError}
            />
          </section>
        )}

        {error && ( 
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto border border-destructive/30">
            <div className="flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p className="font-semibold text-lg">Generation Failed</p>
            </div>
            <p className="mb-4">{error}</p>
            <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
          </div>
        )}

        {currentReportData && currentReportType && !error && (
          <section id="results-display" className="max-w-3xl mx-auto">
            <CareerPathDisplay 
              data={currentReportData} 
              reportType={currentReportType}
              onUpgradeToPremium={handleUpgradeToPremiumRequest}
              isPremiumLoading={isPremiumGenerating}
            />
            <div className="mt-8 text-center">
              <Button onClick={handleReset} variant="outline" size="lg">
                Generate Another Path
              </Button>
            </div>
          </section>
        )}

        {isPaymentModalOpen && originalFormInput && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirmPayment={handleConfirmPayment}
            isLoading={isPremiumGenerating}
          />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume. Illuminating Your Career Journey.</p>
      </footer>
    </div>
  );
}
