import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            return { error: error.response?.data?.message || "Failed to generate report" }
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        try {
            const blob = await generateResumePdf({ interviewReportId })
            const text = await blob.text()

            if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
                const printWin = window.open("", "_blank")
                if (printWin) {
                    printWin.document.open()
                    printWin.document.write(text)
                    printWin.document.close()
                } else {
                    alert("Please allow popups to view and print your resume.")
                }
                return { success: true }
            }

            if (blob.type === "application/json" || text.startsWith("{")) {
                try {
                    const errData = JSON.parse(text)
                    alert(errData.message || "Failed to generate resume PDF.")
                    return { success: false }
                } catch (e) {}
            }

            const pdfBlob = new Blob([ blob ], { type: "application/pdf" })
            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            setTimeout(() => window.URL.revokeObjectURL(url), 1000)
            return { success: true }
        }
        catch (error) {
            console.error("PDF Download Error:", error)
            alert(error.response?.data?.message || "Failed to download resume PDF.")
            return { success: false }
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}