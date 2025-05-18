
'use client';

import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { SectionCard } from './SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { findAffiliateLink } from '@/lib/affiliateLinks';
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
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useActionState } from 'react'; // Updated import
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
    // For example:
    // text += `Career Roadmap:\n...\n\n`;
    // text += `Skill Gap Analysis:\n...\n\n`;
  }
  return text;
}

function EmailSubmitButton() {
  const { pending } = useActionState(emailResultsAction, { message: null, success: false });
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

  // Future: Define premium_sections when premium report structure is available
  // const premiumSections = [
  //   ...sections,
  //   { title: "Detailed Career Roadmap", icon: Map, items: data.careerRoadmap },
  //   { title: "Skill Gap Analysis", icon: BarChart3, items: data.skillGapAnalysis },
  // ];
  // const displaySections = reportType === 'premium' ? premiumSections : sections;


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
      
      {/* Placeholder for future premium-only sections */}
      {reportType === 'premium' && (
        <>
          {/* Example of how premium sections might look when data is available */}
          {/* <SectionCard title="Detailed Career Roadmap" icon={MapIcon}>...</SectionCard> */}
          {/* <SectionCard title="Skill Gap Analysis" icon={TrendingUpIcon}>...</SectionCard> */}
          {/* <SectionCard title="Resume Tips" icon={FileTextIcon}>...</SectionCard> */}
          {/* <SectionCard title="Job Market Insights" icon={BriefcaseIcon}>...</SectionCard> */}
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

    