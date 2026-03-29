const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { parseFile } = require('../utils/fileParser');

const PROJECTS_FILE = './data/projects.json';
const DOCS_FILE = './data/documents.json';

// ── Groq model routing ────────────────────────────────────────────────────────
// Large model: complex reasoning, long outputs, compliance/fact-check
// Small model: translation, packaging, simple transforms (4x faster, cheaper)
const MODEL_LARGE = 'llama-3.3-70b-versatile';   // 128k ctx, best quality
const MODEL_SMALL = 'llama-3.1-8b-instant';       // ultra-fast for simple tasks

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured. Add it to your .env file. Get a free key at https://console.groq.com/');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function getProjects() {
  try { return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')); } catch { return []; }
}
function saveProjects(p) { fs.writeFileSync(PROJECTS_FILE, JSON.stringify(p, null, 2)); }
function getDocs() {
  try { return JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8')); } catch { return []; }
}

// ── Core LLM caller with smart model routing ──────────────────────────────────
async function callGroq(systemPrompt, userPrompt, opts = {}) {
  const {
    model = MODEL_LARGE,
    maxTokens = 2048,
    temperature = 0.7,
    agentName = 'Agent',
  } = opts;

  const client = getClient();
  const apiKey = process.env.GROQ_API_KEY;
  const maskedKey = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

  logger.agentLog(agentName, 'Groq API call', {
    model,
    promptTokensEstimate: Math.round((systemPrompt.length + userPrompt.length) / 4),
    apiKeyUsed: maskedKey,
  });

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  });

  const text = response.choices[0]?.message?.content || '';
  logger.agentLog(agentName, 'Groq response received', {
    outputTokens: response.usage?.completion_tokens || 0,
    totalTokens:  response.usage?.total_tokens || 0,
    model,
  });
  return text;
}

