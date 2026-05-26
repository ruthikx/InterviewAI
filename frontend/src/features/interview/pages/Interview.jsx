import React, { useState,useEffect } from 'react'
import "../style/interview.scss"
import { useInterview } from '../hooks/useInterview'
import {useNavigate,useParams} from 'react-router'
import Lottie from "react-lottie-player"
// const report = {
//     title: "Full Stack Developer Intern",
//     matchScore: 80,
//     technicalQuestions: [
//         {
//             question: "Explain the concept of React Hooks and provide examples of when you would use useState and useEffect.",
//             intention: "Assess understanding of React fundamentals and practical application.",
//             answer: "Candidate should explain useState for state management and useEffect for side effects, providing clear use cases."
//         },
//         {
//             question: "You've worked with Firebase. Can you describe how you integrated Firebase into your SkyRabbit mobile chat application, specifically for real-time messaging?",
//             intention: "Evaluate practical experience with Firebase and real-time data handling.",
//             answer: "Candidate should discuss Firebase Firestore or Realtime Database, data models, and how real-time updates were managed."
//         },
//         {
//             question: "The job requires building backend APIs using Node.js and Express.js. While not explicitly listed in your skills, can you describe any backend development experience you have, and how you might approach learning Node.js and Express.js for this role?",
//             intention: "Identify existing backend knowledge and assess willingness or approach to learning new backend technologies.",
//             answer: "Candidate should discuss any server-side logic or database interactions they've implemented and outline a plan for learning Node.js and Express.js."
//         },
//         {
//             question: "You have experience with MongoDB and Firestore. Can you explain the key differences between a NoSQL database like MongoDB and a relational database, and when you would choose one over the other?",
//             intention: "Test database knowledge and understanding of different database paradigms.",
//             answer: "Candidate should discuss schema flexibility, scalability, data relationships, and appropriate use cases for each."
//         },
//         {
//             question: "The role involves integrating third-party APIs and AI services. Can you describe your experience with API integration and how you would approach integrating a new, unfamiliar API?",
//             intention: "Assess API integration skills and problem-solving approach for new technologies.",
//             answer: "Candidate should discuss making HTTP requests, handling responses, error handling, and steps for understanding new API documentation."
//         }
//     ],
//     behavioralQuestions: [
//         {
//             question: "The job description mentions a passion for learning new technologies. Can you tell me about a time you had to learn a completely new technology or framework for a project, and what steps you took to master it?",
//             intention: "Evaluate the candidate's learning agility and self-directed learning skills.",
//             answer: "Candidate should use the STAR method to describe a situation, task, action, and result related to learning a new technology."
//         },
//         {
//             question: "You've worked on several projects, including a mobile chat application and an E-book website. Describe a significant technical challenge you faced during one of these projects and how you overcame it.",
//             intention: "Assess problem-solving skills, resilience, and technical troubleshooting abilities.",
//             answer: "Candidate should use the STAR method, focusing on the technical aspects of the challenge and their solution."
//         },
//         {
//             question: "This is an internship role where collaboration is key. Describe a situation where you had to collaborate with others on a technical project. What was your role, and how did you contribute to the team's success?",
//             intention: "Evaluate teamwork, communication, and collaboration skills.",
//             answer: "Candidate should use the STAR method, highlighting their contribution to a team project and how they interacted with others."
//         }
//     ],
//     skillGaps: [
//         { skill: "Node.js and Express.js", severity: "high" },
//         { skill: "AI API Integrations", severity: "medium" },
//         { skill: "Tailwind CSS/SCSS", severity: "low" },
//         { skill: "Deployment Experience", severity: "medium" }
//     ],
//     preparationPlan: [
//         {
//             day: 1,
//             focus: "Node.js and Express.js Fundamentals",
//             tasks: [
//                 "Complete an introductory tutorial on Node.js and Express.js (for example, building a simple REST API).",
//                 "Understand routing, middleware, and basic server setup."
//             ]
//         },
//         {
//             day: 2,
//             focus: "React.js Advanced Concepts and Best Practices",
//             tasks: [
//                 "Review React component lifecycle and advanced hooks such as useReducer, useCallback, and useMemo.",
//                 "Practice state management patterns in React applications."
//             ]
//         },
//         {
//             day: 3,
//             focus: "MongoDB and API Integration Practice",
//             tasks: [
//                 "Practice CRUD operations with MongoDB using a Node.js driver if possible.",
//                 "Integrate a public REST API into a simple frontend application."
//             ]
//         },
//         {
//             day: 4,
//             focus: "Introduction to AI API Concepts",
//             tasks: [
//                 "Research common types of AI APIs such as natural language processing and image recognition.",
//                 "Explore documentation for a simple AI API and understand basic request and response patterns."
//             ]
//         },
//         {
//             day: 5,
//             focus: "Interview Practice and Review",
//             tasks: [
//                 "Review common technical interview questions for React, JavaScript, and Node.js.",
//                 "Practice explaining project experiences and problem-solving approaches using the STAR method."
//             ]
//         }
//     ]
// }

