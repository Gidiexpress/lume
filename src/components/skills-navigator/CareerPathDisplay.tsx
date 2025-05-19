
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
  Briefcase, CodeXml, Users, Laptop, BookOpenCheck, Lightbulb, Copy, Mail, Loader2, AlertTriangle, Sparkles, Award, Zap, CheckCircle, BarChart2, Users2, BookCopy, FileText, Globe, Target as TargetIcon, GraduationCap, ExternalLink, Palette, TrendingUp, DollarSign, ShieldQuestion, Info, BookMarked, Download
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useActionState, useFormStatus } from 'react-dom'; 
import { emailResultsAction, type EmailFormState } from '@/app/actions';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from '@/components/ui/progress';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface CareerPathDisplayProps {
  data: CareerPathOutput | PremiumCareerPathOutput;
  reportType: 'free' | 'premium';
  onUpgradeToPremium: () => void;
  isPremiumLoading: boolean;
}

function formatSinglePremiumReportForCopy(report: PremiumCareerPathOutput['suggestedCareerPaths'][0]['detailedReport']): string {
  let text = "";
  text += `\n--- Detailed Report for: ${report.careerRoleSummary.roleTitle} ---\n`;
  
  text += `\n== Career Role Summary ==\n`;
  text += `Explanation: ${report.careerRoleSummary.explanation}\n`;
  text += `Typical Responsibilities:\n- ${report.careerRoleSummary.typicalResponsibilities.join('\n- ')}\n`;
  if (report.careerRoleSummary.specializations && report.careerRoleSummary.specializations.length > 0) {
    text += `Specializations:\n`;
    report.careerRoleSummary.specializations.forEach(spec => {
      text += `  - ${spec.name}: ${spec.description}\n`;
    });
  }

  text += `\n== Career Roadmap ==\n`;
  report.careerRoadmap.forEach(stage => {
    text += `Stage: ${stage.stageName} (${stage.duration})\n`;
    text += `  Focus: ${stage.focusAreas.join(', ')}\n`;
    text += `  Skills to Develop: ${stage.skillsToDevelop.join(', ')}\n`;
    text += `  Project Examples: ${stage.projectExamples.join(', ')}\n`;
    if (stage.typicalJobTitles && stage.typicalJobTitles.length > 0) {
      text += `  Typical Job Titles: ${stage.typicalJobTitles.join(', ')}\n`;
    }
    text += `  Key Milestones: ${stage.keyMilestones.join(', ')}\n\n`;
  });

  text += `== Skill Gap Assessment ==\n`;
  text += `Probable Existing Skills: ${report.skillGapAssessment.probableExistingSkills.join(', ')}\n`;
  text += `Critical Skills to Learn: ${report.skillGapAssessment.criticalSkillsToLearn.join(', ')}\n`;
  text += `Skill Readiness Score: ${report.skillGapAssessment.skillReadinessScore}/100\n`;
  text += `Explanation: ${report.skillGapAssessment.readinessExplanation}\n\n`;

  text += `== Learning Resources ==\n`;
  report.learningResources.forEach(res => {
    text += `- ${res.title} – ${res.platform}${res.urlSuggestion ? ` (Link/Search: ${res.urlSuggestion})` : ''} ${res.isFree ? '(Free)' : '(Paid)'}\n`;
  });
  text += `\n`;

  text += `== Recommended Certifications ==\n`;
  report.recommendedCertifications.forEach(cert => {
    text += `- ${cert.name} (by ${cert.issuingBody})\n`;
    text += `  Cost: ${cert.estimatedCost || 'N/A'}\n`;
    text += `  Benefit: ${cert.hiringBenefit}\n\n`;
  });

  text += `== Tools & Software ==\n`;
  text += `Beginner: ${report.toolsAndSoftware.beginner.join(', ')}\n`;
  text += `Intermediate: ${report.toolsAndSoftware.intermediate.join(', ')}\n`;
  text += `Advanced: ${report.toolsAndSoftware.advanced.join(', ')}\n\n`;

  text += `== Sample Projects ==\n`;
  report.sampleProjects.forEach(proj => {
    text += `Project: ${proj.title}\n`;
    text += `  Problem: ${proj.problemStatement}\n`;
    if (proj.learningOutcomes) text += `  Learnings: ${proj.learningOutcomes.join(', ')}\n`;
    if (proj.difficulty) text += `  Difficulty: ${proj.difficulty}\n\n`;
  });
  
  text += `== Soft Skills ==\n`;
  report.softSkills.forEach(skill => {
    text += `- ${skill.skillName}: ${skill.improvementSuggestion}\n`;
    if(skill.importance) text += ` (Importance: ${skill.importance})\n`;
  });
  text += `\n`;

  text += `== Job Market Insight ==\n`;
  text += `Nigerian Entry Salary: ${report.jobMarketInsight.entryLevelSalaryNigeria}\n`;
  text += `Global Remote Outlook: ${report.jobMarketInsight.globalRemoteOutlook}\n`;
  text += `Remote Work Popularity: ${report.jobMarketInsight.remoteWorkPopularity}\n\n`;

  text += `== Resume Writing Tips ==\n`;
  text += `Tips:\n- ${report.resumeWritingTips.tips.join('\n- ')}\n`;
  text += `Hiring Manager Focus: ${report.resumeWritingTips.hiringManagerFocus}\n\n`;
  return text;
}


