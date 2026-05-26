const { GoogleGenAI } = require("@google/genai")
const Groq = require("groq-sdk")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripCodeFences(text = "") {
    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()
}

function convertFlatEntriesToObjects(items, keys, arrayFields = []) {
    if (!Array.isArray(items)) return items
    if (items.every(item => item && typeof item === "object" && !Array.isArray(item))) return items

    const keySet = new Set(keys)
    const arrayFieldSet = new Set(arrayFields)
    const normalized = []
    let currentEntry = {}

    function pushCurrentEntry() {
        if (Object.keys(currentEntry).length > 0) {
            normalized.push(currentEntry)
            currentEntry = {}
        }
    }

    for (let index = 0; index < items.length; index += 1) {
        const key = items[index]
        if (typeof key !== "string" || !keySet.has(key)) continue
        if (key === keys[0] && Object.keys(currentEntry).length > 0) pushCurrentEntry()

        if (arrayFieldSet.has(key)) {
            const values = []
            index += 1
            while (index < items.length) {
                const nextItem = items[index]
                if (typeof nextItem === "string" && keySet.has(nextItem)) { index -= 1; break }
                values.push(nextItem)
                index += 1
            }
            currentEntry[key] = values
        } else {
            const value = items[index + 1]
            if (value !== undefined) currentEntry[key] = value
            index += 1
        }
    }

    pushCurrentEntry()
    return normalized
}

function normalizeInterviewReport(rawReport) {
    return {
        ...rawReport,
        technicalQuestions: convertFlatEntriesToObjects(rawReport.technicalQuestions, ["question", "intention", "answer"]),
        behavioralQuestions: convertFlatEntriesToObjects(rawReport.behavioralQuestions, ["question", "intention", "answer"]),
        skillGaps: convertFlatEntriesToObjects(rawReport.skillGaps, ["skill", "severity"]),
        preparationPlan: convertFlatEntriesToObjects(rawReport.preparationPlan, ["day", "focus", "tasks"], ["tasks"]),
    }
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()),
    })),
    title: z.string(),
})

// ─── Groq caller ─────────────────────────────────────────────────────────────

const GROQ_TIMEOUT_MS = 30000  // Groq is fast; 30s is generous

async function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("groq_timeout")), ms)
        ),
    ])
}

async function callGroq(systemPrompt, userPrompt) {
    const response = await withTimeout(
        groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 4000,  // ← add this, default is often too low
        }),
        GROQ_TIMEOUT_MS
    )
    return response.choices[0].message.content
}

// ─── generateInterviewReport ──────────────────────────────────────────────────

const interviewSystemPrompt = `You are an expert technical interviewer.
Return ONLY valid JSON. No markdown, no explanations.
Arrays must contain OBJECTS, not strings.

STRICT REQUIREMENTS — you MUST generate ALL of these:
- technicalQuestions: MINIMUM 7 objects, ideally 8-10
- behavioralQuestions: MINIMUM 5 objects, ideally 6-8  
- skillGaps: MINIMUM 4 objects, list every gap you find
- preparationPlan: MINIMUM 7 objects (one per day), ideally 10-14 days

Generating fewer items than the minimums above is considered an error. Fill every array completely.`

function buildInterviewUserPrompt({ resume, selfDescription, jobDescription }) {
    return `Analyze this candidate thoroughly and return a JSON object.

MANDATORY COUNTS (do not return fewer):
- technicalQuestions: at least 8 questions covering different skill areas
- behavioralQuestions: at least 6 questions covering leadership, conflict, failure, teamwork, growth, communication
- skillGaps: at least 4 gaps — check every tool, framework, and concept in the JD the candidate hasn't demonstrated
- preparationPlan: exactly 10 days, one object per day (day 1 through day 10), each with 3-5 tasks

Return this exact shape:
{
  "matchScore": 75,
  "title": "Job Title Here",
  "technicalQuestions": [
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." }
  ],
  "behavioralQuestions": [
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." },
    { "question": "...", "intention": "...", "answer": "..." }
  ],
  "skillGaps": [
    { "skill": "...", "severity": "high" },
    { "skill": "...", "severity": "medium" },
    { "skill": "...", "severity": "low" },
    { "skill": "...", "severity": "medium" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 2, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 3, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 4, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 5, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 6, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 7, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 8, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 9, "focus": "...", "tasks": ["...", "...", "..."] },
    { "day": 10, "focus": "...", "tasks": ["...", "...", "..."] }
  ]
}

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}`
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const userPrompt = buildInterviewUserPrompt({ resume, selfDescription, jobDescription })
    let rawText

    try {
        console.log("[AI] Trying Groq for interview report...")
        rawText = await callGroq(interviewSystemPrompt, userPrompt)
        console.log("[AI] Groq succeeded")
    } catch (err) {
        console.warn(`[AI] Groq failed (${err.message}), falling back to Gemini...`)

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            },
        })
        rawText = response.text
    }

    const parsed = JSON.parse(stripCodeFences(rawText))
    const normalized = normalizeInterviewReport(parsed)
    return interviewReportSchema.parse(normalized)
}