const tabs = [
    { id: "technical", label: "Technical questions" },
    { id: "behavioral", label: "Behavioral questions" },
    { id: "roadmap", label: "Road Map" }
]

const severityLabelMap = {
    high: "High priority",
    medium: "Medium priority",
    low: "Low priority"
}

const Interview = () => {

    const [activeTab, setActiveTab] = useState("technical")

    const {report,getReportById,loading,getResumePdf} = useInterview()

    const {interviewId} = useParams()

    useEffect(()=>{
        if(interviewId){
            getReportById(interviewId)
        }
    }, [interviewId])

    if(loading || !report){
        return (
            <main className='loading-screen'>
                <Lottie
                    loop
                    play
                    path="/animation/ai.json"
                    className='loading-animation'
                />
            </main>
        )
    }

    const renderQuestionList = (questions) => (
        <div className='report-section'>
            <div className='report-section__header'>
                <span className='report-section__eyebrow'>Interview prep</span>
                <h2>{activeTab === "technical" ? "Technical deep dive" : "Behavioral storytelling prompts"}</h2>
                <p>
                    {activeTab === "technical"
                        ? "Use these prompts to rehearse architecture, tools, and implementation choices with crisp, structured answers."
                        : "Frame each answer with a clear situation, your contribution, and the measurable outcome."}
                </p>
            </div>

            <div className='question-list'>
                {questions.map((item, index) => (
                    <article className='question-card' key={item.question}>
                        <div className='question-card__index'>Q{index + 1}</div>
                        <div className='question-card__body'>
                            <h3>{item.question}</h3>
                            <div className='question-card__meta'>
                                <span>Why this matters</span>
                                <p>{item.intention}</p>
                            </div>
                            <div className='question-card__answer'>
                                <span>Strong answer should include</span>
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )

    const renderRoadmap = () => (
        <div className='report-section'>
            <div className='report-section__header'>
                <span className='report-section__eyebrow'>Preparation plan</span>
                <h2>5-day roadmap</h2>
                <p>Focus on the highest-impact gaps first, then finish with interview rehearsal and polish.</p>
            </div>

            <div className='roadmap-list'>
                {report.preparationPlan.map((item) => (
                    <article className='roadmap-card' key={item.day}>
                        <div className='roadmap-card__day'>Day {item.day}</div>
                        <div className='roadmap-card__content'>
                            <h3>{item.focus}</h3>
                            <ul>
                                {item.tasks.map((task) => (
                                    <li key={task}>{task}</li>
                                ))}
                            </ul>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )

    const renderMainContent = () => {
        if (activeTab === "behavioral") {
            return renderQuestionList(report.behavioralQuestions)
        }

        if (activeTab === "roadmap") {
            return renderRoadmap()
        }

        return renderQuestionList(report.technicalQuestions)
    }

    return (
        <div className='interview-report-page'>
            <div className='interview-report-shell'>
                <aside className='report-sidebar'>
                    <div className='report-sidebar__header'>
                        <span className='report-sidebar__label'>Interview report</span>
                        <h1>{report.title}</h1>
                    </div>

                    <nav className='report-nav'>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type='button'
                                className={`report-nav__item ${activeTab === tab.id ? "is-active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className='report-main'>
                    <div className='report-main__topbar'>
                        <div>
                            <span className='report-main__label'>Candidate match</span>
                            <h2>{report.matchScore}% fit for this role</h2>
                        </div>
                        <div className='score-pill'>
                            <span className='score-pill__value'>{report.matchScore}</span>
                            <span className='score-pill__text'>Match Score</span>
                        </div>
                    </div>

                    <div className='report-main__content'>
                        {renderMainContent()}
                    </div>
                </main>

                <aside className='report-insights'>
                    <div className='download-pdf'>
                        <button className='btn btn--primary' onClick={() => getResumePdf(report._id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
                                <path d="M5 20h14v2H5c-1.103 0-2-.897-2-2V6h2v14zm14-9h2l-7-7-7 7h2v6h10v-6z" />
                            </svg>
                            Download Resume as PDF
                        </button>
                    </div>
                    <div className='report-insights__section'>
                        <div className='report-insights__header'>
                            <span className='report-insights__eyebrow'>Skill Gaps</span>
                            <p>These are the focus areas most likely to come up during screening.</p>
                        </div>

                        <div className='skill-chip-list'>
                            {report.skillGaps.map((item) => (
                                <div className={`skill-chip skill-chip--${item.severity}`} key={item.skill}>
                                    <strong>{item.skill}</strong>
                                    <span>{severityLabelMap[item.severity]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='report-insights__section report-insights__section--summary'>
                        <span className='report-insights__eyebrow'>Quick guidance</span>
                        <ul className='summary-list'>
                            <li>Lead with frontend strengths, then connect them to backend learning agility.</li>
                            <li>Prepare one Firebase project story and one teamwork story using STAR.</li>
                            <li>Keep explanations structured: problem, approach, tradeoff, and result.</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Interview
