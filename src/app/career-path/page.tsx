
'use client';

import React, { useState, useEffect, useActionState, startTransition } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    setCurrentReportType(type as 'free'); // Free report is always 'free' type from form
    setFreeReportError(null);
  };

  const handleFreeFormSubmitError = (errorMessage: string) => {
    setFreeReportError(errorMessage);
    setCurrentReportData(null);
    setOriginalFormInput(null);
    // Explicitly ensure premium loading indicator is also off if a free report error occurs
    // This scenario is less likely to be an issue but good for completeness
    if (isPremiumGenerating && premiumState && !premiumState.success) {
        // No direct way to stop useActionState's pending state, it resolves with the action
    }
  };

  useEffect(() => {
    if (premiumState?.message && !isPremiumGenerating) { // Check isPremiumGenerating to avoid premature toasts
      if (premiumState.success && premiumState.data) {
        setCurrentReportData(premiumState.data as PremiumCareerPathOutput);
        setCurrentReportType('premium');
        toast({
          title: 'Premium Report Generated!',
          description: premiumState.message,
        });
        // Modal is closed by handleConfirmPayment or should be confirmed closed here if error
      } else if (!premiumState.success) {
        toast({
          title: 'Premium Generation Failed',
          description: premiumState.message || "Could not generate premium report.",
          variant: 'destructive',
        });
      }
      // If modal was open during error, ensure it's closed or user can close it
      // setIsPaymentModalOpen(false); // Consider if modal should auto-close on error. Currently, it doesn't.
    }
  }, [premiumState, toast, isPremiumGenerating]);

  const handleUpgradeToPremiumRequest = () => {
    if (originalFormInput) {
      setIsPaymentModalOpen(true); 
    } else {
      toast({
        title: 'Error',
        description: 'Original form data is missing. Cannot generate premium report.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPayment = () => {
    if (originalFormInput) {
      startTransition(() => {
        premiumFormAction(originalFormInput); // Start AI call
      });
      setIsPaymentModalOpen(false);         // Close modal immediately
    }
  };

  const handleReset = () => {
    setCurrentReportData(null);
    setOriginalFormInput(null);
    setFreeReportError(null);
    setCurrentReportType(null);
    setIsPaymentModalOpen(false);
    // Reset premium action state if needed, though useActionState handles this to some extent
    // For a full reset of useActionState, a component key change or manual reset of its initial state might be needed,
    // but usually not required for this flow.
  };

  // Determine if the dedicated premium loading screen should be shown
  const showPremiumLoadingScreen = isPremiumGenerating && !currentReportData && !freeReportError;
  // Determine if an error specific to premium generation should be displayed
  const premiumError = !isPremiumGenerating && premiumState && !premiumState.success ? premiumState.message : null;
  // Combine free and premium errors for display
  const displayError = freeReportError || premiumError;

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
        {showPremiumLoadingScreen && (
          <Card className="w-full max-w-md mx-auto shadow-xl my-12">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center">
                <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
                Crafting Your Premium Report...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Hang tight! Our AI is working its magic to generate your detailed, multi-path career guidance. This might take a moment.
              </p>
              <div className="w-full bg-muted rounded-full h-2.5 my-6 overflow-hidden">
                <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
               <p className="text-xs text-muted-foreground text-center">
                Please do not close or refresh this page.
              </p>
            </CardContent>
          </Card>
        )}

        {!isPremiumGenerating && !currentReportData && !displayError && (
          <section id="input-form" className="mb-12 flex flex-col items-center">
            <CareerForm 
              onFormSubmitSuccess={handleFreeFormSubmitSuccess}
              onFormSubmitError={handleFreeFormSubmitError}
            />
          </section>
        )}

        {displayError && !isPremiumGenerating && ( 
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto border border-destructive/30">
            <div className="flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p className="font-semibold text-lg">Report Generation Failed</p>
            </div>
            <p className="mb-4">{displayError}</p>
            <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
          </div>
        )}

        {!isPremiumGenerating && currentReportData && currentReportType && !displayError && (
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
