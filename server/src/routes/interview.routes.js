import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  generateReport,
  getAllReports,
  getReport,
  deleteReport,
  updateProgress,
  generateResumeForReport,
  updateResume,
  getAtsScore,
  downloadResumePdf,
  askReportFollowUp,
  updateProgress,
} from '../controllers/interview.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// Interview report CRUD
router.post('/generate', upload.single('resume'), generateReport);
router.get('/', getAllReports);
router.get('/:id', getReport);
router.post('/:id/follow-up',askReportFollowUp)
router.delete('/:id', deleteReport);
router.put('/:id/progress', updateProgress);

// Resume endpoints
router.post('/:id/resume/generate', generateResumeForReport);
router.put('/:id/resume', updateResume);
router.post('/:id/resume/ats-score', getAtsScore);
router.post('/:id/resume/pdf', downloadResumePdf);
router.get('/:id/resume/pdf', downloadResumePdf);

export default router;
