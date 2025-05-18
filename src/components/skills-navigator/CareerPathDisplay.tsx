
'use client';

import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import type { PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator';
import { SectionCard } from './SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { findAffiliateLink } from '@/lib/affiliateLinks';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Briefcase, CodeXml, Users, Laptop, BookOpenCheck, Lightbulb, Copy, Mail, Loader2, AlertTriangle, Sparkles, Award, Zap, CheckCircle, BarChart2, Users2, BookCopy, FileText, Globe, Target as TargetIcon, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useActionState } from 'react'; 
import { emailResultsAction, type EmailFormState } from '@/app/actions';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


interface CareerPathDisplayProps {
  data: CareerPathOutput | PremiumCareerPathOutput; // Union type for free or premium data
  reportType: 'free' | 'premium';
  onUpgradeToPremium: () => void;
  isPremiumLoading: boolean;
}

function formatResultsForCopy(data: CareerPathOutput | PremiumCareerPathOutput, reportType: 'free' | 'premium'): string {
  let text = `Lume - Your ${reportType === 'premium' ? 'Premium' : 'Free'} Career Path Report\n\n`;
  
  const basicData = data as CareerPathOutput; // Common fields
  text += `Job Roles:\n- ${basicData.jobRoles.join('\n- ')}\n\n`;
  text += `Technical Skills:\n- ${basicData.technicalSkills.join('\n- ')}\n\n`;
  text += `Soft Skills:\n- ${basicData.softSkills.join('\n- ')}\n\n`;
  text += `Tools & Platforms:\n- ${basicData.toolsAndPlatforms.join('\n- ')}\n\n`;

  if (reportType === 'free') {
    text += `Course Suggestions:\n- ${basicData.courseSuggestions.join('\n- ')}\n\n`;
    text += `Beginner Project Idea:\n${basicData.beginnerProjectIdea}\n`;
  }

  if (reportType === 'premium') {
    const premiumData = data as PremiumCareerPathOutput;
    text += `\n--- PREMIUM DETAILS ---\n\n`;
    text += `Career Summary:\n${premiumData.careerSummary}\n\n`;

    text += `Career Roadmap:\n`;
    premiumData.careerRoadmap.forEach(stage => {
      text += `  Stage: ${stage.stage} (${stage.focus})\n`;
      text += `    Skills: ${stage.skillsToLearn.join(', ')}\n`;
      text += `    Projects: ${stage.projectExamples.join(', ')}\n`;
      text += `    Milestones: ${stage.milestones.join(', ')}\n\n`;
    });

    if (premiumData.skillGapAnalysis) {
      text += `Skill Gap Analysis:\n`;
      text += `  Identified Current Skills: ${premiumData.skillGapAnalysis.identifiedCurrentSkills?.join(', ') || 'N/A'}\n`;
      text += `  Essential Skills for Path: ${premiumData.skillGapAnalysis.essentialSkillsForPath.join(', ')}\n`;
      text += `  Skills to Bridge: ${premiumData.skillGapAnalysis.skillsToBridge.join(', ')}\n\n`;
    }
    
    text += `Learning Resources:\n`;
    premiumData.learningResources.forEach(category => {
      text += `  Category: ${category.category}\n`;
      category.resources.forEach(res => {
        text += `    - ${res.title} (${res.type}, ${res.isFree ? 'Free' : 'Paid'})${res.urlSuggestion ? ` (Platform: ${res.urlSuggestion})` : ''}\n`;
      });
    });
    text += `\n`;

    text += `Recommended Certifications:\n`;
    premiumData.recommendedCertifications.forEach(cert => {
      text += `  - ${cert.name} (by ${cert.issuingBody}): ${cert.relevance}\n`;
    });
    text += `\n`;

    text += `Sample Projects Detailed:\n`;
    premiumData.sampleProjectsDetailed.forEach(proj => {
      text += `  Project: ${proj.title} (${proj.difficulty})\n`;
      text += `    Description: ${proj.description}\n`;
      text += `    Learning Outcomes: ${proj.learningOutcomes.join(', ')}\n\n`;
    });

    text += `Resume Tips:\n- ${premiumData.resumeTips.join('\n- ')}\n\n`;

    text += `Job Market Insight:\n`;
    text += `  Local (Nigeria): ${premiumData.jobMarketInsight.localNigeria}\n`;
    text += `  Remote/Global: ${premiumData.jobMarketInsight.remoteGlobal}\n`;
  }
  return text;
}

function EmailSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Send Email
    </Button>
  );
}


