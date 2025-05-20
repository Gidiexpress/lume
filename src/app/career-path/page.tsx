
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
    setCurrentReportType(null);
  };

  useEffect(() => {
    if (premiumState?.message && !isPremiumGenerating) { 
      if (premiumState.success && premiumState.data) {
        setCurrentReportData(premiumState.data as PremiumCareerPathOutput);
        setCurrentReportType('premium');
        toast({
          title: 'Premium Report Generated!',
          description: premiumState.message,
        });
        setIsPaymentModalOpen(false); // Close payment modal on successful premium generation
      } else if (!premiumState.success) {
        toast({
          title: 'Premium Generation Failed',
          description: premiumState.message || "Could not generate premium report.",
          variant: 'destructive',
        });
        // Keep payment modal open or handle error state for modal as needed
      }
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

  // This function is called by PaymentModal after Paystack's onSuccess
  const handleConfirmPaymentAndGenerateReport = () => {
    if (originalFormInput) {
      startTransition(() => {
        premiumFormAction(originalFormInput); // Start AI call
      });
      // The modal will remain open and show its loading state (isPremiumGenerating)
      // It will be closed by the useEffect hook when premiumState.success is true.
    }
  };

  const handleReset = () => {
    setCurrentReportData(null);
    setOriginalFormInput(null);
    setFreeReportError(null);
    setCurrentReportType(null);
    setIsPaymentModalOpen(false);
  };

  const premiumErrorFromAction = !isPremiumGenerating && premiumState && !premiumState.success ? premiumState.message : null;
  const displayError = freeReportError || premiumErrorFromAction;

  // Determine what to display
  let contentToDisplay;
  if (isPremiumGenerating) {
    contentToDisplay = (
      <Card className="w-full max-w-md mx-auto shadow-xl my-12">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
            Crafting Your Premium Report...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Hang tight! Our system is working its magic to generate your detailed, multi-path career guidance. This might take a moment.
          </p>
          <div className="w-full bg-muted rounded-full h-2.5 my-6 overflow-hidden">
            <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
          </div>
           <p className="text-xs text-muted-foreground text-center">
            Please do not close or refresh this page.
          </p>
        </CardContent>
      </Card>
    );
  } else if (displayError) {
    contentToDisplay = (
      <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto border border-destructive/30">
        <div className="flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <p className="font-semibold text-lg">Report Generation Failed</p>
        </div>
        <p className="mb-4">{displayError}</p>
        <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
      </div>
    );
  } else if (currentReportData && currentReportType) {
    contentToDisplay = (
      <section id="results-display" className="max-w-3xl mx-auto">
        <CareerPathDisplay 
          data={currentReportData} 
          reportType={currentReportType}
          onUpgradeToPremium={handleUpgradeToPremiumRequest}
          isPremiumLoading={isPremiumGenerating} // This is for the button state inside CareerPathDisplay
        />
        <div className="mt-8 text-center">
          <Button onClick={handleReset} variant="outline" size="lg">
            Generate Another Report
          </Button>
        </div>
      </section>
    );
  } else {
    contentToDisplay = (
      <section id="input-form" className="mb-12 flex flex-col items-center">
        <CareerForm 
          onFormSubmitSuccess={handleFreeFormSubmitSuccess}
          onFormSubmitError={handleFreeFormSubmitError}
        />
      </section>
    );
  }


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
        {contentToDisplay}

        {isPaymentModalOpen && originalFormInput && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirmPayment={handleConfirmPaymentAndGenerateReport} // Renamed prop for clarity
            isLoading={isPremiumGenerating} // This will keep Paystack button disabled if AI is already working
            userEmail={originalFormInput.email}
          />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume. Illuminating Your Career Journey.</p>
      </footer>
    </div>
  );
}
