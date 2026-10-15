import InterviewReport from '../models/InterviewReport.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { extractTextFromPDF, generateResumePDF } from '../services/pdf.service.js';
import {
  generateInterviewReport,
  generateResume,
  analyzeAtsScore,
  classifyAiError,
  answerReportFolloUp
} from '../services/ai.service.js';

import mongoose from 'mongoose';
/**
 * POST /api/interview/generate
 * Upload resume (optional) + job description + self description → AI analysis.
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { jobDescription, selfDescription, jobTitle, companyName } = req.body;

  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new AppError('Please provide a meaningful job description (at least 20 characters).', 400);
  }

  // Extract resume text if PDF uploaded
  let resumeText = '';
  if (req.file) {
    resumeText = await extractTextFromPDF(req.file.buffer);
  }

  // Call AI service
  let aiReport;
  try {
    aiReport = await generateInterviewReport(resumeText, jobDescription, selfDescription || '');
  } catch (err) {
    console.error('AI generation error:', err);
    const classified = classifyAiError(err);
    throw new AppError(classified.message, classified.statusCode, classified.code, classified);
  }

  // Save to database
  const report = await InterviewReport.create({
    userId: req.user._id,
    jobTitle: aiReport.jobTitle || jobTitle || 'Untitled',
    companyName: aiReport.companyName || companyName || 'Unknown',
    jobDescription,
    selfDescription: selfDescription || '',
    resumeText,
    candidateSummary: aiReport.candidateSummary,
    jobSummary: aiReport.jobSummary,
    matchScore: aiReport.matchScore,
    strengths: aiReport.strengths,
    weaknesses: aiReport.weaknesses,
    skillGaps: aiReport.skillGaps,
    technicalQuestions: aiReport.technicalQuestions,
    behavioralQuestions: aiReport.behavioralQuestions,
    preparationRoadmap: aiReport.preparationRoadmap,
  });

  res.status(201).json({ success: true, data: report });
});

/**
 * GET /api/interview
 * List all reports for current user.
 */
export const getAllReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const query = { userId: req.user._id };
  if (search) {
    query.$or = [
      { jobTitle: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
    ];
  }

  const [reports, total] = await Promise.all([
    InterviewReport.find(query)
      .select('jobTitle companyName matchScore createdAt resumeData technicalQuestions behavioralQuestions skillGaps')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InterviewReport.countDocuments(query),
  ]);

  const formatted = reports.map((r) => ({
    _id: r._id,
    jobTitle: r.jobTitle,
    companyName: r.companyName,
    matchScore: r.matchScore || 0,
    createdAt: r.createdAt,
    hasResume: !!(r.resumeData && (r.resumeData.summary || (Array.isArray(r.resumeData.skills) && r.resumeData.skills.length > 0))),
    technicalCount: (r.technicalQuestions || []).length,
    behavioralCount: (r.behavioralQuestions || []).length,
    skillGapCount: (r.skillGaps || []).length,
  }));

  res.json({
    success: true,
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/interview/:id
 * Get a single report (ownership verified).
 */
export const getReport = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  res.json({ success: true, data: report });
});

/**
 * DELETE /api/interview/:id
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  res.json({ success: true, message: 'Report deleted.' });
});

export const askReportFollowUP = asyncHandler(async(req,res)=>{
  const question = 
  typeof req.body.question ==='string'
  ? req.body.question.trim()
  : '';
  
  
  if(!question){
    throw new AppError(
      'Please enter a question.',
      400,
      'EMPTY_QUESTION'
    );
  }

  if(question.length>2000){
    throw new AppError(
      'Question must be 2,000 characters or fewer.',
      400,
      'QUESTION_TOO_LONG'
    );
  }

  if(!mongoose.isValidObjectId(req.params.id)){
    throw new AppError('Report not found.',404);
  }

  const report = await InterviewReport.findbyId(re.params.id);

  if(!report){
    throw new AppError('Report not found.',404);
  }

  if(report.userId.toString()!==req.user._id.toString()){
    throw new AppError(
      'You are not authorized to acccess this report',
      403,
      'REPORT_FORBIDDEN'
    );
  }

  let result;
  try{
      result = await answerReportFolloUp(
      report,
      report,
      report.followUpMessages ||[],
      question
    );
  }catch(err){
    console.error('Follow-Up answer error:',err);

    const classified = classifyAiError(err);
    

    throw new Apperror(
      classified.message,
      classified.statusCode,
      classified.code,
      classified
    );
  }

  report.followUpMessages.push({
    question,answer:result.answer,
  });

  await report.save();

  res.status(201).json({
    success:true,
    data:report.followUpMessages[
      report.followUpMessages.length-1
    ],
    messages:report.followUpMessages,
  });

});

/**
 * PUT /api/interview/:id/progress
 * Update completion status (questions, roadmap tasks).
 */
export const updateProgress = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) throw new AppError('Report not found.', 404);

  const { technicalQuestions, behavioralQuestions, preparationRoadmap } = req.body;

  if (technicalQuestions) report.technicalQuestions = technicalQuestions;
  if (behavioralQuestions) report.behavioralQuestions = behavioralQuestions;
  if (preparationRoadmap) report.preparationRoadmap = preparationRoadmap;

  await report.save();
  res.json({ success: true, data: report });
});