export function CareerPathDisplay({ data, reportType, onUpgradeToPremium, isPremiumLoading }: CareerPathDisplayProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const initialEmailState: EmailFormState = { message: null, success: false };
  const [emailFormState, dispatchEmailAction] = useActionState(emailResultsAction, initialEmailState);
  
  const resultsTextForEmail = useMemo(() => formatResultsForCopy(data, reportType), [data, reportType]);

  useEffect(() => {
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

  const freeData = data as CareerPathOutput;
  const premiumData = reportType === 'premium' ? data as PremiumCareerPathOutput : null;

  const sections = [
    { title: "Suggested Job Roles", icon: Briefcase, items: freeData.jobRoles, premiumOnly: false },
    { title: "Technical Skills to Develop", icon: CodeXml, items: reportType === 'premium' && premiumData ? premiumData.technicalSkillsToDevelop : freeData.technicalSkills, premiumOnly: false },
    { title: "Key Soft Skills", icon: Users, items: reportType === 'premium' && premiumData ? premiumData.softSkillsToBuild : freeData.softSkills, premiumOnly: false },
    { title: "Tools & Platforms to Learn", icon: Laptop, items: reportType === 'premium' && premiumData ? premiumData.toolsAndSoftware : freeData.toolsAndPlatforms, premiumOnly: false },
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
             {reportType === 'free' && (
                <p className="text-sm text-muted-foreground">This is a summary. Upgrade for a detailed report!</p>
            )}
          </div>
        </div>
        <Button onClick={handleCopyToClipboard} variant="outline">
          <Copy className="mr-2 h-4 w-4" /> Copy Results
        </Button>
      </div>
      
      {reportType === 'free' && !isPremiumLoading && (
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
              onClick={onUpgradeToPremium}
              disabled={isPremiumLoading}
            >
              {isPremiumLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Upgrade to Premium Report (₦1000 - Simulated)
            </Button>
             <p className="text-xs text-muted-foreground text-center mt-2">(Payment is simulated for this demo and will not be charged)</p>
          </CardContent>
        </Card>
      )}
      {isPremiumLoading && reportType === 'free' && (
         <div className="flex flex-col items-center justify-center text-center p-10 rounded-lg shadow-lg bg-card max-w-md mx-auto">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <p className="text-xl font-semibold text-primary">Generating your premium report...</p>
            <p className="text-muted-foreground mt-2">This can take a bit longer. Please hang tight!</p>
          </div>
      )}

      {/* Common Sections for Free & Basic Premium */}
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

      {/* Free Report Specific Sections */}
      {reportType === 'free' && (
        <>
          {freeData.courseSuggestions && freeData.courseSuggestions.length > 0 && (
            <SectionCard title="Course Suggestions" icon={BookOpenCheck}>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                {freeData.courseSuggestions.map((course, index) => {
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
              <p className="mt-3 text-sm text-muted-foreground">Unlock more course recommendations and direct links in our Premium Report.</p>
            </SectionCard>
          )}
          {freeData.beginnerProjectIdea && (
            <SectionCard title="Beginner Project Idea" icon={Lightbulb}>
              <p className="text-foreground/90">{freeData.beginnerProjectIdea}</p>
              <p className="mt-3 text-sm text-muted-foreground">Get more detailed project ideas and steps in our Premium Report.</p>
            </SectionCard>
          )}
        </>
      )}
      
      {/* Premium Report Specific Sections */}
      {reportType === 'premium' && premiumData && (
        <>
          <SectionCard title="In-Depth Career Summary" icon={FileText}>
            <p className="text-foreground/90 whitespace-pre-line">{premiumData.careerSummary}</p>
          </SectionCard>

          <SectionCard title="Personalized Career Roadmap" icon={GraduationCap}>
            <Accordion type="single" collapsible className="w-full">
              {premiumData.careerRoadmap.map((stage, index) => (
                <AccordionItem value={`stage-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {stage.stage}: <span className="font-normal text-muted-foreground ml-2">{stage.focus}</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pl-2">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Skills to Learn:</h4>
                      <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">
                        {stage.skillsToLearn.map((skill, i) => <li key={i}>{skill}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Project Examples:</h4>
                       <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">
                        {stage.projectExamples.map((proj, i) => <li key={i}>{proj}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Key Milestones:</h4>
                       <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">
                        {stage.milestones.map((milestone, i) => <li key={i}>{milestone}</li>)}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          {premiumData.skillGapAnalysis && (
            <SectionCard title="Skill Gap Analysis" icon={TargetIcon}>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-md mb-1">Your Current Skills:</h4>
                  {premiumData.skillGapAnalysis.identifiedCurrentSkills && premiumData.skillGapAnalysis.identifiedCurrentSkills.length > 0 ? (
                    <ul className="list-disc list-inside text-foreground/80 space-y-0.5">
                      {premiumData.skillGapAnalysis.identifiedCurrentSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                    </ul>
                  ) : <p className="text-muted-foreground text-sm">No current skills provided or inferred. Analysis is based on general needs for the path.</p>}
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-1">Essential Skills for This Path:</h4>
                  <ul className="list-disc list-inside text-foreground/80 space-y-0.5">
                    {premiumData.skillGapAnalysis.essentialSkillsForPath.map((skill, i) => <li key={i}>{skill}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-1 text-primary">Skills to Bridge / Develop:</h4>
                  <ul className="list-disc list-inside text-primary/90 space-y-0.5">
                    {premiumData.skillGapAnalysis.skillsToBridge.map((skill, i) => <li key={i}>{skill}</li>)}
                  </ul>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Curated Learning Resources" icon={BookCopy}>
            <Accordion type="multiple" className="w-full">
              {premiumData.learningResources.map((category, index) => (
                <AccordionItem value={`lr-cat-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">{category.category}</AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-2">
                    {category.resources.map((res, i) => (
                      <div key={i} className="p-2 border-b border-border/50 last:border-b-0">
                        <h5 className="font-semibold">{res.title} <Badge variant={res.isFree ? "secondary" : "outline"} className="ml-2 text-xs">{res.isFree ? "Free" : "Paid"}</Badge></h5>
                        <p className="text-sm text-muted-foreground">Type: {res.type}</p>
                        {res.urlSuggestion && <p className="text-sm text-muted-foreground">Platform/Suggestion: {res.urlSuggestion}</p>}
                         {findAffiliateLink(res.title) ? (
                            <Link href={findAffiliateLink(res.title)!.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                                View Course (Partner Link) <Badge variant="outline" className="ml-1 border-primary/50 text-primary text-xs">Partner</Badge>
                            </Link>
                        ) : res.urlSuggestion && (res.type === "Course" || res.type === "Video Series") && (
                           <a href={`https://www.google.com/search?q=${encodeURIComponent(res.title + " " + res.urlSuggestion)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline">
                             Search for this resource
                           </a>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>
          
          <SectionCard title="Recommended Certifications" icon={CheckCircle}>
            <ul className="space-y-3">
              {premiumData.recommendedCertifications.map((cert, index) => (
                <li key={index} className="p-2 border rounded-md bg-card">
                  <h5 className="font-semibold">{cert.name}</h5>
                  <p className="text-sm text-muted-foreground">Issued by: {cert.issuingBody}</p>
                  <p className="text-sm text-foreground/90 mt-1">Relevance: {cert.relevance}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Detailed Sample Projects" icon={Lightbulb}>
             <Accordion type="single" collapsible className="w-full">
              {premiumData.sampleProjectsDetailed.map((proj, index) => (
                <AccordionItem value={`proj-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {proj.title} <Badge variant="outline" className="ml-2">{proj.difficulty}</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-2">
                    <p className="text-foreground/90">{proj.description}</p>
                    <div>
                      <h5 className="font-semibold text-sm mb-1">Learning Outcomes:</h5>
                      <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">
                        {proj.learningOutcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          <SectionCard title="Resume Tailoring Tips" icon={Users2}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">
              {premiumData.resumeTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Job Market Insights" icon={Globe}>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-md mb-1 text-primary">Local Nigerian Market:</h4>
                <p className="text-foreground/90 whitespace-pre-line">{premiumData.jobMarketInsight.localNigeria}</p>
              </div>
              <div>
                <h4 className="font-semibold text-md mb-1 text-primary">Remote & Global Opportunities:</h4>
                <p className="text-foreground/90 whitespace-pre-line">{premiumData.jobMarketInsight.remoteGlobal}</p>
              </div>
            </div>
          </SectionCard>
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

    