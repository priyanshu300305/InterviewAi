const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--no-zygote",
                "--single-process"
            ]
        })
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        await browser.close()

        return pdfBuffer
    } catch (err) {
        console.warn("Puppeteer PDF render fallback to HTML:", err.message)
        return null
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a tailored resume for a candidate based strictly on the following details:
                        Candidate's Original Resume Text: ${resume}
                        Candidate's Self Description: ${selfDescription}
                        Target Job Description: ${jobDescription}

                        Instructions:
                        1. The response must be a JSON object with a single field "html" containing the HTML content of the resume, ready to be converted to PDF.
                        2. CRITICAL: Do NOT invent fake names (like John Doe), fake jobs, fake universities, or placeholder text. You must use ONLY the factual information provided in the "Candidate's Original Resume Text" or "Self Description".
                        3. If the candidate's name or contact info is missing, leave it as "[Name Not Provided]" or omit it completely rather than fabricating a sample resume.
                        4. Tailor the existing experience and skills to highlight their relevance to the Target Job Description.
                        5. The HTML content should be well-formatted, ATS-friendly, visually appealing, and professional. Include clean CSS styling suitable for printing.
                        6. Keep it concise (1-2 pages maximum when rendered). Focus on quality.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)
    let htmlContent = jsonContent.html || ""

    if (htmlContent && !htmlContent.includes("window.print")) {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tailored Resume</title>
<style>
  @media print {
    .no-print { display: none !important; }
  }
</style>
</head>
<body style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5;">
<div class="no-print" style="position: sticky; top: 10px; right: 10px; background: #0f172a; color: #ffffff; padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <span style="font-weight: 500; font-size: 14px;">📄 Your Tailored Resume is Ready</span>
  <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">Print / Save as PDF</button>
</div>
${htmlContent}
</body>
</html>`
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent)

    return { pdfBuffer, htmlContent }

}

module.exports = { generateInterviewReport, generateResumePdf }