/* ──────────────────────────────────────────
   RESUME ENDPOINTS
   ────────────────────────────────────────── */

/**
 * POST /api/interview/:id/resume/generate
 */
export const generateResumeForReport = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) throw new AppError('Report not found.', 404);

  let resumeData;
  try {
    resumeData = await generateResume(
      report.resumeText,
      report.jobDescription,
      report.selfDescription,
      report.skillGaps
    );
  } catch (err) {
    console.error('Resume generation error:', err);
    const classified = classifyAiError(err);
    throw new AppError(classified.message, classified.statusCode, classified.code, classified);
  }

  report.resumeData = resumeData;
  await report.save();

  res.json({ success: true, data: resumeData });
});

/**
 * PUT /api/interview/:id/resume
 */
export const updateResume = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) throw new AppError('Report not found.', 404);

  report.resumeData = req.body.resumeData;
  await report.save();

  res.json({ success: true, data: report.resumeData });
});

/**
 * POST /api/interview/:id/resume/ats-score
 */
export const getAtsScore = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) throw new AppError('Report not found.', 404);
  const hasContent = report.resumeData && (
    report.resumeData.summary ||
    (Array.isArray(report.resumeData.skills) && report.resumeData.skills.length > 0) ||
    (Array.isArray(report.resumeData.experience) && report.resumeData.experience.length > 0)
  );
  if (!hasContent) throw new AppError('Please generate a resume first.', 400);

  let atsScore;
  try {
    atsScore = await analyzeAtsScore(report.resumeData, report.jobDescription);
  } catch (err) {
    console.error('ATS analysis error:', err);
    const classified = classifyAiError(err);
    throw new AppError(classified.message, classified.statusCode, classified.code, classified);
  }

  report.atsScore = atsScore;
  await report.save();

  res.json({ success: true, data: atsScore });
});

/**
 * POST /api/interview/:id/resume/pdf or GET /api/interview/:id/resume/pdf
 */
export const downloadResumePdf = asyncHandler(async (req, res) => {
  const report = await InterviewReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) throw new AppError('Report not found.', 404);
  const hasContent = report.resumeData && (
    report.resumeData.summary ||
    (Array.isArray(report.resumeData.skills) && report.resumeData.skills.length > 0) ||
    (Array.isArray(report.resumeData.experience) && report.resumeData.experience.length > 0)
  );
  if (!hasContent) throw new AppError('Please generate a resume first before downloading.', 400);

  const pdfBuffer = await generateResumePDF(report.resumeData);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="resume-${(report.jobTitle || 'download').replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
  );
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer);
});