// ─── generateResumePdf ────────────────────────────────────────────────────────

const resumeSystemPrompt = `You are an expert resume writer. 
Return ONLY a valid JSON object with a single field "resumeHtml" containing complete HTML.
No markdown, no explanations.`

function buildResumeUserPrompt({ resume, selfDescription, jobDescription }) {
    return `You are an expert resume writer. Fill in the HTML template below with the candidate's real information.
Tailor the content to the job description. Keep it concise (1-2 pages max).
Do NOT change any CSS or HTML structure — only replace the placeholder text values.
Return JSON: { "resumeHtml": "<complete filled HTML>" }

=== HTML TEMPLATE TO FILL ===
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #2d2d2d; background: #fff; }
  
  .header { background: #1a1a2e; color: #fff; padding: 32px 40px 24px; }
  .header h1 { font-size: 28px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
  .header .tagline { font-size: 13px; color: #a0aec0; margin-bottom: 14px; }
  .contact-row { display: flex; flex-wrap: wrap; gap: 18px; font-size: 12px; color: #cbd5e0; }
  .contact-row span::before { margin-right: 5px; }

  .body { display: grid; grid-template-columns: 1fr 260px; gap: 0; }

  .main { padding: 28px 32px; }
  .sidebar { background: #f7f8fc; padding: 28px 22px; border-left: 1px solid #e8eaf0; }

  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a5568;
    border-bottom: 2px solid #1a1a2e; padding-bottom: 5px; margin-bottom: 14px;
  }

  /* Summary */
  .summary p { line-height: 1.7; color: #4a5568; }

  /* Experience / Projects */
  .entry { margin-bottom: 16px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-title { font-weight: 600; font-size: 14px; color: #1a1a2e; }
  .entry-meta { font-size: 11px; color: #718096; white-space: nowrap; }
  .entry-sub { font-size: 12px; color: #5a67d8; margin: 2px 0 6px; font-weight: 500; }
  .entry ul { padding-left: 16px; }
  .entry ul li { margin-bottom: 4px; line-height: 1.6; color: #4a5568; }

  /* Sidebar sections */
  .sidebar .section-title { font-size: 10px; color: #2d3748; border-color: #5a67d8; }

  /* Skills */
  .skill-group { margin-bottom: 12px; }
  .skill-group-name { font-size: 11px; font-weight: 600; color: #2d3748; margin-bottom: 6px; }
  .skill-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .skill-tag {
    background: #ebf4ff; color: #2b6cb0; font-size: 11px;
    padding: 3px 9px; border-radius: 12px; font-weight: 500;
  }

  /* Education */
  .edu-entry { margin-bottom: 12px; }
  .edu-degree { font-weight: 600; font-size: 12px; color: #2d3748; }
  .edu-school { font-size: 12px; color: #5a67d8; }
  .edu-year { font-size: 11px; color: #718096; }
  .edu-score { font-size: 11px; color: #48bb78; font-weight: 500; }

  /* Languages / Extra */
  .lang-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .lang-tag {
    background: #f0fff4; color: #276749; font-size: 11px;
    padding: 3px 9px; border-radius: 12px; font-weight: 500;
  }

  .score-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .score-bar span { font-size: 11px; color: #4a5568; width: 80px; }
  .bar-track { flex: 1; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; background: #5a67d8; border-radius: 3px; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <h1>CANDIDATE_FULL_NAME</h1>
  <div class="tagline">CANDIDATE_TAGLINE (e.g. MCA Student | Mobile App Developer)</div>
  <div class="contact-row">
    <span>✉ CANDIDATE_EMAIL</span>
    <span>🔗 CANDIDATE_LINKEDIN</span>
    <span>💻 CANDIDATE_GITHUB</span>
    <span>📍 CANDIDATE_LOCATION</span>
  </div>
</div>

<div class="body">

  <!-- MAIN COLUMN -->
  <div class="main">

    <!-- Summary -->
    <div class="section summary">
      <div class="section-title">Professional Summary</div>
      <p>WRITE_2_TO_3_SENTENCES_TAILORED_TO_JOB_DESCRIPTION</p>
    </div>

    <!-- Projects (use Experience if they have work exp) -->
    <div class="section">
      <div class="section-title">Projects</div>

      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">PROJECT_1_NAME</div>
          <div class="entry-meta">MONTH YEAR</div>
        </div>
        <div class="entry-sub">TECH_STACK_USED</div>
        <ul>
          <li>ACHIEVEMENT_OR_FEATURE_1 (quantify if possible)</li>
          <li>ACHIEVEMENT_OR_FEATURE_2</li>
          <li>ACHIEVEMENT_OR_FEATURE_3</li>
        </ul>
      </div>

      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">PROJECT_2_NAME</div>
          <div class="entry-meta">MONTH YEAR</div>
        </div>
        <div class="entry-sub">TECH_STACK_USED</div>
        <ul>
          <li>ACHIEVEMENT_OR_FEATURE_1</li>
          <li>ACHIEVEMENT_OR_FEATURE_2</li>
        </ul>
      </div>

      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">PROJECT_3_NAME</div>
          <div class="entry-meta">MONTH YEAR</div>
        </div>
        <div class="entry-sub">TECH_STACK_USED</div>
        <ul>
          <li>ACHIEVEMENT_OR_FEATURE_1</li>
          <li>ACHIEVEMENT_OR_FEATURE_2</li>
        </ul>
      </div>
    </div>

  </div>

  <!-- SIDEBAR COLUMN -->
  <div class="sidebar">

    <!-- Skills -->
    <div class="section">
      <div class="section-title">Skills</div>

      <div class="skill-group">
        <div class="skill-group-name">SKILL_CATEGORY_1 (e.g. Mobile)</div>
        <div class="skill-tags">
          <span class="skill-tag">Skill A</span>
          <span class="skill-tag">Skill B</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-name">SKILL_CATEGORY_2 (e.g. Frontend)</div>
        <div class="skill-tags">
          <span class="skill-tag">Skill C</span>
          <span class="skill-tag">Skill D</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-name">SKILL_CATEGORY_3 (e.g. Backend)</div>
        <div class="skill-tags">
          <span class="skill-tag">Skill E</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-name">SKILL_CATEGORY_4 (e.g. Tools)</div>
        <div class="skill-tags">
          <span class="skill-tag">Skill F</span>
          <span class="skill-tag">Skill G</span>
        </div>
      </div>
    </div>

    <!-- Education -->
    <div class="section">
      <div class="section-title">Education</div>

      <div class="edu-entry">
        <div class="edu-degree">DEGREE_1 (e.g. MCA)</div>
        <div class="edu-school">UNIVERSITY_NAME</div>
        <div class="edu-year">YEAR_RANGE</div>
        <div class="edu-score">CGPA: X.X / 10</div>
      </div>

      <div class="edu-entry">
        <div class="edu-degree">DEGREE_2 (e.g. BSc CS)</div>
        <div class="edu-school">COLLEGE_NAME</div>
        <div class="edu-year">YEAR_RANGE</div>
        <div class="edu-score">CGPA: X.X / 10</div>
      </div>
    </div>

    <!-- Languages -->
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="lang-list">
        <span class="lang-tag">LANGUAGE_1</span>
        <span class="lang-tag">LANGUAGE_2</span>
      </div>
    </div>

  </div>
</div>

</body>
</html>
=== END TEMPLATE ===

Now fill in the template with this candidate's real data:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}`
}

