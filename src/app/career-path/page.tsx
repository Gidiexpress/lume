
'use client';

import React, { useState, useEffect } from 'react';
import { CareerForm } from '@/components/skills-navigator/CareerForm';
import { CareerPathDisplay } from '@/components/skills-navigator/CareerPathDisplay';
import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, Github, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';

export default function CareerPathPage() {
  const [careerPathData, setCareerPathData] = useState<CareerPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'free' | 'premium'>('free');


  useEffect(() => {
    document.title = 'Career Path Generator | Lume';
  }, []);

  const handleFormSubmitSuccess = (data: CareerPathOutput, type: 'free' | 'premium') => {
    setCareerPathData(data);
    setReportType(type);
    setError(null);
    setIsLoading(false);
  };

  const handleFormSubmitError = (errorMessage: string) => {
    setError(errorMessage);
    setCareerPathData(null); // Clear any previous successful data
    setIsLoading(false); // Ensure loading is stopped
  };

  const handleReset = () => {
    setCareerPathData(null);
    setError(null);
    setIsLoading(false);
  };

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
        {!careerPathData && !isLoading && !error && (
          <section id="input-form" className="mb-12 flex flex-col items-center">
            <CareerForm 
              onFormSubmitSuccess={handleFormSubmitSuccess}
              onFormSubmitError={handleFormSubmitError}
              setIsLoading={setIsLoading}
            />
          </section>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-10 rounded-lg shadow-lg bg-card max-w-md mx-auto">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <p className="text-xl font-semibold text-primary">Generating your personalized career path...</p>
            <p className="text-muted-foreground mt-2">This might take a few moments. Please wait.</p>
          </div>
        )}

        {error && !isLoading && ( 
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto border border-destructive/30">
            <div className="flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p className="font-semibold text-lg">Generation Failed</p>
            </div>
            <p className="mb-4">{error}</p>
            <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
          </div>
        )}

        {careerPathData && !isLoading && !error && (
          <section id="results-display" className="max-w-3xl mx-auto">
            <CareerPathDisplay data={careerPathData} reportType={reportType} />
            <div className="mt-8 text-center">
              <Button onClick={handleReset} variant="outline" size="lg">
                Generate Another Path
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Lume. Illuminating Your Career Journey.</p>
      </footer>
    </div>
  );
}
