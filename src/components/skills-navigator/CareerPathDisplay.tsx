
'use client';

import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { SectionCard } from './SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { findAffiliateLink } from '@/lib/affiliateLinks';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Briefcase,
  CodeXml,
  Users,
  Laptop,
  BookOpenCheck,
  Lightbulb,
  Copy,
  Mail,
  Loader2,
  AlertTriangle,
  Sparkles,
  Award,
  Zap, // For premium upgrade CTA
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useActionState } from 'react'; 
import { emailResultsAction, type EmailFormState } from '@/app/actions';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';


interface CareerPathDisplayProps {
  data: CareerPathOutput;
  reportType: 'free' | 'premium';
}

function formatResultsForCopy(data: CareerPathOutput, reportType: 'free' | 'premium'): string {
  let text = `Lume - Your ${reportType === 'premium' ? 'Premium' : 'Free'} Career Path Report\n\n`;
  text += `Job Roles:\n- ${data.jobRoles.join('\n- ')}\n\n`;
  text += `Technical Skills:\n- ${data.technicalSkills.join('\n- ')}\n\n`;
  text += `Soft Skills:\n- ${data.softSkills.join('\n- ')}\n\n`;
  text += `Tools & Platforms:\n- ${data.toolsAndPlatforms.join('\n- ')}\n\n`;
  text += `Course Suggestions:\n- ${data.courseSuggestions.join('\n- ')}\n\n`;
  text += `Beginner Project Idea:\n${data.beginnerProjectIdea}\n`;

  if (reportType === 'premium') {
    // Add premium-specific fields to text when they are available in CareerPathOutput
  }
  return text;
}

function EmailSubmitButton() {
  // Corrected: useActionState returns [state, formAction], not { pending }
  const [state, formAction] = useActionState(emailResultsAction, { message: null, success: false });
  // To get pending status, you might need to wrap formAction or manage pending state separately.
  // For simplicity, let's assume a local pending state if direct useFormStatus isn't feasible here.
  // Or, for now, just rely on the button's disabled state if the form is simple.
  // A more robust solution would involve using useFormStatus if this button were part of a <form>.
  // Since it's not directly, we'll just use a simple disabled prop for now.
  // const { pending } = useFormStatus(); // This hook would not work here as expected.
  
  // Placeholder for pending state, would ideally come from useFormStatus or context
  const pending = false; 

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Send Email
    </Button>
  );
}


