
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Briefcase, Users, Lightbulb, ChevronRight, Target, Brain, Search, Github, ShieldCheck } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export const metadata: Metadata = {
  title: 'Lume - AI-Powered Career Guidance & Personalized Pathfinding',
  description: 'Discover your ideal career with Lume. Our AI-driven platform provides personalized guidance, skill recommendations, and project ideas to navigate your professional journey.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Navigation className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Lume</span>
          </Link>
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base px-3 sm:px-4">
              <Link href="/career-path">Get Started</Link>
            </Button>
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20 dark:to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Unlock Your Future with <span className="text-primary">Lume</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Stop wondering, start exploring. Lume uses cutting-edge AI to illuminate your path towards a fulfilling career, tailored to your unique skills and passions.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-6 text-lg">
              <Link href="/career-path">
                Find Your Path Now <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <div className="mt-16 px-4 sm:px-0">
              <Image
                src="https://placehold.co/1200x600.png"
                alt="Lume platform illustrating career paths"
                width={1200}
                height={600}
                className="rounded-lg shadow-2xl mx-auto max-w-full h-auto"
                data-ai-hint="career path tech"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Choose Lume?</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Discover the advantages of using Lume for your career exploration.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                <CardHeader className="items-center text-center pt-8">
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 inline-block">
                    <Brain className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground pb-8">
                  Leverage advanced AI to analyze your profile and suggest career options you might not have considered.
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                <CardHeader className="items-center text-center pt-8">
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 inline-block">
                    <Target className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl">Personalized Roadmaps</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground pb-8">
                  Receive tailored career paths, including necessary skills, courses, and even beginner project ideas.
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                <CardHeader className="items-center text-center pt-8">
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 inline-block">
                    <Search className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl">Explore Diverse Fields</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground pb-8">
                  From tech to creative industries, explore a wide range of possibilities and find your perfect fit.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-secondary/20 dark:bg-secondary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Get Started in 3 Simple Steps</h2>
             <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Navigating your career future with Lume is easy and intuitive.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">1</div>
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tell Us About You</h3>
                <p className="text-muted-foreground">Share your field of study and any career interests you have.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">2</div>
                <Briefcase className="h-12 w-12 text-primary mb-4" /> {/* Changed from Brain to Briefcase for variety */}
                <h3 className="text-xl font-semibold mb-2">AI Analyzes</h3>
                <p className="text-muted-foreground">Our intelligent system processes your input to find suitable paths.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">3</div>
                <Lightbulb className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Discover Your Path</h3>
                <p className="text-muted-foreground">Receive a detailed roadmap with roles, skills, courses, and projects.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Illuminate Your Career Journey?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Take the first step towards a clearer, more confident professional future.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-6 text-lg">
              <Link href="/career-path">
                Generate Your Career Path Now <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Lume. All rights reserved. Powered by AI.</p>
           <div className="flex justify-center items-center space-x-4 mt-4">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
              <Link href="/admin">Admin</Link>
            </Button>
             <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
              <a href="https://github.com/firebase/genkit/tree/main/studio" target="_blank" rel="noopener noreferrer">GitHub</a>
             </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

    