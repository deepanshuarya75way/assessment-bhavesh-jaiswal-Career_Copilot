import mongoose from 'mongoose';

const interviewReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobTitle: { type: String, default: '' },
    companyName: { type: String, default: '' },
    jobDescription: { type: String, required: true },
    selfDescription: { type: String, default: '' },
    resumeText: { type: String, default: '' },

    // AI-generated content
    candidateSummary: { type: String, default: '' },
    jobSummary: { type: String, default: '' },
    matchScore: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],

    skillGaps: [
      {
        skill: String,
        category: { type: String, enum: ['strong', 'partial', 'missing'], default: 'missing' },
        importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
        reason: String,
        currentLevel: { type: Number, default: 0 },
        targetLevel: { type: Number, default: 5 },
        learningPriority: { type: String, enum: ['immediate', 'short-term', 'long-term'], default: 'short-term' },
      },
    ],

    technicalQuestions: [
      {
        question: String,
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        topic: String,
        whyAsked: String,
        expectedAnswerPoints: [String],
        completed: { type: Boolean, default: false },
      },
    ],

    behavioralQuestions: [
      {
        question: String,
        intent: String,
        category: String,
        suggestedApproach: String,
        userNotes: { type: String, default: '' },
        completed: { type: Boolean, default: false },
      },
    ],

    preparationRoadmap: [
      {
        day: Number,
        title: String,
        tasks: [
          {
            topic: String,
            priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
            estimatedTime: String,
            reason: String,
            resources: [String],
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],

    // Follow up Message 
    followUpMeassge:[
      {
        question:{
          type:String,
          required:true,
          trim:true,
        },
        answer:{
          type:String,
          required:true,
        },

        createdAt:{
          type:Date,
          default:Date.now,
        }
      }
    ]

    // ATS Resume data (null until generated)
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ATS Compatibility Score (null until analyzed)
    atsScore: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure users can only access their own reports
interviewReportSchema.index({ userId: 1, createdAt: -1 });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReport;