function formatResultsForCopy(data: CareerPathOutput | PremiumCareerPathOutput, reportType: 'free' | 'premium'): string {
  let text = `Lume - Your ${reportType === 'premium' ? 'Premium Multi-Path' : 'Free Summary'} Career Report\n\n`;
  
  if (reportType === 'premium') {
    const premiumData = data as PremiumCareerPathOutput;
    if (premiumData.suggestedCareerPaths && premiumData.suggestedCareerPaths.length > 0) {
      text += `Lume has identified the following career paths for you based on your profile:\n`;
      premiumData.suggestedCareerPaths.forEach((path, index) => {
        text += `\n**************************************************\n`;
        text += `PATH ${index + 1}: ${path.pathName}\n`;
        text += `**************************************************\n`;
        text += `Summary: ${path.summary}\n`;
        text += formatSinglePremiumReportForCopy(path.detailedReport);
      });
    } else {
      text += "No career paths were suggested in this premium report.\n";
    }
  } else { // Free report
      const freeData = data as CareerPathOutput;
      text += `Job Roles:\n- ${freeData.jobRoles.join('\n- ')}\n\n`;
      text += `Technical Skills:\n- ${freeData.technicalSkills.join('\n- ')}\n\n`;
      text += `Soft Skills:\n- ${freeData.softSkills.join('\n- ')}\n\n`;
      text += `Tools & Platforms:\n- ${freeData.toolsAndPlatforms.join('\n- ')}\n\n`;
      text += `Course Suggestions:\n- ${freeData.courseSuggestions.join('\n- ')}\n\n`;
      text += `Beginner Project Idea:\n${freeData.beginnerProjectIdea}\n`;
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
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


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

  useEffect(() => {
    if (reportType === 'premium' && premiumData?.suggestedCareerPaths?.length) {
      setActiveAccordionItem(`path-${0}`); // Open the first path by default
    }
  }, [data, reportType]);

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

  const handleDownloadPdf = async () => {
    if (reportType !== 'premium') return;
    const reportElement = document.getElementById('premium-report-content');
    if (!reportElement) {
      toast({
        title: "Error",
        description: "Could not find report content to generate PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // If you have external images
        scrollY: -window.scrollY, // Capture from the top
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, mm, A4 size
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      const ratio = imgWidth / imgHeight;
      let newImgWidth = pdfWidth - 20; // With some margin
      let newImgHeight = newImgWidth / ratio;
      
      let heightLeft = newImgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, 'PNG', 10, position, newImgWidth, newImgHeight); // X, Y, Width, Height
      heightLeft -= (pdfHeight - 20); // Subtract first page height (with margins)

      while (heightLeft > 0) {
        position = heightLeft - newImgHeight + 10; // Top margin for new page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, newImgWidth, newImgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save('Lume_Premium_Report.pdf');
      toast({
        title: "PDF Downloaded",
        description: "Your premium report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const freeData = reportType === 'free' ? data as CareerPathOutput : null;
  const premiumData = reportType === 'premium' ? data as PremiumCareerPathOutput : null;

  const renderListItem = (item: string, index: number) => <li key={index} className="text-sm">{item}</li>;
  
  const renderDetailedReport = (report: PremiumCareerPathOutput['suggestedCareerPaths'][0]['detailedReport']) => {
    return (
      <div className="space-y-6 pt-4">
        <SectionCard title={`Career Role Summary: ${report.careerRoleSummary.roleTitle}`} icon={FileText}>
            <p className="text-foreground/90 mb-3 whitespace-pre-line">{report.careerRoleSummary.explanation}</p>
            <h4 className="font-semibold text-md mt-4 mb-2">Typical Responsibilities:</h4>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              {report.careerRoleSummary.typicalResponsibilities.map(renderListItem)}
            </ul>
            {report.careerRoleSummary.specializations && report.careerRoleSummary.specializations.length > 0 && (
              <>
                <h4 className="font-semibold text-md mt-4 mb-2">Potential Specializations:</h4>
                <Accordion type="multiple" className="w-full">
                  {report.careerRoleSummary.specializations.map((spec, idx) => (
                    <AccordionItem value={`spec-${report.careerRoleSummary.roleTitle}-${idx}`} key={`spec-${report.careerRoleSummary.roleTitle}-${idx}`}>
                      <AccordionTrigger>{spec.name}</AccordionTrigger>
                      <AccordionContent>{spec.description}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </SectionCard>

          <SectionCard title="Personalized Career Roadmap" icon={GraduationCap}>
            <Accordion type="single" collapsible className="w-full" defaultValue={`stage-${report.careerRoleSummary.roleTitle}-0`}>
              {report.careerRoadmap.map((stage, index) => (
                <AccordionItem value={`stage-${report.careerRoleSummary.roleTitle}-${index}`} key={`stage-${report.careerRoleSummary.roleTitle}-${index}`}>
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
                  <Badge variant="secondary" className="text-lg">{report.skillGapAssessment.skillReadinessScore} / 100</Badge>
                </div>
                <Progress value={report.skillGapAssessment.skillReadinessScore} className="w-full h-3 mb-2" />
                <p className="text-sm text-muted-foreground">{report.skillGapAssessment.readinessExplanation}</p>
              </div>
              <div>
                <h5 className="font-semibold text-sm mb-1">Probable Existing Skills (from your background):</h5>
                {report.skillGapAssessment.probableExistingSkills.length > 0 ? (
                  <ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{report.skillGapAssessment.probableExistingSkills.map(renderListItem)}</ul>
                ) : <p className="text-sm text-muted-foreground">None specifically identified, focus on building foundational skills.</p>}
              </div>
              <div>
                <h5 className="font-semibold text-sm mb-1 text-primary">Critical Skills to Learn for This Path:</h5>
                <ul className="list-disc list-inside text-primary/90 text-sm space-y-0.5">{report.skillGapAssessment.criticalSkillsToLearn.map(renderListItem)}</ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Curated Learning Resources" icon={BookCopy}>
            <div className="space-y-3">
              {report.learningResources.map((res, index) => {
                const affiliateLink = findAffiliateLink(res.title);
                const finalUrl = affiliateLink ? affiliateLink.affiliateUrl : (res.urlSuggestion && res.urlSuggestion.startsWith('http') ? res.urlSuggestion : `https://www.google.com/search?q=${encodeURIComponent(res.title + " " + res.platform)}`);
                const linkText = affiliateLink ? (affiliateLink.displayText || res.title) : res.title;

                return (
                  <div key={`learn-${report.careerRoleSummary.roleTitle}-${index}`} className="p-3 border rounded-md bg-background/50 hover:shadow-md transition-shadow">
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
              {report.recommendedCertifications.map((cert, index) => (
                <AccordionItem value={`cert-${report.careerRoleSummary.roleTitle}-${index}`} key={`cert-${report.careerRoleSummary.roleTitle}-${index}`}>
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
              <div><h5 className="font-semibold text-sm mb-1">Beginner Friendly:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{report.toolsAndSoftware.beginner.map(renderListItem)}</ul></div>
              <div><h5 className="font-semibold text-sm mb-1">Intermediate Level:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{report.toolsAndSoftware.intermediate.map(renderListItem)}</ul></div>
              <div><h5 className="font-semibold text-sm mb-1">Advanced Professional:</h5><ul className="list-disc list-inside text-foreground/80 text-sm space-y-0.5">{report.toolsAndSoftware.advanced.map(renderListItem)}</ul></div>
            </div>
          </SectionCard>

          <SectionCard title="Sample Project Ideas" icon={Lightbulb}>
             <Accordion type="single" collapsible className="w-full" defaultValue={`proj-${report.careerRoleSummary.roleTitle}-0`}>
              {report.sampleProjects.map((proj, index) => (
                <AccordionItem value={`proj-${report.careerRoleSummary.roleTitle}-${index}`} key={`proj-${report.careerRoleSummary.roleTitle}-${index}`}>
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
              {report.softSkills.map((skill, index) => (
                 <AccordionItem value={`softskill-${report.careerRoleSummary.roleTitle}-${index}`} key={`softskill-${report.careerRoleSummary.roleTitle}-${index}`}>
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
                <p className="text-foreground/90 text-lg">{report.jobMarketInsight.entryLevelSalaryNigeria}</p>
              </div>
              <div>
                <h5 className="font-semibold text-md mb-1 flex items-center"><Globe className="mr-2 h-5 w-5 text-blue-500"/>Global Remote Outlook:</h5>
                <p className="text-foreground/90">{report.jobMarketInsight.globalRemoteOutlook}</p>
              </div>
              <div>
                <h5 className="font-semibold text-md mb-1 flex items-center"><Laptop className="mr-2 h-5 w-5"/>Remote Work Popularity:</h5>
                <p className="text-foreground/90">{report.jobMarketInsight.remoteWorkPopularity}</p>
              </div>
            </div>
          </SectionCard>
          
          <SectionCard title="Resume Writing Guidance" icon={Palette}>
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-md mb-1">Key Optimization Tips:</h5>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                  {report.resumeWritingTips.tips.map(renderListItem)}
                </ul>
              </div>
               <div>
                <h5 className="font-semibold text-md mb-1">What Hiring Managers Look For (Freshers):</h5>
                <p className="text-foreground/90 whitespace-pre-line">{report.resumeWritingTips.hiringManagerFocus}</p>
              </div>
            </div>
          </SectionCard>
      </div>
    );
  };

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
              Your {reportType === 'premium' ? 'Premium Multi-Path' : 'Free Summary'} Report
            </h2>
             {reportType === 'free' && (
                <p className="text-sm text-muted-foreground">This is a starting point. Explore below or upgrade for an in-depth multi-path analysis!</p>
            )}
             {reportType === 'premium' && premiumData?.suggestedCareerPaths && (
                <p className="text-sm text-muted-foreground">Lume has identified {premiumData.suggestedCareerPaths.length} potential career paths for you. Explore each below.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCopyToClipboard} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy Report
            </Button>
            {reportType === 'premium' && premiumData && (
              <Button onClick={handleDownloadPdf} variant="outline" disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
            )}
        </div>
      </div>
      
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
      
      {/* PREMIUM REPORT DISPLAY (MULTI-PATH) */}
      {premiumData && reportType === 'premium' && (
        premiumData.suggestedCareerPaths && premiumData.suggestedCareerPaths.length > 0 ? (
          <div id="premium-report-content" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <BookMarked className="mr-2 h-6 w-6 text-primary"/>
                        Your Personalized Career Path Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        We've analyzed your profile and identified the following career paths as strong potential fits for you. Explore each one to see a detailed breakdown.
                    </p>
                    <Accordion 
                        type="single" 
                        collapsible 
                        className="w-full" 
                        value={activeAccordionItem}
                        onValueChange={setActiveAccordionItem}
                    >
                        {premiumData.suggestedCareerPaths.map((path, index) => (
                        <AccordionItem value={`path-${index}`} key={`path-${index}`}>
                            <AccordionTrigger className="text-lg hover:no-underline">
                                <div className="flex flex-col text-left">
                                    <span>{index + 1}. {path.pathName}</span>
                                    <span className="text-sm font-normal text-muted-foreground mt-1 pr-2">{path.summary}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {renderDetailedReport(path.detailedReport)}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
          </div>
        ) : (
          <SectionCard title="Premium Report" icon={Info}>
            <p className="text-muted-foreground">No specific career paths were suggested in your premium report. This might be an issue with the generation process. Please try again or contact support if the problem persists.</p>
          </SectionCard>
        )
      )}

      {/* Moved "Upgrade to Premium" card here for free reports */}
      {reportType === 'free' && (
        <Card className="bg-primary/5 border-primary/20 shadow-lg dark:bg-primary/10 mt-12">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Zap className="mr-2 h-6 w-6" />
              Unlock Your Full Potential!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/90">
              You've got the basics! Elevate your career planning with our Premium Report. Get multiple tailored career path suggestions, each with a detailed roadmap, skill gap analysis, curated learning resources, project ideas, resume tips, and Nigerian job market insights.
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
              Upgrade to Premium Report (₦1000)
            </Button>
          </CardContent>
        </Card>
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

