"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  CheckCircle2,
  Circle,
  Check,
  AlertTriangle,
  Upload,
  Eye,
  MessageCircle,
  X,
  FileText,
  Clock,
} from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";

// ─── Mock data ───────────────────────────────────────────────────────────────
const APPLICATION = {
  id: "APP-00124",
  status: "Ready for Review",
  student: {
    fullName: "Tariq Hamza Ahmad",
    email: "tariq@email.com",
    phone: "+255 712 345 678",
    dob: "15 March 2001",
    nationality: "Tanzanian",
  },
  university: "SRM University AP",
  course: "BSc Computer Science",
  intake: "September 2026",
  studyLevel: "Undergraduate",
  applicationDate: "26 August 2026",
  academic: {
    qualification: "A-Level",
    school: "XYZ Secondary School",
    completionYear: "2025",
    grades: "A, B+, B, B",
    westernEquivalent: "Ordinary level / A-level",
  },
  previousEducation: "Completed A-Level at XYZ Secondary School, Dar es Salaam. Studied Physics, Chemistry, Mathematics.",
  passport: {
    hasPassport: true,
    status: "Has Passport",
    number: "TA1234567",
    issueDate: "12 March 2025",
    expiryDate: "11 March 2035",
  },
  documents: [
    { name: "Academic Certificate", status: "Uploaded", verified: true },
    { name: "Academic Transcript", status: "Pending", verified: false },
    { name: "Passport Photo", status: "Uploaded", verified: true },
    { name: "Proof of Passport", status: "Uploaded", verified: true },
    { name: "Other Documents", status: "Uploaded", verified: true },
  ],
  comments: [],
  timeline: [
    { label: "Application Submitted", done: true },
    { label: "Application Approved", done: false },
    { label: "Submitted to University", done: false },
    { label: "University Processing", done: false },
    { label: "University Approved", done: false },
    { label: "Offer Received", done: false },
    { label: "Visa Processing", done: false },
    { label: "Completed", done: false },
  ],
};