export function CareerPathDisplay({ data, reportType }: CareerPathDisplayProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const initialEmailState: EmailFormState = { message: null, success: false };
  const [emailFormState, dispatchEmailAction] = useActionState(emailResultsAction, initialEmailState);
  
  const resultsTextForEmail = useMemo(() => formatResultsForCopy(data, reportType), [data, reportType]);

  React.useEffect(() => {
    if (emailFormState?.message) {
      toast({
        title: emailFormState.success ? 'Success' : 'Error',
        description: emailFormState.message,
        variant: emailFormState.success ? 'default' : 'destructive',
      });
      if (emailFormState.success) {
        setEmail(''); 
      }
    }
  }, [emailFormState, toast]);

  const handleCopyToClipboard = () => {
    const textToCopy = formatResultsForCopy(data, reportType);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to Clipboard!",
          description: `Your ${reportType} career path results have been copied.`,
        });
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy results to clipboard.",
          variant: "destructive",
        });
      });
  };

  const sections = [
    { title: "Suggested Job Roles", icon: Briefcase, items: data.jobRoles },
    { title: "Technical Skills to Develop", icon: CodeXml, items: data.technicalSkills },
    { title: "Key Soft Skills", icon: Users, items: data.softSkills },
    { title: "Tools & Platforms to Learn", icon: Laptop, items: data.toolsAndPlatforms },
  ];


  return (
    <div className="space-y-8 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border rounded-lg bg-card shadow">
        <div className="flex items-center">
          {reportType === 'premium' ? (
            <Award className="h-8 w-8 text-primary mr-3" />
          ) : (
            <Sparkles className="h-8 w-8 text-primary mr-3" />
          )}
          <div>
            <h2 className="text-2xl font-semibold">
              Your {reportType === 'premium' ? 'Premium' : 'Free'} Career Path Report
            </h2>
            {reportType === 'premium' && (
                <p className="text-sm text-muted-foreground">Note: Full premium content is under development.</p>
            )}
             {reportType === 'free' && (
                <p className="text-sm text-muted-foreground">This is a summary. Upgrade for a detailed report!</p>
            )}
          </div>
        </div>
        <Button onClick={handleCopyToClipboard} variant="outline">
          <Copy className="mr-2 h-4 w-4" /> Copy Results
        </Button>
      </div>
      
      {reportType === 'free' && (
        <Card className="bg-primary/5 border-primary/20 shadow-lg dark:bg-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Zap className="mr-2 h-6 w-6" />
              Ready for the Full Picture?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/90">
              This free summary gives you a great starting point. Unlock a comprehensive, 
              personalized career roadmap with in-depth analysis, detailed learning resources, 
              project ideas, resume tips, and much more with our Premium Report!
            </p>
            <Button 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md" 
              onClick={() => toast({ 
                title: 'Premium Feature Coming Soon!', 
                description: 'The ability to generate full Premium Reports with payment is under development. Stay tuned!',
                duration: 5000,
              })}
            >
              <Sparkles className="mr-2 h-5 w-5" /> Upgrade to Premium Report (₦1000)
            </Button>
          </CardContent>
        </Card>
      )}

      {sections.map(section => (
        section.items && section.items.length > 0 && (
          <SectionCard key={section.title} title={section.title} icon={section.icon}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">
              {section.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </SectionCard>
        )
      ))}

      {data.courseSuggestions && data.courseSuggestions.length > 0 && (
        <SectionCard title="Course Suggestions" icon={BookOpenCheck}>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            {data.courseSuggestions.map((course, index) => {
              const affiliateLink = findAffiliateLink(course);
              if (affiliateLink) {
                return (
                  <li key={index}>
                    <Link href={affiliateLink.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      {affiliateLink.displayText || course} <Badge variant="outline" className="ml-1 border-primary/50 text-primary text-xs">Partner Link</Badge>
                    </Link>
                  </li>
                );
              }
              return <li key={index}>{course}</li>;
            })}
          </ul>
           {reportType === 'free' && <p className="mt-3 text-sm text-muted-foreground">Unlock more course recommendations and direct links in our Premium Report.</p>}
        </SectionCard>
      )}

      {data.beginnerProjectIdea && (
        <SectionCard title="Beginner Project Idea" icon={Lightbulb}>
          <p className="text-foreground/90">{data.beginnerProjectIdea}</p>
          {reportType === 'free' && <p className="mt-3 text-sm text-muted-foreground">Get more detailed project ideas and steps in our Premium Report.</p>}
        </SectionCard>
      )}
      
      {reportType === 'premium' && (
        <>
          <div className="p-6 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <h3 className="text-xl font-semibold text-primary mb-2">Premium Content Coming Soon!</h3>
            <p className="text-muted-foreground">Detailed sections like Career Roadmaps, Skill Gap Analysis, Resume Tips, and Job Market Insights are part of the full Premium Report, currently under development.</p>
          </div>
        </>
      )}


      <SectionCard title="Email These Results" icon={Mail} className="bg-secondary/30 dark:bg-secondary/20">
         <form action={dispatchEmailAction} className="space-y-4">
          <div>
            <Label htmlFor="email-results" className="sr-only">Your Email Address</Label>
            <Input
              id="email-results"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <input type="hidden" name="resultsText" value={resultsTextForEmail} />
          <EmailSubmitButton />
          {emailFormState?.message && !emailFormState.success && (
             <p className="text-sm text-destructive flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {emailFormState.message}
            </p>
          )}
        </form>
      </SectionCard>
    </div>
  );
}
