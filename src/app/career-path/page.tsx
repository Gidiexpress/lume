
'use client';

import React, { useState, useEffect } from 'react';
import { CareerForm } from '@/components/skills-navigator/CareerForm';
import { CareerPathDisplay } from '@/components/skills-navigator/CareerPathDisplay';
import type { CareerPathInput } from '@/ai/flows/career-path-generator';
import type { PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CareerPathPage() {
  const [currentReportData, setCurrentReportData] = useState<PremiumCareerPathOutput | null>(null);
  const [originalFormInput, setOriginalFormInput] = useState<CareerPathInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); 
  
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Career Path Generator | Lume';
  }, []);

  const handleFormSubmitSuccess = (data: PremiumCareerPathOutput, originalInput: CareerPathInput) => {
    setCurrentReportData(data);
    setOriginalFormInput(originalInput);
    setFormError(null);
    setIsGenerating(false); 
  };

  const handleFormSubmitError = (errorMessage: string) => {
    setFormError(errorMessage);
    setCurrentReportData(null);
    setOriginalFormInput(null);
    setIsGenerating(false); 
  };
  
  const handleFormSubmitStart = () => {
    setIsGenerating(true);
    setFormError(null); // Clear previous errors when starting a new generation
    setCurrentReportData(null); // Clear previous report data
  };

  const handleReset = () => {
    setCurrentReportData(null);
    setOriginalFormInput(null);
    setFormError(null);
    setIsGenerating(false);
  };

  let contentToDisplay;
  if (isGenerating) {
    contentToDisplay = (
      <Card className="w-full max-w-md mx-auto shadow-xl my-12">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
            Crafting Your Career Report...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Hang tight! Our AI is working to generate your detailed career guidance. This might take a few moments.
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
  } else if (formError) {
    contentToDisplay = (
      <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto border border-destructive/30">
        <div className="flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <p className="font-semibold text-lg">Report Generation Failed</p>
        </div>
        <p className="mb-4">{formError}</p>
        <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
      </div>
    );
  } else if (currentReportData) {
    contentToDisplay = (
      <section id="results-display" className="max-w-3xl mx-auto">
        <CareerPathDisplay 
          data={currentReportData} 
          reportType='premium'
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
          onFormSubmitSuccess={handleFormSubmitSuccess}
          onFormSubmitError={handleFormSubmitError}
          onFormSubmitStart={handleFormSubmitStart} // Pass the new callback
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
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {contentToDisplay}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume. Illuminating Your Career Journey.</p>
      </footer>
    </div>
  );
}