const https = require('https')

async function generatePdfFromHtml(htmlContent) {
    const encodedHtml = encodeURIComponent(htmlContent)
    
    const response = await fetch(`https://api.html2pdf.app/v1/generate?html=${encodedHtml}&apiKey=your_key`)
    
    if (!response.ok) throw new Error('PDF generation failed')
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const userPrompt = buildResumeUserPrompt({ resume, selfDescription, jobDescription })
    let html

    try {
        console.log("[AI] Trying Groq for resume HTML...")
        const rawText = await callGroq(resumeSystemPrompt, userPrompt)
        const raw = JSON.parse(stripCodeFences(rawText))
        html = typeof raw === "string" ? raw : (raw.resumeHtml || raw.html)
        if (!html) throw new Error("no_html_in_response")
        console.log("[AI] Groq succeeded")
    } catch (err) {
        console.warn(`[AI] Groq failed (${err.message}), falling back to Gemini...`)
        const resumeHtmlSchema = z.object({
            resumeHtml: z.string(),
        })
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumeHtmlSchema),
            },
        })
        const raw = JSON.parse(response.text)
        html = typeof raw === "string" ? raw : (raw.resumeHtml || raw.html)
        if (!html) throw new Error("Could not extract HTML from AI response")
    }

    return generatePdfFromHtml(html)
}

