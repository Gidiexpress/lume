
'use client';

import type { Metadata } from 'next';
import React, { useState, useEffect } from 'react';
import { CareerForm } from '@/components/skills-navigator/CareerForm';
import { CareerPathDisplay } from '@/components/skills-navigator/CareerPathDisplay';
import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, Github, ShieldCheck } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';

// Note: Page-specific metadata is usually defined by exporting a `metadata` object.
// However, for client components that need dynamic metadata or access to hooks,
// you might need a different approach or generate metadata in a parent Server Component.
// For simplicity here, we'll assume this could be a Server Component if static metadata is desired,
// or if dynamic, it would be handled differently (e.g. via `generateMetadata` if this were a server component).
// As this is a client component, direct export of `metadata` might not work as expected for dynamic titles.
// We will leave a static one for now.
//
// export const metadata: Metadata = { // This won't be picked up if the page is 'use client' at the top level
// title: 'Career Path Generator | Lume',
// description: 'Generate tailored career guidance based on your field of study and interests with Lume.',
// };
//
// To set metadata for a client-rendered page, you might do it in `useEffect` (for browser tab title)
// or ensure the parent layout/page provides it if it's a server component tree.
// For this prototype structure, we'll rely on the RootLayout's template.


export default function CareerPathPage() {
  const [careerPathData, setCareerPathData] = useState<CareerPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Example of setting document title on client side if needed, though layout.tsx handles templating
    document.title = 'Career Path Generator | Lume';
  }, []);

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
      <header className="py-4 px-6 shadow-md bg-card sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2"> {/* Link to new landing page */}
            <Navigation className="h-8 w-8 text-primary" />
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
        {!careerPathData && !isLoading && (
          <section id="input-form" className="mb-12 flex flex-col items-center">
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
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md shadow max-w-md mx-auto">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <Button onClick={handleReset} variant="destructive" className="mt-4">Try Again</Button>
          </div>
        )}

        {careerPathData && !isLoading && (
          <section id="results-display" className="max-w-3xl mx-auto">
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
        <p>&copy; {new Date().getFullYear()} Lume. Powered by AI.</p>
      </footer>
    </div>
  );
}

    