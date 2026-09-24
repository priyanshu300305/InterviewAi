const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    let resumeText = ""
    if (req.file) {
        try {
            if (typeof pdfParse === "function") {
                const parsed = await pdfParse(req.file.buffer)
                resumeText = parsed.text || ""
            } else if (pdfParse.PDFParse) {
                const parsed = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = parsed.text || ""
            }
        } catch (e) {
            console.error("PDF Parsing error:", e)
        }
    }
    const { selfDescription, jobDescription } = req.body

    try {
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("AI Generation Error:", error)
        res.status(500).json({
            message: "Failed to generate interview strategy. The AI service might be temporarily unavailable or the input was invalid.",
            error: error.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const result = await generateResumePdf({ resume, jobDescription, selfDescription })

        if (result.pdfBuffer) {
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
            })
            return res.send(result.pdfBuffer)
        } else {
            res.set({
                "Content-Type": "text/html"
            })
            return res.send(result.htmlContent)
        }
    } catch (error) {
        console.error("Resume PDF Generation Error:", error)
        res.status(500).json({
            message: "Failed to generate resume PDF. Please check server logs.",
            error: error.message
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }