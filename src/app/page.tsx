'use client';

import React, { useState } from 'react';
import { CareerForm } from '@/components/skills-navigator/CareerForm';
import { CareerPathDisplay } from '@/components/skills-navigator/CareerPathDisplay';
import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, Github, Palette } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function SkillsNavigatorPage() {
  const [careerPathData, setCareerPathData] = useState<CareerPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmitSuccess = (data: CareerPathOutput) => {
    setCareerPathData(data);
    setError(null);
  };

  const handleReset = () => {
    setCareerPathData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="py-4 px-6 shadow-md bg-card">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Navigation className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Skills Navigator</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/firebase/genkit/tree/main/studio" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {!careerPathData && !isLoading && (
          <section id="input-form" className="mb-12">
            <CareerForm 
              onFormSubmitSuccess={handleFormSubmitSuccess}
              setIsLoading={setIsLoading}
            />
          </section>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-10 rounded-lg shadow-lg bg-card">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <p className="text-xl font-semibold text-primary">Generating your personalized career path...</p>
            <p className="text-muted-foreground mt-2">This might take a few moments. Please wait.</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
          </div>
        )}

        {careerPathData && !isLoading && (
          <section id="results-display">
            <CareerPathDisplay data={careerPathData} />
            <div className="mt-8 text-center">
              <Button onClick={handleReset} variant="outline" size="lg">
                Generate Another Path
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Skills Navigator. Powered by AI.</p>
      </footer>
    </div>
  );
}