module.exports = { generateInterviewReport, generateResumePdf }


// const  {GoogleGenAI} = require("@google/genai")
// const {z} = require("zod")
// const {zodToJsonSchema} = require("zod-to-json-schema")
// const puppeteer = require("puppeteer")

// const ai = new GoogleGenAI({
//     apiKey: process.env.GOOGLE_GENAI_API_KEY
// })

// function stripCodeFences(text = "") {
//     return text
//         .replace(/^```json\s*/i, "")
//         .replace(/^```\s*/i, "")
//         .replace(/\s*```$/i, "")
//         .trim()
// }

// function convertFlatEntriesToObjects(items, keys, arrayFields = []) {
//     if (!Array.isArray(items)) {
//         return items
//     }

//     if (items.every(item => item && typeof item === "object" && !Array.isArray(item))) {
//         return items
//     }

//     const keySet = new Set(keys)
//     const arrayFieldSet = new Set(arrayFields)
//     const normalized = []
//     let currentEntry = {}

//     function pushCurrentEntry() {
//         if (Object.keys(currentEntry).length > 0) {
//             normalized.push(currentEntry)
//             currentEntry = {}
//         }
//     }

//     for (let index = 0; index < items.length; index += 1) {
//         const key = items[index]

//         if (typeof key !== "string" || !keySet.has(key)) {
//             continue
//         }

//         if (key === keys[0] && Object.keys(currentEntry).length > 0) {
//             pushCurrentEntry()
//         }

//         if (arrayFieldSet.has(key)) {
//             const values = []

//             index += 1
//             while (index < items.length) {
//                 const nextItem = items[index]
//                 if (typeof nextItem === "string" && keySet.has(nextItem)) {
//                     index -= 1
//                     break
//                 }
//                 values.push(nextItem)
//                 index += 1
//             }

//             currentEntry[key] = values
//         } else {
//             const value = items[index + 1]
//             if (value !== undefined) {
//                 currentEntry[key] = value
//             }
//             index += 1
//         }
//     }

//     pushCurrentEntry()

//     return normalized
// }

// function normalizeInterviewReport(rawReport) {
//     return {
//         ...rawReport,
//         technicalQuestions: convertFlatEntriesToObjects(
//             rawReport.technicalQuestions,
//             ["question", "intention", "answer"]
//         ),
//         behavioralQuestions: convertFlatEntriesToObjects(
//             rawReport.behavioralQuestions,
//             ["question", "intention", "answer"]
//         ),
//         skillGaps: convertFlatEntriesToObjects(
//             rawReport.skillGaps,
//             ["skill", "severity"]
//         ),
//         preparationPlan: convertFlatEntriesToObjects(
//             rawReport.preparationPlan,
//             ["day", "focus", "tasks"],
//             ["tasks"]
//         )
//     }
// }