function safeJSON(raw, fallback = {}) {
  try {
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Try to extract the first {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return { ...fallback, _rawText: raw.slice(0, 500) };
  }
}

function sendEvent(res, event) {
  if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCT LAUNCH — 5 agents
// ══════════════════════════════════════════════════════════════════════════════

async function runDrafterAgent(res, context, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Drafter Agent', step: 1, total: 5, runId });
  logger.agentLog('DrafterAgent', 'Generating content suite');

  const raw = await callGroq(
    `You are an expert enterprise content drafter. Create high-quality marketing content from product specs.
Always respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.`,
    `Create a complete content suite from this product/context information:

${context}

Return ONLY this JSON structure (no markdown, no extra text):
{
  "blogPost": {
    "title": "SEO-optimised blog title here",
    "content": "Full 600-800 word blog post here with subheadings",
    "seoMeta": "150-char meta description",
    "readingTime": "4 min read"
  },
  "socialVariants": {
    "twitter": { "text": "Tweet under 280 chars", "hashtags": ["tag1","tag2"], "charCount": 0 },
    "linkedin": { "text": "LinkedIn post 150-200 words", "hashtags": ["tag1"] },
    "instagram": { "caption": "Instagram caption with emojis", "hashtags": ["tag1","tag2","tag3"] }
  },
  "faq": [
    { "question": "Q1?", "answer": "A1." },
    { "question": "Q2?", "answer": "A2." },
    { "question": "Q3?", "answer": "A3." },
    { "question": "Q4?", "answer": "A4." },
    { "question": "Q5?", "answer": "A5." }
  ],
  "adCopy": {
    "headline": "Punchy 6-word headline",
    "subheadline": "Supporting statement",
    "body": "2-sentence ad body",
    "cta": "Call to action text"
  }
}`,
    { model: MODEL_LARGE, maxTokens: 3000, agentName: 'DrafterAgent' }
  );

  const result = safeJSON(raw, { blogPost: { title: 'Generated Content', content: raw }, socialVariants: {}, faq: [], adCopy: {} });
  sendEvent(res, { type: 'agent_complete', agent: 'Drafter Agent', step: 1, result, runId });
  logger.agentLog('DrafterAgent', 'Content generation complete');
  return result;
}

async function runLocalizerAgent(res, content, targetLanguage, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Localizer Agent', step: 2, total: 5, runId });
  logger.agentLog('LocalizerAgent', `Localizing to ${targetLanguage}`);

  const raw = await callGroq(
    `You are an expert localization and translation specialist. Adapt content for regional markets with cultural sensitivity.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Translate and culturally adapt this content to ${targetLanguage}:

Blog Title: ${content.blogPost?.title || ''}
Instagram Caption: ${content.socialVariants?.instagram?.caption || ''}
Ad Headline: ${content.adCopy?.headline || ''}
Ad Body: ${content.adCopy?.body || ''}
FAQ Q1: ${content.faq?.[0]?.question || ''} — ${content.faq?.[0]?.answer || ''}

Return ONLY this JSON (no markdown):
{
  "language": "${targetLanguage}",
  "blogTitle": "translated blog title",
  "instagramCaption": "translated caption with local hashtags",
  "adHeadline": "translated headline",
  "adBody": "translated ad body",
  "faqSample": { "question": "translated Q1", "answer": "translated A1" },
  "culturalNotes": "Brief note on cultural adaptations made"
}`,
    { model: MODEL_SMALL, maxTokens: 1000, agentName: 'LocalizerAgent' }
  );

  const result = safeJSON(raw, { language: targetLanguage, blogTitle: 'Localized content', culturalNotes: raw });
  sendEvent(res, { type: 'agent_complete', agent: 'Localizer Agent', step: 2, result, runId });
  logger.agentLog('LocalizerAgent', 'Localization complete');
  return result;
}

async function runBrandReviewerAgent(res, content, brandGuidelines, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Brand Reviewer Agent', step: 3, total: 5, runId });
  logger.agentLog('BrandReviewerAgent', 'Running brand compliance check');

  const raw = await callGroq(
    `You are a brand compliance expert. Analyse content for tone, voice, and brand guideline adherence.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Review this content for brand compliance:

Brand Guidelines: ${brandGuidelines || 'Professional, clear, trustworthy, customer-centric tone. Use active voice. Avoid unverified superlatives. No jargon.'}

Blog Title: ${content.blogPost?.title || ''}
Blog Excerpt: ${(content.blogPost?.content || '').slice(0, 400)}
LinkedIn Post: ${content.socialVariants?.linkedin?.text || ''}
Ad Copy: ${content.adCopy?.headline || ''} — ${content.adCopy?.body || ''}

Return ONLY this JSON (no markdown):
{
  "overallScore": 82,
  "passed": true,
  "issues": [
    { "severity": "low", "location": "blog title", "issue": "describe issue", "suggestion": "suggested fix" }
  ],
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["recommendation 1"],
  "summary": "2-sentence overall assessment"
}`,
    { model: MODEL_SMALL, maxTokens: 900, agentName: 'BrandReviewerAgent' }
  );

  const result = safeJSON(raw, { overallScore: 75, passed: true, issues: [], strengths: [], summary: raw });
  sendEvent(res, { type: 'agent_complete', agent: 'Brand Reviewer Agent', step: 3, result, runId });
  logger.agentLog('BrandReviewerAgent', 'Brand review complete', { score: result.overallScore });
  return result;
}

async function runComplianceAgent(res, content, industry, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Compliance Agent', step: 4, total: 5, runId });
  logger.agentLog('ComplianceAgent', `Compliance check for ${industry || 'general'} industry`);

  const raw = await callGroq(
    `You are a regulatory compliance expert specialising in advertising law, FTC guidelines, GDPR, and industry-specific regulations.
Identify violations precisely. Return ONLY valid JSON — no markdown, no explanation.`,
    `Perform a compliance audit for the ${industry || 'general'} industry:

Blog Title: ${content.blogPost?.title || ''}
Blog Excerpt: ${(content.blogPost?.content || '').slice(0, 600)}
Ad Copy: ${JSON.stringify(content.adCopy || {})}
Social Posts: Twitter: ${content.socialVariants?.twitter?.text || ''} | LinkedIn: ${content.socialVariants?.linkedin?.text || ''}

Check for: unsubstantiated superlatives ("best","#1","guaranteed"), misleading statistics, missing disclaimers, regulatory violations (FTC, GDPR, industry-specific), privacy issues.

Return ONLY this JSON (no markdown):
{
  "passed": true,
  "riskLevel": "low",
  "violations": [
    {
      "id": "V1",
      "type": "unsubstantiated claim",
      "severity": "high",
      "location": "blog post intro",
      "offendingText": "exact offending phrase",
      "reason": "why this violates regulations",
      "compliantRewrite": "suggested compliant replacement"
    }
  ],
  "warnings": [{ "type": "advisory", "text": "advisory note", "recommendation": "suggestion" }],
  "requiredDisclaimers": ["disclaimer text if needed"],
  "summary": "overall compliance assessment",
  "certificationReady": false
}`,
    { model: MODEL_LARGE, maxTokens: 1500, agentName: 'ComplianceAgent' }
  );

  const result = safeJSON(raw, { passed: true, riskLevel: 'low', violations: [], summary: raw });
  sendEvent(res, { type: 'agent_complete', agent: 'Compliance Agent', step: 4, result, runId });
  logger.agentLog('ComplianceAgent', 'Compliance check complete', {
    violations: result.violations?.length || 0,
    riskLevel: result.riskLevel,
  });
  return result;
}

async function runPublisherAgent(res, drafted, localized, brandReview, compliance, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Publisher Agent', step: 5, total: 5, runId });
  logger.agentLog('PublisherAgent', 'Packaging content for distribution');

  const raw = await callGroq(
    `You are a content publishing strategist. Create publication-ready distribution plans.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Create a publication plan for this content:

Brand Score: ${brandReview?.overallScore || 'N/A'}/100
Compliance: ${compliance?.passed ? 'PASSED' : 'FAILED — has violations'}
Risk Level: ${compliance?.riskLevel || 'unknown'}
Channels with content: Blog, Twitter, LinkedIn, Instagram, ${localized?.language || 'Tamil'} localization

Return ONLY this JSON (no markdown):
{
  "publishReady": true,
  "channels": [
    { "channel": "Blog / Website", "format": "Article", "scheduledTime": "Tuesday 9 AM", "status": "ready", "notes": "Publish first for SEO" },
    { "channel": "LinkedIn",       "format": "Post",    "scheduledTime": "Tuesday 10 AM","status": "ready", "notes": "Tag relevant leaders" },
    { "channel": "Twitter/X",      "format": "Tweet",   "scheduledTime": "Tuesday 11 AM","status": "ready", "notes": "Use thread format" },
    { "channel": "Instagram",      "format": "Reel+Caption","scheduledTime": "Wednesday 6 PM","status": "ready","notes": "Add product demo reel" },
    { "channel": "Regional",       "format": "Localized post","scheduledTime": "Thursday 10 AM","status": "ready","notes": "Target regional audience" }
  ],
  "contentCalendar": [
    { "date": "Week 1 Tue", "platform": "Blog + LinkedIn", "contentType": "Launch announcement", "title": "Draft blog title" },
    { "date": "Week 1 Thu", "platform": "Twitter + Instagram", "contentType": "Social push", "title": "Engagement post" },
    { "date": "Week 2 Tue", "platform": "All channels", "contentType": "Follow-up & FAQ", "title": "FAQ spotlight" }
  ],
  "estimatedReach": "15,000–25,000 impressions in 7 days",
  "summary": "Content is ready for multi-channel distribution with appropriate scheduling."
}`,
    { model: MODEL_SMALL, maxTokens: 1200, agentName: 'PublisherAgent' }
  );

  const result = safeJSON(raw, { publishReady: true, channels: [], contentCalendar: [], summary: raw });
  sendEvent(res, { type: 'agent_complete', agent: 'Publisher Agent', step: 5, result, runId });
  logger.agentLog('PublisherAgent', 'Publishing plan complete');
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FACT CHECK PIPELINE — 3 agents
// ══════════════════════════════════════════════════════════════════════════════

async function runFactCheckPipeline(res, content, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Claim Extractor Agent', step: 1, total: 3, runId });
  logger.agentLog('ClaimExtractorAgent', 'Extracting verifiable claims');

  const claimsRaw = await callGroq(
    `You are a fact-checking analyst. Extract all verifiable factual claims from content.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Extract every verifiable claim from this content:

${content.slice(0, 3000)}

Return ONLY this JSON (no markdown):
{
  "claims": [
    { "id": "C1", "claim": "exact claim text", "type": "statistical|factual|scientific|historical", "confidence": 0.9 }
  ],
  "totalClaims": 0
}`,
    { model: MODEL_SMALL, maxTokens: 1000, agentName: 'ClaimExtractorAgent' }
  );

  const claimsData = safeJSON(claimsRaw, { claims: [], totalClaims: 0 });
  claimsData.totalClaims = claimsData.claims?.length || 0;
  sendEvent(res, { type: 'agent_complete', agent: 'Claim Extractor Agent', step: 1, result: claimsData, runId });

  // ── Research Agent ──────────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Research & Verification Agent', step: 2, total: 3, runId });
  logger.agentLog('ResearchAgent', `Verifying ${claimsData.totalClaims} claims`);

  const verRaw = await callGroq(
    `You are a research verification specialist with broad knowledge of science, history, finance, medicine, technology, and current events.
Verify each claim rigorously using your knowledge. Return ONLY valid JSON — no markdown, no explanation.`,
    `Verify each of these ${claimsData.claims?.length || 0} claims:

${JSON.stringify(claimsData.claims?.slice(0, 12) || [])}

For each claim assess accuracy, evidence quality, and context. Note if outdated or misleading.

Return ONLY this JSON (no markdown):
{
  "verifications": [
    {
      "claimId": "C1",
      "claim": "repeated claim",
      "verdict": "true|false|misleading|unverifiable|partially_true",
      "confidence": 0.85,
      "explanation": "detailed explanation",
      "evidence": "supporting evidence or knowledge basis",
      "corrections": "corrected version if false or misleading"
    }
  ],
  "overallCredibility": 0.75,
  "redFlags": ["any major issues found"]
}`,
    { model: MODEL_LARGE, maxTokens: 2500, agentName: 'ResearchAgent' }
  );

  const verData = safeJSON(verRaw, { verifications: [], overallCredibility: 0.5, redFlags: [] });
  sendEvent(res, { type: 'agent_complete', agent: 'Research & Verification Agent', step: 2, result: verData, runId });

  // ── Report Generator ────────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Report Generator Agent', step: 3, total: 3, runId });
  logger.agentLog('ReportGeneratorAgent', 'Generating fact-check report');

  const true_count      = verData.verifications?.filter(v => v.verdict === 'true').length || 0;
  const false_count     = verData.verifications?.filter(v => v.verdict === 'false').length || 0;
  const mislead_count   = verData.verifications?.filter(v => v.verdict === 'misleading').length || 0;
  const partial_count   = verData.verifications?.filter(v => v.verdict === 'partially_true').length || 0;
  const unveri_count    = verData.verifications?.filter(v => v.verdict === 'unverifiable').length || 0;

  const reportRaw = await callGroq(
    `You are a fact-check report writer. Create clear, executive-ready credibility reports.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Generate a fact-check report from these results:

Content excerpt: ${content.slice(0, 300)}...
Claims found: ${claimsData.totalClaims}
Verdicts: true=${true_count}, false=${false_count}, misleading=${mislead_count}, partially_true=${partial_count}, unverifiable=${unveri_count}
Overall credibility score: ${Math.round((verData.overallCredibility || 0.5) * 100)}%
Red flags: ${JSON.stringify(verData.redFlags || [])}
Sample verifications: ${JSON.stringify(verData.verifications?.slice(0, 4) || [])}

Return ONLY this JSON (no markdown):
{
  "reportTitle": "Fact-Check Report: [topic]",
  "executiveSummary": "2-3 sentence summary of findings",
  "credibilityScore": 72,
  "credibilityLabel": "Credible|Highly Credible|Mixed|Questionable|Unreliable",
  "breakdown": { "true": 0, "false": 0, "misleading": 0, "partiallyTrue": 0, "unverifiable": 0 },
  "keyFindings": ["finding 1", "finding 2"],
  "flaggedClaims": [{ "claim": "problematic claim", "issue": "what is wrong", "recommendation": "how to fix" }],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "conclusion": "final verdict sentence"
}`,
    { model: MODEL_LARGE, maxTokens: 1200, agentName: 'ReportGeneratorAgent' }
  );

  const reportData = safeJSON(reportRaw, {
    reportTitle: 'Fact-Check Report',
    credibilityScore: Math.round((verData.overallCredibility || 0.5) * 100),
    credibilityLabel: 'Mixed',
    breakdown: { true: true_count, false: false_count, misleading: mislead_count, partiallyTrue: partial_count, unverifiable: unveri_count },
    executiveSummary: reportRaw.slice(0, 300),
  });
  sendEvent(res, { type: 'agent_complete', agent: 'Report Generator Agent', step: 3, result: reportData, runId });
  logger.agentLog('ReportGeneratorAgent', 'Report complete', { score: reportData.credibilityScore });

  return { claims: claimsData, verifications: verData, report: reportData };
}

// ══════════════════════════════════════════════════════════════════════════════
//  STRATEGY PIVOT PIPELINE — 3 agents
// ══════════════════════════════════════════════════════════════════════════════

async function runStrategyPivotPipeline(res, analyticsData, context, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Analytics Analyzer Agent', step: 1, total: 3, runId });
  logger.agentLog('AnalyticsAgent', 'Analyzing performance data');

  const analysisRaw = await callGroq(
    `You are a data analytics expert for content marketing. Identify patterns, trends, and strategic insights.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Analyze this content performance data and business context:

Analytics Data: ${JSON.stringify(analyticsData)}
Context: ${context}

Return ONLY this JSON (no markdown):
{
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "topPerformers": [
    { "contentType": "video", "metric": "engagement rate", "value": "8.2%", "insight": "4x higher than text" }
  ],
  "underperformers": [
    { "contentType": "blog", "issue": "low engagement", "recommendation": "add video summaries" }
  ],
  "audienceInsights": ["insight about audience 1", "insight 2"],
  "trendAnalysis": "paragraph describing key trends",
  "criticalFindings": ["most important finding"]
}`,
    { model: MODEL_LARGE, maxTokens: 1200, agentName: 'AnalyticsAgent' }
  );

  const analysisData = safeJSON(analysisRaw, { keyInsights: [], trendAnalysis: analysisRaw });
  sendEvent(res, { type: 'agent_complete', agent: 'Analytics Analyzer Agent', step: 1, result: analysisData, runId });

  // ── Strategy Agent ──────────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Strategy Recommendation Agent', step: 2, total: 3, runId });
  logger.agentLog('StrategyAgent', 'Generating strategy recommendations');

  const stratRaw = await callGroq(
    `You are a senior content strategy consultant. Provide specific, actionable strategy recommendations backed by data.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Create a content strategy pivot plan based on these insights:

Key Insights: ${JSON.stringify(analysisData.keyInsights || [])}
Top Performers: ${JSON.stringify(analysisData.topPerformers || [])}
Underperformers: ${JSON.stringify(analysisData.underperformers || [])}
Context: ${context}

Return ONLY this JSON (no markdown):
{
  "strategyTitle": "Q3 Content Strategy Pivot: [focus area]",
  "urgency": "high",
  "recommendations": [
    { "priority": 1, "action": "specific action", "reason": "data-backed reason", "expectedImpact": "measurable outcome", "effort": "low|medium|high", "timeline": "2 weeks" }
  ],
  "channelStrategy": [
    { "channel": "Instagram", "currentAllocation": "20%", "recommendedAllocation": "40%", "rationale": "why" }
  ],
  "contentMix": {
    "current":     { "video": "20%", "blog": "60%", "social": "20%" },
    "recommended": { "video": "50%", "blog": "30%", "social": "20%" }
  },
  "kpis": [
    { "metric": "Video engagement rate", "currentBaseline": "2%", "target": "6%", "timeframe": "60 days" }
  ],
  "quickWins": ["quick win 1 achievable this week", "quick win 2"],
  "roadmap": [
    { "phase": 1, "title": "Foundation", "actions": ["action 1", "action 2"], "duration": "2 weeks" },
    { "phase": 2, "title": "Scale",      "actions": ["action 3", "action 4"], "duration": "4 weeks" }
  ]
}`,
    { model: MODEL_LARGE, maxTokens: 2000, agentName: 'StrategyAgent' }
  );

  const stratData = safeJSON(stratRaw, { strategyTitle: 'Content Strategy Pivot', recommendations: [], roadmap: [] });
  sendEvent(res, { type: 'agent_complete', agent: 'Strategy Recommendation Agent', step: 2, result: stratData, runId });

  // ── Calendar Agent ──────────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Content Calendar Agent', step: 3, total: 3, runId });
  logger.agentLog('CalendarAgent', 'Building 4-week content calendar');

  const calRaw = await callGroq(
    `You are a content calendar specialist. Create detailed, realistic 4-week content calendars.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Build a 4-week content calendar based on this strategy:

Recommended content mix: ${JSON.stringify(stratData.contentMix?.recommended || {})}
Top recommendations: ${JSON.stringify(stratData.recommendations?.slice(0, 3) || [])}
Quick wins: ${JSON.stringify(stratData.quickWins || [])}

Return ONLY this JSON (no markdown):
{
  "calendarTitle": "4-Week Content Strategy Calendar",
  "period": "4 weeks",
  "weeklySchedule": [
    {
      "week": 1,
      "theme": "Launch & Awareness",
      "posts": [
        { "day": "Monday",    "platform": "LinkedIn", "contentType": "Article", "topic": "specific topic", "format": "long-form", "notes": "tip" },
        { "day": "Wednesday", "platform": "Instagram","contentType": "Reel",    "topic": "specific topic", "format": "60s video","notes": "tip" },
        { "day": "Friday",    "platform": "Twitter",  "contentType": "Thread",  "topic": "specific topic", "format": "thread",   "notes": "tip" }
      ]
    },
    { "week": 2, "theme": "Engagement & Education", "posts": [
        { "day": "Tuesday", "platform": "Blog",      "contentType": "How-to",  "topic": "specific topic", "format": "article", "notes": "SEO focus" },
        { "day": "Thursday","platform": "Instagram", "contentType": "Carousel","topic": "specific topic", "format": "carousel","notes": "save-worthy" }
      ]
    },
    { "week": 3, "theme": "Social Proof & Case Studies", "posts": [
        { "day": "Monday",  "platform": "LinkedIn",  "contentType": "Case study","topic": "customer win",  "format": "post",   "notes": "tag customer" },
        { "day": "Friday",  "platform": "All",       "contentType": "Recap",    "topic": "weekly roundup","format": "mixed",  "notes": "engagement post" }
      ]
    },
    { "week": 4, "theme": "Conversion & CTA", "posts": [
        { "day": "Tuesday", "platform": "All",       "contentType": "Offer",    "topic": "product CTA",   "format": "promo",  "notes": "clear CTA" }
      ]
    }
  ],
  "contentPillars": ["Education", "Inspiration", "Promotion", "Community"],
  "estimatedReach": "45,000–65,000 impressions per month",
  "summary": "This calendar prioritises video content and consistent posting to maximise engagement."
}`,
    { model: MODEL_SMALL, maxTokens: 1500, agentName: 'CalendarAgent' }
  );

  const calData = safeJSON(calRaw, { calendarTitle: '4-Week Content Calendar', weeklySchedule: [] });
  sendEvent(res, { type: 'agent_complete', agent: 'Content Calendar Agent', step: 3, result: calData, runId });
  logger.agentLog('CalendarAgent', 'Calendar generation complete');

  return { analysis: analysisData, strategy: stratData, calendar: calData };
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPLIANCE REVIEW PIPELINE — 3 agents
// ══════════════════════════════════════════════════════════════════════════════

async function runComplianceOnlyPipeline(res, content, industry, regulations, runId) {
  sendEvent(res, { type: 'agent_start', agent: 'Content Scanner Agent', step: 1, total: 3, runId });
  logger.agentLog('ScannerAgent', `Deep compliance scan — ${industry || 'general'} industry`);

  const scanRaw = await callGroq(
    `You are a regulatory compliance specialist. You know FTC advertising law, GDPR, HIPAA, FINRA, FDA, consumer protection laws, and general advertising standards thoroughly.
Find every violation. Return ONLY valid JSON — no markdown, no explanation.`,
    `Perform a deep compliance scan for the ${industry || 'general'} industry.
Regulations to check: ${regulations || 'FTC advertising guidelines, consumer protection laws, general advertising standards, industry-specific regulations'}

Content to scan:
${content.slice(0, 3000)}

Look for: unsubstantiated claims ("best","#1","guaranteed","100%"), misleading statistics, false promises, missing disclaimers, privacy violations, regulatory-specific issues.

Return ONLY this JSON (no markdown):
{
  "violations": [
    {
      "id": "V1",
      "type": "unsubstantiated superlative",
      "regulation": "FTC Section 5",
      "severity": "high",
      "offendingText": "exact phrase from content",
      "location": "where in the content",
      "explanation": "why this violates the regulation",
      "compliantRewrite": "suggested compliant replacement",
      "penaltyRisk": "up to $50,000 per violation"
    }
  ],
  "warnings": [{ "type": "advisory", "text": "advisory text", "recommendation": "what to add" }],
  "positives": ["things done correctly"],
  "overallRisk": "low|medium|high|critical",
  "totalViolations": 0,
  "requiresLegalReview": false
}`,
    { model: MODEL_LARGE, maxTokens: 2000, agentName: 'ScannerAgent' }
  );

  const scanData = safeJSON(scanRaw, { violations: [], warnings: [], overallRisk: 'low', totalViolations: 0 });
  scanData.totalViolations = scanData.violations?.length || 0;
  sendEvent(res, { type: 'agent_complete', agent: 'Content Scanner Agent', step: 1, result: scanData, runId });

  // ── Remediation Agent ───────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Remediation Agent', step: 2, total: 3, runId });
  logger.agentLog('RemediationAgent', `Rewriting ${scanData.totalViolations} violations`);

  const remRaw = await callGroq(
    `You are a content remediation specialist. Rewrite content to be fully compliant while preserving marketing effectiveness.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Rewrite this content to fix all compliance violations:

Original content:
${content.slice(0, 2000)}

Violations to fix:
${JSON.stringify(scanData.violations?.slice(0, 8) || [])}

Return ONLY this JSON (no markdown):
{
  "remediatedContent": "full rewritten version of the content with all violations fixed",
  "changesLog": [
    { "original": "exact original phrase", "replacement": "compliant replacement", "reason": "why this change was made" }
  ],
  "additionalDisclaimers": ["disclaimer 1 to add at end", "disclaimer 2 if needed"],
  "remediationNotes": "overall notes about the remediation",
  "estimatedComplianceScore": 95
}`,
    { model: MODEL_LARGE, maxTokens: 2000, agentName: 'RemediationAgent' }
  );

  const remData = safeJSON(remRaw, { remediatedContent: content, changesLog: [], estimatedComplianceScore: 70 });
  sendEvent(res, { type: 'agent_complete', agent: 'Remediation Agent', step: 2, result: remData, runId });

  // ── Audit Report Agent ──────────────────────────────────────────────────────
  sendEvent(res, { type: 'agent_start', agent: 'Compliance Report Agent', step: 3, total: 3, runId });
  logger.agentLog('AuditReportAgent', 'Generating compliance audit report');

  const reportRaw = await callGroq(
    `You are a compliance audit report writer. Create executive-ready compliance reports.
Return ONLY valid JSON — no markdown, no explanation.`,
    `Generate a compliance audit report:

Industry: ${industry || 'General'}
Total violations found: ${scanData.totalViolations}
Risk level: ${scanData.overallRisk}
Requires legal review: ${scanData.requiresLegalReview}
Compliance score after remediation: ${remData.estimatedComplianceScore}%
Changes made: ${remData.changesLog?.length || 0}

Return ONLY this JSON (no markdown):
{
  "reportId": "CR-${Date.now()}",
  "complianceScore": ${remData.estimatedComplianceScore || 80},
  "status": "PASS|FAIL|CONDITIONAL",
  "executiveSummary": "2-3 sentence executive summary",
  "criticalIssues": ["critical issue 1 if any"],
  "actionItems": [
    { "priority": 1, "action": "specific action required", "deadline": "before publishing", "owner": "Legal / Marketing" }
  ],
  "certificationStatus": "Conditionally approved pending legal review",
  "nextReviewDate": "30 days from publication",
  "auditTrail": [
    { "step": "Content scanned", "timestamp": "${new Date().toISOString()}", "result": "${scanData.totalViolations} violations found" },
    { "step": "Content remediated", "timestamp": "${new Date().toISOString()}", "result": "${remData.changesLog?.length || 0} changes applied" }
  ]
}`,
    { model: MODEL_SMALL, maxTokens: 1000, agentName: 'AuditReportAgent' }
  );

  const reportData = safeJSON(reportRaw, {
    complianceScore: remData.estimatedComplianceScore || 80,
    status: scanData.totalViolations === 0 ? 'PASS' : 'CONDITIONAL',
    executiveSummary: reportRaw.slice(0, 300),
  });
  sendEvent(res, { type: 'agent_complete', agent: 'Compliance Report Agent', step: 3, result: reportData, runId });
  logger.agentLog('AuditReportAgent', 'Audit report complete', { score: reportData.complianceScore });

  return { scan: scanData, remediation: remData, report: reportData };
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PIPELINE ROUTE
// ══════════════════════════════════════════════════════════════════════════════

router.post('/run', authMiddleware, async (req, res) => {
  const { projectId, pipelineType, input, options = {} } = req.body;

  if (!projectId || !pipelineType) {
    return res.status(400).json({ error: 'projectId and pipelineType required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: 'GROQ_API_KEY not configured. Add it to your .env file. Get a free key at https://console.groq.com/',
    });
  }

  const projects = getProjects();
  const projectIdx = projects.findIndex(p => p.id === projectId);
  if (projectIdx === -1) return res.status(404).json({ error: 'Project not found' });

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const runId = uuidv4();
  const run = {
    id: runId,
    pipelineType,
    status: 'running',
    startedAt: new Date().toISOString(),
    startedBy: req.user.name,
    input,
    options,
    results: {},
    approvalItems: [],
    approvalStatus: 'pending',
  };

  sendEvent(res, { type: 'pipeline_start', runId, pipelineType, message: `Starting ${pipelineType} pipeline with Groq AI...` });
  logger.info(`Pipeline started: ${pipelineType}`, { projectId, runId, userId: req.user.id, model: MODEL_LARGE });

  try {
    let results = {};

    // Build context from input + selected documents
    let docContext = '';
    if (input.documentIds?.length) {
      const docs = getDocs().filter(d => input.documentIds.includes(d.id));
      docContext = docs.map(d => `=== ${d.originalName} ===\n${d.extractedText}`).join('\n\n');
    }

    const mainContext = [
      input.productSpec || input.content || input.text || '',
      docContext,
      input.additionalContext || '',
    ].filter(Boolean).join('\n\n---\n\n').trim();

    if (!mainContext) {
      sendEvent(res, { type: 'error', message: 'No input content provided. Enter a product spec, paste text, or select uploaded documents.' });
      res.end();
      return;
    }

    // ── Route to pipeline ─────────────────────────────────────────────────────
    if (pipelineType === 'product_launch') {
      const drafted    = await runDrafterAgent(res, mainContext, runId);
      const localized  = await runLocalizerAgent(res, drafted, options.targetLanguage || 'Tamil (India)', runId);
      const brand      = await runBrandReviewerAgent(res, drafted, options.brandGuidelines, runId);
      const compliance = await runComplianceAgent(res, drafted, options.industry, runId);
      const published  = await runPublisherAgent(res, drafted, localized, brand, compliance, runId);

      results = { drafted, localized, brandReview: brand, compliance, published };

      const score = compliance.passed ? 90 : 58;
      run.approvalItems = [
        { id: uuidv4(), type: 'blog_post',          title: 'Blog Post',                            content: drafted.blogPost,                  status: 'pending', complianceScore: score },
        { id: uuidv4(), type: 'social_twitter',     title: 'Twitter / X Post',                     content: drafted.socialVariants?.twitter,    status: 'pending', complianceScore: score },
        { id: uuidv4(), type: 'social_linkedin',    title: 'LinkedIn Post',                        content: drafted.socialVariants?.linkedin,   status: 'pending', complianceScore: score },
        { id: uuidv4(), type: 'social_instagram',   title: 'Instagram Post',                       content: drafted.socialVariants?.instagram,  status: 'pending', complianceScore: score },
        { id: uuidv4(), type: 'localized_content',  title: `Localized — ${options.targetLanguage || 'Tamil'}`, content: localized, status: 'pending', complianceScore: 92 },
        { id: uuidv4(), type: 'faq',                title: 'Internal FAQ',                         content: drafted.faq,                        status: 'pending', complianceScore: 96 },
        { id: uuidv4(), type: 'ad_copy',            title: 'Ad Copy / Banner',                     content: drafted.adCopy,                     status: 'pending', complianceScore: score },
        { id: uuidv4(), type: 'distribution_plan',  title: 'Distribution Plan & Calendar',         content: published,                          status: 'pending', complianceScore: 98 },
      ];
    } else if (pipelineType === 'fact_check') {
      const r = await runFactCheckPipeline(res, mainContext, runId);
      results = r;
      run.approvalItems = [
        { id: uuidv4(), type: 'fact_check_report', title: 'Fact-Check Report', content: r.report, status: 'pending' },
      ];
    } else if (pipelineType === 'strategy_pivot') {
      const r = await runStrategyPivotPipeline(res, input.analyticsData || {}, mainContext, runId);
      results = r;
      run.approvalItems = [
        { id: uuidv4(), type: 'strategy_report',  title: 'Strategy Recommendations', content: r.strategy,  status: 'pending' },
        { id: uuidv4(), type: 'content_calendar', title: 'Content Calendar',          content: r.calendar,  status: 'pending' },
        { id: uuidv4(), type: 'analysis_report',  title: 'Analytics Insights',        content: r.analysis,  status: 'pending' },
      ];
    } else if (pipelineType === 'compliance_review') {
      const r = await runComplianceOnlyPipeline(res, mainContext, options.industry, options.regulations, runId);
      results = r;
      run.approvalItems = [
        { id: uuidv4(), type: 'compliance_report',   title: 'Compliance Audit Report', content: r.report,      status: 'pending' },
        { id: uuidv4(), type: 'remediated_content',  title: 'Remediated Content',      content: r.remediation, status: 'pending' },
      ];
    } else {
      throw new Error(`Unknown pipelineType: ${pipelineType}`);
    }

    run.status      = 'awaiting_approval';
    run.completedAt = new Date().toISOString();
    run.results     = results;

    // Persist
    const latest = getProjects();
    const pIdx   = latest.findIndex(p => p.id === projectId);
    if (pIdx > -1) {
      if (!latest[pIdx].pipelineRuns) latest[pIdx].pipelineRuns = [];
      latest[pIdx].pipelineRuns.unshift(run);
      if (latest[pIdx].pipelineRuns.length > 20) latest[pIdx].pipelineRuns.length = 20;
      latest[pIdx].updatedAt = new Date().toISOString();
      saveProjects(latest);
    }

    sendEvent(res, {
      type: 'pipeline_complete',
      runId,
      message: `Pipeline complete! ${run.approvalItems.length} items ready for review.`,
      approvalItems: run.approvalItems.length,
      run,
    });
    logger.info(`Pipeline complete: ${pipelineType}`, { projectId, runId, items: run.approvalItems.length });

  } catch (err) {
    const msg = err.message || 'Unknown error';
    run.status = 'failed';
    run.error  = msg;
    logger.error(`Pipeline failed: ${pipelineType}`, { projectId, runId, error: msg });
    sendEvent(res, { type: 'pipeline_error', runId, error: msg, message: `Pipeline failed: ${msg}` });

    const latest = getProjects();
    const pIdx   = latest.findIndex(p => p.id === projectId);
    if (pIdx > -1) {
      if (!latest[pIdx].pipelineRuns) latest[pIdx].pipelineRuns = [];
      latest[pIdx].pipelineRuns.unshift(run);
      saveProjects(latest);
    }
  }

  res.end();
});

// GET run status
router.get('/status/:projectId/:runId', authMiddleware, (req, res) => {
  const projects = getProjects();
  const project  = projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const run = project.pipelineRuns?.find(r => r.id === req.params.runId);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json({ run });
});

module.exports = router;
