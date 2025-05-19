
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
  Briefcase, CodeXml, Users, Laptop, BookOpenCheck, Lightbulb, Copy, Mail, Loader2, AlertTriangle, Sparkles, Award, Zap, CheckCircle, BarChart2, Users2, BookCopy, FileText, Globe, Target as TargetIcon, GraduationCap, ExternalLink, Palette, TrendingUp, DollarSign, ShieldQuestion
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useActionState } from 'react'; 
import { useFormStatus } from 'react-dom'; // Corrected import for useFormStatus
import { emailResultsAction, type EmailFormState } from '@/app/actions';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from '@/components/ui/progress';


interface CareerPathDisplayProps {
  data: CareerPathOutput | PremiumCareerPathOutput;
  reportType: 'free' | 'premium';
  onUpgradeToPremium: () => void;
  isPremiumLoading: boolean;
}

function formatResultsForCopy(data: CareerPathOutput | PremiumCareerPathOutput, reportType: 'free' | 'premium'): string {
  let text = `Lume - Your ${reportType === 'premium' ? 'Premium' : 'Free'} Career Path Report\n\n`;
  
  const isPremium = reportType === 'premium';
  const reportData = data as PremiumCareerPathOutput; // Use Premium type for easier access, free fields are subset.

  if (isPremium && reportData.careerRoleSummary) {
    text += `== Career Role Summary: ${reportData.careerRoleSummary.roleTitle} ==\n`;
    text += `Explanation: ${reportData.careerRoleSummary.explanation}\n`;
    text += `Typical Responsibilities:\n- ${reportData.careerRoleSummary.typicalResponsibilities.join('\n- ')}\n`;
    if (reportData.careerRoleSummary.specializations && reportData.careerRoleSummary.specializations.length > 0) {
      text += `Specializations:\n`;
      reportData.careerRoleSummary.specializations.forEach(spec => {
        text += `  - ${spec.name}: ${spec.description}\n`;
      });
    }
    text += `\n`;
  } else if (!isPremium) { // Fallback for free report basic structure
      const freeData = data as CareerPathOutput;
      text += `Job Roles:\n- ${freeData.jobRoles.join('\n- ')}\n\n`;
      text += `Technical Skills:\n- ${freeData.technicalSkills.join('\n- ')}\n\n`;
      text += `Soft Skills:\n- ${freeData.softSkills.join('\n- ')}\n\n`;
      text += `Tools & Platforms:\n- ${freeData.toolsAndPlatforms.join('\n- ')}\n\n`;
  }


  if (isPremium && reportData.careerRoadmap) {
    text += `== Career Roadmap ==\n`;
    reportData.careerRoadmap.forEach(stage => {
      text += `Stage: ${stage.stageName} (${stage.duration})\n`;
      text += `  Focus: ${stage.focusAreas.join(', ')}\n`;
      text += `  Skills to Develop: ${stage.skillsToDevelop.join(', ')}\n`;
      text += `  Project Examples: ${stage.projectExamples.join(', ')}\n`;
      if (stage.typicalJobTitles && stage.typicalJobTitles.length > 0) {
        text += `  Typical Job Titles: ${stage.typicalJobTitles.join(', ')}\n`;
      }
      text += `  Key Milestones: ${stage.keyMilestones.join(', ')}\n\n`;
    });
  }

  if (isPremium && reportData.skillGapAssessment) {
    text += `== Skill Gap Assessment ==\n`;
    text += `Probable Existing Skills: ${reportData.skillGapAssessment.probableExistingSkills.join(', ')}\n`;
    text += `Critical Skills to Learn: ${reportData.skillGapAssessment.criticalSkillsToLearn.join(', ')}\n`;
    text += `Skill Readiness Score: ${reportData.skillGapAssessment.skillReadinessScore}/100\n`;
    text += `Explanation: ${reportData.skillGapAssessment.readinessExplanation}\n\n`;
  }

  if (isPremium && reportData.learningResources) {
    text += `== Learning Resources ==\n`;
    reportData.learningResources.forEach(res => {
      text += `- ${res.title} – ${res.platform}${res.urlSuggestion ? ` (Link/Search: ${res.urlSuggestion})` : ''} ${res.isFree ? '(Free)' : '(Paid)'}\n`;
    });
    text += `\n`;
  } else if (!isPremium) {
    const freeData = data as CareerPathOutput;
     text += `Course Suggestions:\n- ${freeData.courseSuggestions.join('\n- ')}\n\n`;
  }

  if (isPremium && reportData.recommendedCertifications) {
    text += `== Recommended Certifications ==\n`;
    reportData.recommendedCertifications.forEach(cert => {
      text += `- ${cert.name} (by ${cert.issuingBody})\n`;
      text += `  Cost: ${cert.estimatedCost || 'N/A'}\n`;
      text += `  Benefit: ${cert.hiringBenefit}\n\n`;
    });
  }

  if (isPremium && reportData.toolsAndSoftware) {
    text += `== Tools & Software ==\n`;
    text += `Beginner: ${reportData.toolsAndSoftware.beginner.join(', ')}\n`;
    text += `Intermediate: ${reportData.toolsAndSoftware.intermediate.join(', ')}\n`;
    text += `Advanced: ${reportData.toolsAndSoftware.advanced.join(', ')}\n\n`;
  }

  if (isPremium && reportData.sampleProjects) {
    text += `== Sample Projects ==\n`;
    reportData.sampleProjects.forEach(proj => {
      text += `Project: ${proj.title}\n`;
      text += `  Problem: ${proj.problemStatement}\n`;
      if (proj.learningOutcomes) text += `  Learnings: ${proj.learningOutcomes.join(', ')}\n`;
      if (proj.difficulty) text += `  Difficulty: ${proj.difficulty}\n\n`;
    });
  } else if (!isPremium) {
     const freeData = data as CareerPathOutput;
     text += `Beginner Project Idea:\n${freeData.beginnerProjectIdea}\n`;
  }

  if (isPremium && reportData.softSkills) {
    text += `== Soft Skills ==\n`;
    reportData.softSkills.forEach(skill => {
      text += `- ${skill.skillName}: ${skill.improvementSuggestion}\n`;
      if(skill.importance) text += ` (Importance: ${skill.importance})\n`;
    });
    text += `\n`;
  }

  if (isPremium && reportData.jobMarketInsight) {
    text += `== Job Market Insight ==\n`;
    text += `Nigerian Entry Salary: ${reportData.jobMarketInsight.entryLevelSalaryNigeria}\n`;
    text += `Global Remote Outlook: ${reportData.jobMarketInsight.globalRemoteOutlook}\n`;
    text += `Remote Work Popularity: ${reportData.jobMarketInsight.remoteWorkPopularity}\n\n`;
  }

  if (isPremium && reportData.resumeWritingTips) {
    text += `== Resume Writing Tips ==\n`;
    text += `Tips:\n- ${reportData.resumeWritingTips.tips.join('\n- ')}\n`;
    text += `Hiring Manager Focus: ${reportData.resumeWritingTips.hiringManagerFocus}\n`;
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

  const freeData = reportType === 'free' ? data as CareerPathOutput : null;
  const premiumData = reportType === 'premium' ? data as PremiumCareerPathOutput : null;

  const renderListItem = (item: string, index: number) => <li key={index}>{item}</li>;

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
              Your {reportType === 'premium' ? 'Premium Quality' : 'Free Summary'} Report
            </h2>
             {reportType === 'free' && (
                <p className="text-sm text-muted-foreground">This is a starting point. Upgrade for an in-depth roadmap!</p>
            )}
          </div>
        </div>
        <Button onClick={handleCopyToClipboard} variant="outline">
          <Copy className="mr-2 h-4 w-4" /> Copy Report
        </Button>
      </div>
      
      {reportType === 'free' && (
        <Card className="bg-primary/5 border-primary/20 shadow-lg dark:bg-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Zap className="mr-2 h-6 w-6" />
              Unlock Your Full Potential!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/90">
              You've got the basics! Elevate your career planning with our Premium Report. Get a detailed roadmap, skill gap analysis, curated learning resources, project ideas, resume tips, and Nigerian job market insights.
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

      {/* FREE REPORT DISPLAY */}
      {freeData && reportType === 'free' && (
        <>
          <SectionCard title="Suggested Job Roles" icon={Briefcase}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">{freeData.jobRoles.map(renderListItem)}</ul>
          </SectionCard>
          <SectionCard title="Basic Technical Skills" icon={CodeXml}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">{freeData.technicalSkills.map(renderListItem)}</ul>
          </SectionCard>
          <SectionCard title="Essential Soft Skills" icon={Users}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">{freeData.softSkills.map(renderListItem)}</ul>
          </SectionCard>
          <SectionCard title="Common Tools & Platforms" icon={Laptop}>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/90">{freeData.toolsAndPlatforms.map(renderListItem)}</ul>
          </SectionCard>
          {freeData.courseSuggestions && freeData.courseSuggestions.length > 0 && (
            <SectionCard title="General Course Suggestions" icon={BookOpenCheck}>
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
            </SectionCard>
          )}
          {freeData.beginnerProjectIdea && (
            <SectionCard title="Simple Beginner Project Idea" icon={Lightbulb}>
              <p className="text-foreground/90">{freeData.beginnerProjectIdea}</p>
            </SectionCard>
          )}
        </>
      )}
      
      {/* PREMIUM REPORT DISPLAY */}
      {premiumData && reportType === 'premium' && (
        <>
          <SectionCard title={`Career Role Summary: ${premiumData.careerRoleSummary.roleTitle}`} icon={FileText}>
            <p className="text-foreground/90 mb-3 whitespace-pre-line">{premiumData.careerRoleSummary.explanation}</p>
            <h4 className="font-semibold text-md mt-4 mb-2">Typical Responsibilities:</h4>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              {premiumData.careerRoleSummary.typicalResponsibilities.map(renderListItem)}
            </ul>
            {premiumData.careerRoleSummary.specializations && premiumData.careerRoleSummary.specializations.length > 0 && (
              <>
                <h4 className="font-semibold text-md mt-4 mb-2">Potential Specializations:</h4>
                <Accordion type="multiple" className="w-full">
                  {premiumData.careerRoleSummary.specializations.map((spec, idx) => (
                    <AccordionItem value={`spec-${idx}`} key={idx}>
                      <AccordionTrigger>{spec.name}</AccordionTrigger>
                      <AccordionContent>{spec.description}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </SectionCard>

          <SectionCard title="Personalized Career Roadmap" icon={GraduationCap}>
            <Accordion type="single" collapsible className="w-full">
              {premiumData.careerRoadmap.map((stage, index) => (
                <AccordionItem value={`stage-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {stage.stageName} <span className="text-sm text-muted-foreground ml-2">({stage.duration})</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pl-2">
                    <div><h5 className="font-semibold mb-1">Focus Areas:</h5><ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">{stage.focusAreas.map(renderListItem)}</ul></div>
                    <div><h5 className="font-semibold mb-1">Skills to Develop:</h5><ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">{stage.skillsToDevelop.map(renderListItem)}</ul></div>
                    <div><h5 className="font-semibold mb-1">Project Examples:</h5><ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">{stage.projectExamples.map(renderListItem)}</ul></div>
                    {stage.typicalJobTitles && stage.typicalJobTitles.length > 0 && (
                      <div><h5 className="font-semibold mb-1">Typical Job Titles:</h5><ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">{stage.typicalJobTitles.map(renderListItem)}</ul></div>
                    )}
                    <div><h5 className="font-semibold mb-1">Key Milestones:</h5><ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">{stage.keyMilestones.map(renderListItem)}</ul></div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          <SectionCard title="Skill Gap Assessment" icon={TargetIcon}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-md">Skill Readiness Score:</h4>
                  <Badge variant="secondary" className="text-lg">{premiumData.skillGapAssessment.skillReadinessScore} / 100</Badge>
                </div>
                <Progress value={premiumData.skillGapAssessment.skillReadinessScore} className="w-full h-3 mb-2" />
                <p className="text-sm text-muted-foreground">{premiumData.skillGapAssessment.readinessExplanation}</p>
              </div>
              <div>
                <h5 className="font-semibold text-sm mb-1">Probable Existing Skills (from your background):</h5>
                {premiumData.skillGapAssessment.probableExistingSkills.length > 0 ? (
                  <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{premiumData.skillGapAssessment.probableExistingSkills.map(renderListItem)}</ul>
                ) : <p className="text-sm text-muted-foreground">None specifically identified, focus on building foundational skills.</p>}
              </div>
              <div>
                <h5 className="font-semibold text-sm mb-1 text-primary">Critical Skills to Learn for This Path:</h5>
                <ul className="list-disc list-inside text-primary/90 text-sm space-y-0.5">{premiumData.skillGapAssessment.criticalSkillsToLearn.map(renderListItem)}</ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Curated Learning Resources" icon={BookCopy}>
            <div className="space-y-3">
              {premiumData.learningResources.map((res, index) => {
                const affiliateLink = findAffiliateLink(res.title);
                const finalUrl = affiliateLink ? affiliateLink.affiliateUrl : (res.urlSuggestion && res.urlSuggestion.startsWith('http') ? res.urlSuggestion : `https://www.google.com/search?q=${encodeURIComponent(res.title + " " + res.platform)}`);
                const linkText = affiliateLink ? (affiliateLink.displayText || res.title) : res.title;

                return (
                  <div key={index} className="p-3 border rounded-md bg-background/50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <h5 className="font-semibold">{linkText}</h5>
                       <Badge variant={res.isFree ? "secondary" : "outline"} className="text-xs whitespace-nowrap ml-2">{res.isFree ? "Free" : "Paid"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Platform: {res.platform}</p>
                    <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center">
                      {affiliateLink ? "View Course (Partner)" : (res.urlSuggestion && res.urlSuggestion.startsWith('http') ? "Visit Link" : "Search Resource")}
                       <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                     {affiliateLink && <Badge variant="outline" className="ml-2 border-primary/50 text-primary text-xs">Partner Link</Badge>}
                  </div>
                );
              })}
            </div>
          </SectionCard>
          
          <SectionCard title="Recommended Certifications" icon={Award}>
             <Accordion type="multiple" className="w-full">
              {premiumData.recommendedCertifications.map((cert, index) => (
                <AccordionItem value={`cert-${index}`} key={index}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex-1 text-left">
                      {cert.name}
                      <p className="text-xs text-muted-foreground font-normal">by {cert.issuingBody} {cert.estimatedCost && `(${cert.estimatedCost})`}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/90 pl-2">{cert.hiringBenefit}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          <SectionCard title="Tools & Software to Master" icon={Laptop}>
            <div className="space-y-3">
              <div><h5 className="font-semibold text-sm mb-1">Beginner Friendly:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{premiumData.toolsAndSoftware.beginner.map(renderListItem)}</ul></div>
              <div><h5 className="font-semibold text-sm mb-1">Intermediate Level:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{premiumData.toolsAndSoftware.intermediate.map(renderListItem)}</ul></div>
              <div><h5 className="font-semibold text-sm mb-1">Advanced Professional:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{premiumData.toolsAndSoftware.advanced.map(renderListItem)}</ul></div>
            </div>
          </SectionCard>

          <SectionCard title="Sample Project Ideas" icon={Lightbulb}>
             <Accordion type="single" collapsible className="w-full">
              {premiumData.sampleProjects.map((proj, index) => (
                <AccordionItem value={`proj-${index}`} key={index}>
                  <AccordionTrigger className="hover:no-underline text-left">
                    {proj.title} 
                    {proj.difficulty && <Badge variant="outline" className="ml-2 font-normal">{proj.difficulty}</Badge>}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-2">
                    <p className="text-sm text-muted-foreground italic">"{proj.problemStatement}"</p>
                    {proj.learningOutcomes && proj.learningOutcomes.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-xs mt-2 mb-1">Key Learnings:</h5>
                        <ul className="list-disc list-inside text-foreground/80 text-xs space-y-0.5">
                          {proj.learningOutcomes.map(renderListItem)}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          <SectionCard title="Essential Soft Skills Development" icon={Users2}>
            <Accordion type="multiple" className="w-full">
              {premiumData.softSkills.map((skill, index) => (
                 <AccordionItem value={`softskill-${index}`} key={index}>
                  <AccordionTrigger className="hover:no-underline">{skill.skillName}</AccordionTrigger>
                  <AccordionContent className="space-y-1.5 pl-2">
                    {skill.importance && <p className="text-sm text-muted-foreground">Importance: {skill.importance}</p>}
                    <p className="text-sm text-foreground/90">Suggestion: {skill.improvementSuggestion}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          <SectionCard title="Job Market Insights" icon={TrendingUp}>
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-md mb-1 flex items-center"><DollarSign className="mr-2 h-5 w-5 text-green-500"/>Nigerian Entry-Level Salary:</h5>
                <p className="text-foreground/90 text-lg">{premiumData.jobMarketInsight.entryLevelSalaryNigeria}</p>
              </div>
              <div>
                <h5 className="font-semibold text-md mb-1 flex items-center"><Globe className="mr-2 h-5 w-5 text-blue-500"/>Global Remote Outlook:</h5>
                <p className="text-foreground/90">{premiumData.jobMarketInsight.globalRemoteOutlook}</p>
              </div>
              <div>
                <h5 className="font-semibold text-md mb-1 flex items-center"><Laptop className="mr-2 h-5 w-5"/>Remote Work Popularity:</h5>
                <p className="text-foreground/90">{premiumData.jobMarketInsight.remoteWorkPopularity}</p>
              </div>
            </div>
          </SectionCard>
          
          <SectionCard title="Resume Writing Guidance" icon={Palette}>
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-md mb-1">Key Optimization Tips:</h5>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                  {premiumData.resumeWritingTips.tips.map(renderListItem)}
                </ul>
              </div>
               <div>
                <h5 className="font-semibold text-md mb-1">What Hiring Managers Look For (Freshers):</h5>
                <p className="text-foreground/90 whitespace-pre-line">{premiumData.resumeWritingTips.hiringManagerFocus}</p>
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