// ─── Document Pending Modal ───────────────────────────────────────────────────
function DocumentPendingModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [docType, setDocType] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Mark Document Pending</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Document</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select document...</option>
              {APPLICATION.documents.map((d) => <option key={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select reason...</option>
              <option>Missing</option>
              <option>Unclear</option>
              <option>Wrong document</option>
              <option>Expired</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Comment</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please upload a clearer copy of your transcript..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Student will receive a notification with this message.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all">
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Comment Modal ────────────────────────────────────────────────────────
function CommentModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Add Comment / Request Info</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Application ID: <span className="font-mono font-semibold text-slate-700">{APPLICATION.id}</span> — {APPLICATION.student.fullName}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Message / Comment</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="The selected course is currently unavailable. Please choose another programme."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Request Type</label>
            <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>Document Clarification</option>
              <option>Course Change Request</option>
              <option>Information Required</option>
              <option>General Note</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-600">Notify student via email</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewApplicationPage({ params }: { params: { id: string } }) {
  const [showDocPending, setShowDocPending] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [approved, setApproved] = useState(false);
  const [universityStatus, setUniversityStatus] = useState("Approved");

  const appId = params.id || APPLICATION.id;

  return (
    <>
      {showDocPending && <DocumentPendingModal onClose={() => setShowDocPending(false)} />}
      {showComment && <CommentModal onClose={() => setShowComment(false)} />}

      <div className="space-y-5 max-w-[1100px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/applications" className="hover:text-blue-600">Applications</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">{appId}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 mb-1">Application #{appId}</p>
              <h1 className="text-2xl font-bold text-slate-900">{APPLICATION.student.fullName}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {APPLICATION.university} · {APPLICATION.course}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {approved && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">Approved by you</span>
                </div>
              )}
              <StatusBadge status={APPLICATION.status} size="md" />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="space-y-5">
            {/* A. Student Information */}
            <SectionCard title="A. Student Information">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={APPLICATION.student.fullName} />
                <InfoRow label="Email" value={APPLICATION.student.email} />
                <InfoRow label="Phone" value={APPLICATION.student.phone} />
                <InfoRow label="Date of Birth" value={APPLICATION.student.dob} />
                <InfoRow label="Nationality" value={APPLICATION.student.nationality} />
              </div>
            </SectionCard>

            {/* B. University & Course */}
            <SectionCard title="B. University & Course">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="University" value={APPLICATION.university} />
                <InfoRow label="Course" value={APPLICATION.course} />
                <InfoRow label="Intake" value={APPLICATION.intake} />
                <InfoRow label="Study Level" value={APPLICATION.studyLevel} />
                <InfoRow label="Application Date" value={APPLICATION.applicationDate} />
              </div>
            </SectionCard>

            {/* C. Academic Background */}
            <SectionCard title="C. Academic Background">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Highest Qualification" value={APPLICATION.academic.qualification} />
                <InfoRow label="School" value={APPLICATION.academic.school} />
                <InfoRow label="Completion Year" value={APPLICATION.academic.completionYear} />
                <InfoRow label="Grades" value={APPLICATION.academic.grades} />
                <InfoRow label="Western Equivalent" value={APPLICATION.academic.westernEquivalent} />
              </div>
            </SectionCard>

            {/* D. Previous Education */}
            <SectionCard title="D. Previous Education">
              <p className="text-sm text-slate-700 leading-relaxed">{APPLICATION.previousEducation}</p>
            </SectionCard>

            {/* F. Documents */}
            <SectionCard title="F. Documents">
              <div className="space-y-2.5">
                {APPLICATION.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      {doc.verified ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                        </div>
                      )}
                      <span className="text-sm text-slate-700 font-medium">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.verified ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                        {doc.status}
                      </span>
                      {doc.verified && (
                        <button className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* H. Comments */}
            <SectionCard title="H. Comments">
              {APPLICATION.comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-xs mt-1">Add a comment to communicate with the student.</p>
                </div>
              ) : null}
            </SectionCard>

            {/* I. University Status */}
            <SectionCard title="I. University Status">
              <p className="text-xs text-slate-500 mb-3">
                Update the status manually after completing the university application process.
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={universityStatus}
                  onChange={(e) => setUniversityStatus(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option>Approved</option>
                  <option>Submitted to University</option>
                  <option>University Processing</option>
                  <option>University Approved</option>
                  <option>Offer Received</option>
                  <option>Visa Processing</option>
                  <option>Completed</option>
                </select>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm cursor-pointer">
                  Save Status
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                ⚠ MtishbiScholar does not auto-submit to universities. This is a status record only.
              </p>
            </SectionCard>

            {/* J. Offer Letter */}
            <SectionCard title="J. Offer Letter">
              <div className="flex items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">No offer letter uploaded yet.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload after university approves the application.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </SectionCard>

            {/* K. Application Timeline */}
            <SectionCard title="K. Application Timeline">
              <div className="relative">
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-4">
                  {APPLICATION.timeline.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-3 relative">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        step.done
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-slate-300"
                      }`}>
                        {step.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-sm ${step.done ? "text-slate-800 font-medium" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                      {i === 0 && step.done && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> 26 Aug 2026
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* E. Passport Information */}
            <SectionCard title="E. Passport Information">
              {APPLICATION.passport.hasPassport ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">Has Passport</span>
                  </div>
                  <InfoRow label="Passport Number" value={APPLICATION.passport.number!} />
                  <InfoRow label="Issue Date" value={APPLICATION.passport.issueDate!} />
                  <InfoRow label="Expiry Date" value={APPLICATION.passport.expiryDate!} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Passport Assistance Requested</p>
                    <p className="text-xs text-slate-500 mt-0.5">Status: Processing</p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* G. Admission Actions */}
            <SectionCard title="G. Admission Actions">
              <div className="space-y-2.5">
                <button
                  onClick={() => setApproved(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    approved
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {approved ? "Application Approved ✓" : "Approve Application"}
                </button>

                <button
                  onClick={() => setShowDocPending(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Document Pending
                </button>

                <button
                  onClick={() => setShowComment(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Add Comment / Request Info
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
