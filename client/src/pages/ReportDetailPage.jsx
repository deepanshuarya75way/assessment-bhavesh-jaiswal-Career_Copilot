import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Target,
  Sparkles,
  MessageCircle,
  Send,
  LoaderCircle,
} from 'lucide-react';
import api from '../services/api.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'skills' | 'technical' | 'behavioral' | 'roadmap'
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpMessages, serFollowUpMessages] = useState([]);
  const [followUpLoading,SetFollowUpLoading] = useState(false);
  // Copy helper
  const handleCopy = (text, label = 'Content') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/interview/${id}`);
        setReport(res.data.data);
        setFollowUpMessages(
          res.data.data.followUpMessages || []
        );
      } catch {
        toast.error('Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleFollowUpSubmit = async(event)=>{
    event.preventDefault();

    const question = followUpQuestion.trim();
    
    if(!question){
      toast.error('please enter a question.');
      return ;
    }

    setFollowUpLoading(true);

    try{
      const res = await api.post(
        `/interview/${id}/follow-up`,
        {question}
      );



      setFollowUpMessages(
        res.data.Messages ||
        [...followUpMessages,res.data.data]
      );

      setFollowUpQuestion('');
    }catch(error){
      toast.error(
        error.message ||
        'Unable to answer this follow-Up Question.'
      );
    }finally{
      setFollowUpLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#F1EDF9] rounded-xl animate-pulse" />
        <div className="h-44 bg-white border border-[#E7E1F1] rounded-2xl animate-pulse" />
        <div className="h-96 bg-white border border-[#E7E1F1] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="p-12 text-center max-w-md mx-auto border-[#E7E1F1]">
        <AlertCircle className="w-10 h-10 text-[#B83A52] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#26213A] mb-1">
          Report Not Found
        </h2>
        <p className="text-xs text-[#716B85] mb-4">
          This analysis report could not be found or you do not have permission to view it.
        </p>
        <Button variant="secondary" onClick={() => (window.location.href = '/reports')}>
          Back to Reports
        </Button>
      </Card>
    );
  }

  const strongSkills = (report.skillGaps || []).filter((s) => s.category === 'strong');
  const partialSkills = (report.skillGaps || []).filter((s) => s.category === 'partial');
  const missingSkills = (report.skillGaps || []).filter((s) => s.category === 'missing');

  const hasResume = Boolean(
    report.resumeData &&
      (report.resumeData.summary ||
        (Array.isArray(report.resumeData.skills) && report.resumeData.skills.length > 0))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={report.jobTitle}
        description={`Analyzed for ${report.companyName} on ${new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
        breadcrumbs={[
          { label: 'Reports', to: '/reports' },
          { label: report.jobTitle },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link to={`/reports/${id}/resume`}>
              <Button variant="primary" size="sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                {hasResume ? 'View Tailored Resume' : 'Generate Resume'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Overview Panel */}
      <Card className="p-6 border-[#E7E1F1] bg-[#FFFFFF] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-[#E7E1F1]">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-[#918BA2] font-bold">
              Overall Compatibility
            </span>
            <div className="flex items-center gap-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#6845C5] tracking-tight">
                {report.matchScore || 0}%
              </div>
              <Badge variant="neutral" size="md">
                {(report.matchScore || 0) >= 75
                  ? 'High Compatibility'
                  : (report.matchScore || 0) >= 50
                  ? 'Moderate Match'
                  : 'Needs Preparation'}
              </Badge>
            </div>
          </div>

          {/* Quick Skill Breakdown Counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8F7FC] border border-[#DDD0FF] text-center shadow-2xs">
              <div className="text-base font-extrabold text-[#247A57]">{strongSkills.length}</div>
              <div className="text-[11px] font-semibold text-[#716B85]">Strong</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8F7FC] border border-[#DDD0FF] text-center shadow-2xs">
              <div className="text-base font-extrabold text-[#94621B]">{partialSkills.length}</div>
              <div className="text-[11px] font-semibold text-[#716B85]">Partial</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8F7FC] border border-[#DDD0FF] text-center shadow-2xs">
              <div className="text-base font-extrabold text-[#B83A52]">{missingSkills.length}</div>
              <div className="text-[11px] font-semibold text-[#716B85]">Missing</div>
            </div>
          </div>
        </div>
        <card className="p-5 sm:p-6 boarder-[#E7E1F1] space-y-4">
          <div className="flex item-start gap-3">
            <div className="w-10 h-10 rounded-x1 bg-[#f2EDFC] text-[#6845C5] flex items-center
            justify-center shrink-0">
              <MessageCircle className="w-5 h-5"/>
            </div>

          <div>
            <h2 className = "text-base font-bold text-[#26213A]">
              Ask a Follow-Up Question
            </h2>
            <p clasName= "text-xs sm:text-sm text-[#716B85] mt-1">
              Ask about this report skills,interview question, or Preparation roadmap.
            </p>
          </div>
          </div>

          {followUpMessages.length>0 && (
            <div
            className="space-y-4 max-h-[520px] overflow-y-auto pr-1"
            aria-live="polite">

              {followUpMessages.map((message,index)=>
              <div
              key={message._id || `${message.createdAt || index}-${index}`}
              className="space-y-3">
                <div className="ml-auto max-1-[92%] sm:max-w-[85%] rouunded-2xl rounded-br-md bg-[#6845C5] text-white p-4">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-white/ 70 mb-1">
                  your question . {index+1}
                </div>

                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.question}
                  </p>
                </div>

                <div className="max-w-[95%] sm:max-w-[90%] rounded-2xl rounded-bl-md bg-[#F8F7FC] boarder boarder-[#E7E1F1] p-4">
                 <div className="text-[10px] uppercase tracking-winder font-bold text-[#6845C5] mb-1">
                  carrer copilet
                </div>
              <p className="text-sm text-[#26213A] leading-relaxed whitespace-pre-wrap break-words">
                {message.answer}
              </p>
                </div>
              </div>
              ))}
              </div>

              
          )}

          {followUpMessages.length===0 &&(
            <div className="rounded-xl border border-dashed norder-[#DCD3ED] bg-[#FBFAFE] p-5 text-center">
              
              <p className = "text-sm font-semibold text- [#49316f]">
                continue your analysis
              </p>

              <p className="text-xs text-[#716B85] mt-1">
                your question and answers will stay with this report.
              </P>
            </div>
          )}

          <form onSubmit={handleFollowUpSubmit} className="space-y-2">
            <label
              htmlFor="follow-up-question"
              className="block text-xs font-bold text-[#49316F]">
                your Question
            </label>

            <textarea
              id="follow-up-question"
              value={followUpQuestion}
              onChange={(event)=>
                setFollowUpQuestion(event.target.value)
              }
              placeholder="For example:How Should I improve the skill "
            


        {/* Executive Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-[#F8F7FC] border border-[#E7E1F1] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#49316F]">
                Candidate Summary
              </span>
              <button
                onClick={() => handleCopy(report.candidateSummary, 'Candidate summary')}
                className="text-[#918BA2] hover:text-[#6845C5] p-1 cursor-pointer transition-colors"
                aria-label="Copy summary"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#26213A] leading-relaxed">
              {report.candidateSummary || 'No candidate summary extracted.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7FC] border border-[#E7E1F1] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#49316F]">
                Role Summary
              </span>
              <button
                onClick={() => handleCopy(report.jobSummary, 'Role summary')}
                className="text-[#918BA2] hover:text-[#6845C5] p-1 cursor-pointer transition-colors"
                aria-label="Copy role summary"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#26213A] leading-relaxed">
              {report.jobSummary || 'No role summary provided.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Structured Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E1F1] pb-2 overflow-x-auto select-none">
        {[
          { id: 'overview', label: 'Strengths & Gaps' },
          { id: 'skills', label: `Skills (${report.skillGaps?.length || 0})` },
          { id: 'technical', label: `Technical Qs (${report.technicalQuestions?.length || 0})` },
          { id: 'behavioral', label: `Behavioral Qs (${report.behavioralQuestions?.length || 0})` },
          { id: 'roadmap', label: `Roadmap (${report.preparationRoadmap?.length || 0} Days)` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#6845C5] text-white border-[#6845C5] shadow-xs'
                : 'bg-white text-[#716B85] hover:text-[#26213A] hover:bg-[#F2EDFC] border-[#E7E1F1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview (Strengths & Areas to Improve) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3.5 border-[#E7E1F1]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#247A57]" />
              <h3 className="text-sm sm:text-base font-bold text-[#26213A]">
                Candidate Strengths
              </h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm leading-relaxed">
              {(report.strengths || []).map((s, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F7FC] border border-[#E7E1F1] text-[#26213A]">
                  <span className="text-[#6845C5] font-bold mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3.5 border-[#E7E1F1]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#94621B]" />
              <h3 className="text-sm sm:text-base font-bold text-[#26213A]">
                Areas for Improvement
              </h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm leading-relaxed">
              {(report.weaknesses || []).map((w, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F7FC] border border-[#E7E1F1] text-[#26213A]">
                  <span className="text-[#94621B] font-bold mt-0.5">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Tab: Detailed Skills Gap Breakdown */}
      {activeTab === 'skills' && (
        <Card className="p-6 space-y-5 border-[#E7E1F1]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#26213A]">
                Skill Classification Breakdown
              </h3>
              <p className="text-xs text-[#716B85]">
                Skills required by the job evaluated against your uploaded resume and background
              </p>
            </div>
            <Link to={`/reports/${id}/skills`}>
              <Button variant="secondary" size="sm">
                Dedicated View <ExternalLink className="w-3 h-3 ml-1 text-[#6845C5]" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {(report.skillGaps || []).map((sg, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F8F7FC] border border-[#E7E1F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#26213A] text-sm">
                      {sg.skill}
                    </span>
                    <Badge variant={sg.category === 'strong' ? 'outline' : 'neutral'} size="sm">
                      {sg.category}
                    </Badge>
                    <span className="text-[11px] text-[#918BA2] uppercase font-bold">
                      Priority: {sg.importance}
                    </span>
                  </div>
                  {sg.reason && (
                    <p className="text-xs text-[#716B85] leading-relaxed">{sg.reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="text-xs font-semibold text-[#49316F] bg-white border border-[#E7E1F1] px-2.5 py-1 rounded-lg">
                    Level: {sg.currentLevel || 1}/5 → Target {sg.targetLevel || 5}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Technical Interview Questions */}
      {activeTab === 'technical' && (
        <Card className="p-6 space-y-5 border-[#E7E1F1]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#26213A]">
                Technical Interview Preparation
              </h3>
              <p className="text-xs text-[#716B85]">
                Role-specific technical questions generated from the job description
              </p>
            </div>
            <Link to={`/reports/${id}/technical`}>
              <Button variant="secondary" size="sm">
                Interactive Practice <ExternalLink className="w-3 h-3 ml-1 text-[#6845C5]" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3.5">
            {(report.technicalQuestions || []).map((q, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E1F1] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      Q{idx + 1}
                    </Badge>
                    <span className="text-xs font-bold text-[#49316F]">
                      {q.topic || 'General'} • {q.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(q.question, 'Question')}
                    className="text-[#918BA2] hover:text-[#6845C5] p-1 transition-colors"
                    aria-label="Copy question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#26213A] leading-relaxed">
                  {q.question}
                </p>

                {q.whyAsked && (
                  <p className="text-xs text-[#716B85] italic">
                    Why interviewer asks: {q.whyAsked}
                  </p>
                )}

                {q.expectedAnswerPoints && q.expectedAnswerPoints.length > 0 && (
                  <div className="pt-2.5 border-t border-[#E7E1F1]">
                    <span className="text-[11px] font-bold text-[#49316F] uppercase tracking-wider block mb-1.5">
                      Key Evaluation Points:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[#26213A]">
                      {q.expectedAnswerPoints.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Behavioral Questions */}
      {activeTab === 'behavioral' && (
        <Card className="p-6 space-y-5 border-[#E7E1F1]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#26213A]">
                Behavioral Questions (STAR Methodology)
              </h3>
              <p className="text-xs text-[#716B85]">
                Questions targeting leadership, teamwork, problem solving, and culture fit
              </p>
            </div>
            <Link to={`/reports/${id}/behavioral`}>
              <Button variant="secondary" size="sm">
                Interactive Practice <ExternalLink className="w-3 h-3 ml-1 text-[#6845C5]" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3.5">
            {(report.behavioralQuestions || []).map((q, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E1F1] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      Q{idx + 1}
                    </Badge>
                    <span className="text-xs font-bold text-[#49316F]">
                      {q.category || 'Behavioral'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(q.question, 'Behavioral question')}
                    className="text-[#918BA2] hover:text-[#6845C5] p-1 transition-colors"
                    aria-label="Copy question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#26213A] leading-relaxed">
                  {q.question}
                </p>

                {q.suggestedApproach && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E7E1F1] text-xs text-[#26213A] leading-relaxed">
                    <span className="font-bold text-[#49316F] block mb-1">
                      Suggested STAR Structure:
                    </span>
                    {q.suggestedApproach}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Preparation Roadmap */}
      {activeTab === 'roadmap' && (
        <Card className="p-6 space-y-5 border-[#E7E1F1]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#26213A]">
                Structured Preparation Roadmap
              </h3>
              <p className="text-xs text-[#716B85]">
                Step-by-step day-by-day plan to prepare for this specific interview
              </p>
            </div>
            <Link to={`/reports/${id}/roadmap`}>
              <Button variant="secondary" size="sm">
                Interactive Checklist <ExternalLink className="w-3 h-3 ml-1 text-[#6845C5]" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3.5">
            {(report.preparationRoadmap || []).map((day, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E1F1] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#26213A]">
                    Day {day.day}: {day.title}
                  </span>
                  <Badge variant="outline" size="sm">
                    {day.tasks?.length || 0} Tasks
                  </Badge>
                </div>

                <div className="space-y-2">
                  {(day.tasks || []).map((t, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-3 rounded-xl bg-white border border-[#E7E1F1] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 flex-1">
                        <span className="font-semibold text-[#26213A]">{t.topic}</span>
                        {t.reason && <p className="text-[11px] text-[#716B85]">{t.reason}</p>}
                      </div>
                      <span className="text-[11px] font-medium text-[#918BA2] shrink-0">
                        {t.estimatedTime || '1h'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
