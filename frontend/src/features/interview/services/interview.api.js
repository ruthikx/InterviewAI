import axios from "axios";
import Interview from "../pages/Interview";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})
/**
 * @description Service to generate interview report by sending job description, self description and resume file to backend
 * 
 */
export const generateInterviewReport = async ({jobDescription, selfDescription, resumeFile}) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    const response = await api.post("/api/interview/",formData,{
        headers:{
            "Content-Type": "multipart/form-data"
        }
    })
    return response.data
}

/**
 * 
 * @description Service to get interview report by interviewId
 */

export const getInterviewReportById = async (InterviewId) => {
    const response = await api.get(`/api/interview/report/${InterviewId}`)

    return response.data
}
/**
 * @description Service to get all interview reports of logged in user 
 */
export const getAllInterviewReports = async () =>{
    const response = await api.get("/api/interview")

    return response.data
}
/**
 * @description Service to generate resume PDF based on resume, self description and job description
 */

export const generateResumePdf = async ({interviewReportId}) =>{
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`,null,{
        responseType: "blob"
    })

    return response.data
}







