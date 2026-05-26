const mongoose = require('mongoose');



/**
 * - job description : String
 * - resume text : String
 * - self description : String
 * 
 * - match score : Number
 * - Technical questions :[{
 *      question: String,
 *      intension: String,
 *      answer: String
 *   }]
 * - Behavioral questions : [{
 *     question: String,
 *     intension: String,
 *     answer: String
 *   }]
 * - Skill gap : [{
 *     skill: String,
 *     severity: String,
 *     enum: ['low', 'medium', 'high']
 *   }]
 * - preparation plan : [{
 *    day: Number,
 *    focus: String,
 *    topic: String,
 *    task: [String]
 * }]
 * 
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Technical question is required']
    },
    intention: {
        type: String,
        required: [true, 'Intention is required']
    },
    answer: {
        type: String,
        required: [true, 'Answer is required']
    }
},{
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Behavioral question is required']
    },
    intention: {
        type: String,
        required: [true, 'Intention is required']
    },
    answer: {
        type: String,
        required: [true, 'Answer is required']
    }
},{
    _id: false
})  

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, 'Skill is required']
    },
    severity: {
        type: String,
        required: [true, 'Severity is required'],
        enum: ['low', 'medium', 'high']
    }
},{
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, 'Day is required']
    },
    focus: {
        type: String,
        required: [true, 'Focus is required']
    },
    tasks: {
        type: [String],
        required: [true, 'Task is required']
    }
},{
    _id: false
})

const interviewReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job description is required']
    },
    jobDescription:{
        type: String,
        required: [true, 'Job description is required']
    },
    resume:{
        type: String,
    },
    selfDescription:{
        type: String,
    },
    matchScore:{
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
},{
    timestamps: true
})

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = InterviewReportModel;