// const interviewReportSchema = z.object({
//     matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    
//     technicalQuestions: z.array(z.object({
//         question: z.string().describe("The technical question can be asked in the interview"),
//         intention: z.string().describe("The intention of interviewer behind asking this question"),
//         answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
//     })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    
//     behavioralQuestions: z.array(z.object({
//         question: z.string().describe("The technical question can be asked in the interview"),
//         intention: z.string().describe("The intention of interviewer behind asking this question"),
//         answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
//     })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    
//     skillGaps: z.array(z.object({
//         skill: z.string().describe("The skill which the candidate is lacking"),
//         severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
//     })).describe("List of skill gaps in the candidate's profile along with their severity"),
    
//     preparationPlan: z.array(z.object({
//         day: z.number().describe("The day number in the preparation plan, starting from 1"),
//         focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
//         tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
//     })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    
//     title: z.string().describe("The title of the job for which the interview report is generated"),
// })

// async function generateInterviewReport({resume, selfDescription,jobDescription}){

//     const prompt = `
//         You are an expert technical interviewer.

//         Analyze the candidate profile and return ONLY valid JSON.

//         The JSON must EXACTLY follow this structure:

//         {
//         "matchScore": 85,

//         "technicalQuestions": [
//             {
//             "question": "Explain React hooks",
//             "intention": "Test React fundamentals",
//             "answer": "Explain useState, useEffect and practical examples"
//             }
//         ],

//         "behavioralQuestions": [
//             {
//             "question": "Tell me about a challenge",
//             "intention": "Evaluate problem solving",
//             "answer": "Use STAR method"
//             }
//         ],

//         "skillGaps": [
//             {
//             "skill": "Node.js",
//             "severity": "high"
//             }
//         ],

//         "preparationPlan": [
//             {
//             "day": 1,
//             "focus": "React fundamentals",
//             "tasks": [
//                 "Practice hooks",
//                 "Build mini project"
//             ]
//             }
//         ],

//         "title": "Full Stack Developer Intern"
//         }

//         Candidate Details:

//         Resume:
//         ${resume}

//         Self Description:
//         ${selfDescription}

//         Job Description:
//         ${jobDescription}

//         IMPORTANT:
//         - Return ONLY JSON
//         - Do not return markdown
//         - Do not return explanations
//         - Arrays must contain OBJECTS, not strings
//         `

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",

//         // max_tokens: 4096,
//         contents: prompt,
//         config:{
//             temperature: 0.2,
//             responseMimeType : "application/json",
//             responseSchema: zodToJsonSchema(interviewReportSchema),

//         }
//     })

//     // console.log(response)
//     // console.log(response.text)

//     const parsedResponse = JSON.parse(stripCodeFences(response.text))
//     const normalizedResponse = normalizeInterviewReport(parsedResponse)

//     return interviewReportSchema.parse(normalizedResponse)   
// }

// async function generatePdfFromHtml(htmlContent) {
//     const browser = await puppeteer.launch()
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0",timeout: 10000 })

//     const pdfUint8Array = await page.pdf({ format: "A4" });
//     const pdfBuffer = Buffer.from(pdfUint8Array); 

//     await browser.close()

//     return pdfBuffer
// }

// async function generateResumePdf({resume,selfDescription,jobDescription}){

//     const resumepdfSchema = z.object({
//         resumeHtml: z.string().describe("The HTML content of the resume")
//     })

//     const prompt = `Generate a visually appealing resume in HTML format based on the following details. The resume should be well-structured, easy to read, and highlight the candidate's skills and experiences effectively.
//     Candidate Details:
//     Resume:
//     ${resume}
//     Self Description:
//     ${selfDescription}
//     Job Description:
//     ${jobDescription}

//     the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
//     The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
//     The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
//     you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
//     The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
//     The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.               
//     `

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: prompt,
//         config:{
//             temperature: 0.2,
//             responseMimeType : "application/json",
//             responseSchema: zodToJsonSchema(resumepdfSchema),
//         }
//     })


//     const raw = JSON.parse(response.text)

//     // Gemini sometimes returns the value directly instead of wrapped in an object
//     const html = typeof raw === "string" ? raw : (raw.resumeHtml || raw.html)

//     if (!html) {
//         throw new Error("Could not extract HTML from AI response")
//     }

//     const pdfBuffer = await generatePdfFromHtml(html)

//     return pdfBuffer
// }

// module.exports = {generateInterviewReport,generateResumePdf}
