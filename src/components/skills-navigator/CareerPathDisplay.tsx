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
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useActionState } from 'react';
import { emailResultsAction, type EmailFormState } from '@/app/actions';
import { Label } from '../ui/label';

interface CareerPathDisplayProps {
  data: CareerPathOutput;
}

function formatResultsForCopy(data: CareerPathOutput): string {
  let text = `Lume - Your Career Path\n\n`;
  text += `Job Roles:\n- ${data.jobRoles.join('\n- ')}\n\n`;
  text += `Technical Skills:\n- ${data.technicalSkills.join('\n- ')}\n\n`;
  text += `Soft Skills:\n- ${data.softSkills.join('\n- ')}\n\n`;
  text += `Tools & Platforms:\n- ${data.toolsAndPlatforms.join('\n- ')}\n\n`;
  text += `Course Suggestions:\n- ${data.courseSuggestions.join('\n- ')}\n\n`;
  text += `Beginner Project Idea:\n${data.beginnerProjectIdea}\n`;
  return text;
}

function EmailSubmitButton() {
  const { pending } = useActionState(emailResultsAction, { message: null, success: false }); // Placeholder initial state for pending status
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Send Email
    </Button>
  );
}


export function CareerPathDisplay({ data }: CareerPathDisplayProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const initialEmailState: EmailFormState = { message: null, success: false };
  const [emailFormState, dispatchEmailAction] = useActionState(emailResultsAction, initialEmailState);
  
  const resultsTextForEmail = useMemo(() => formatResultsForCopy(data), [data]);

  React.useEffect(() => {
    if (emailFormState?.message) {
      toast({
        title: emailFormState.success ? 'Success' : 'Error',
        description: emailFormState.message,
        variant: emailFormState.success ? 'default' : 'destructive',
      });
      if (emailFormState.success) {
        setEmail(''); // Clear email input on success
      }
    }
  }, [emailFormState, toast]);

  const handleCopyToClipboard = () => {
    const textToCopy = formatResultsForCopy(data);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to Clipboard!",
          description: "Career path results have been copied.",
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
    <div className="space-y-6 mt-8">
      <div className="flex justify-end">
        <Button onClick={handleCopyToClipboard} variant="outline">
          <Copy className="mr-2 h-4 w-4" /> Copy Results
        </Button>
      </div>

      {sections.map(section => (
        section.items && section.items.length > 0 && (
          <SectionCard key={section.title} title={section.title} icon={section.icon}>
            <ul className="list-disc list-inside space-y-1 text-foreground/90">
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
                      {affiliateLink.displayText || course}
                    </Link>
                  </li>
                );
              }
              return <li key={index}>{course}</li>;
            })}
          </ul>
        </SectionCard>
      )}

      {data.beginnerProjectIdea && (
        <SectionCard title="Beginner Project Idea" icon={Lightbulb}>
          <p className="text-foreground/90">{data.beginnerProjectIdea}</p>
        </SectionCard>
      )}

      <SectionCard title="Email These Results" icon={Mail} className="bg-secondary/50">
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
