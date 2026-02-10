import React from 'react';
import {
  FileText,
  BarChart3,
  PenTool,
  GraduationCap,
  UserCircle,
  RotateCcw,
  Hash,
  ScrollText,
  Send,
  CheckCircle2,
  Info,
  Search
} from 'lucide-react';

const FORMS = [
  { id: 'duplicate-grade-card', title: 'Application for Duplicate Grade Card', Icon: FileText, category: 'Academic', desc: 'Apply for loss or damage of grade cards.' },
  { id: 'cgpa-conversion', title: 'Application for CGPA to Percentage Conversion', Icon: BarChart3, category: 'Academic', desc: 'Convert CGPA to percentage marks.' },
  { id: 'supplementary-exam', title: 'Application for End-Semester Supplementary Examinations Registration', Icon: PenTool, category: 'Exam', desc: 'Register for backlog papers.' },
  { id: 'duplicate-degree', title: 'Application for Duplicate Degree Certificate', Icon: GraduationCap, category: 'Degree', desc: 'Replace lost degree certificates.' },
  { id: 'name-change', title: 'Application for Registration of Student Name change in the Institute Records', Icon: UserCircle, category: 'Records', desc: 'Update your official name.' },
  { id: 'repeat-paper', title: 'Application for repeating a paper for supplementary examinations(CIE and ESE) Registration', Icon: RotateCcw, category: 'Exam', desc: 'Repeat CIE and ESE papers.' },
  { id: 'retotaling', title: 'Application for Re-Totalling of Marks', Icon: Hash, category: 'Exam', desc: 'Verify your marks total.' },
  { id: 'on-request-degree', title: 'Application for On-Request Degree Certificate', Icon: ScrollText, category: 'Degree', desc: 'Early degree issuance.' },
  { id: 'migration', title: 'Application for Migration Certificate', Icon: Send, category: 'Transfer', desc: 'Transfer to another university.' },
];

export default function Portal({ onSelectForm, onTrackStatus }) {
  return (
    <div className="container animate-fade-in">
      <header style={{ textAlign: 'center', marginBottom: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo.png"
            alt="SSSIHL Logo"
            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
          />
        </div>
        <h1 className="title-gradient" style={{ fontSize: '3.8rem', marginBottom: '8px', lineHeight: '1.15' }}>
          Sri Sathya Sai Institute of Higher Learning
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500', marginBottom: '20px', fontStyle: 'italic' }}>
          (Deemed to be University)
        </p>
        <div style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: 'var(--accent-gradient)',
          borderRadius: '12px',
          marginBottom: '10px',
          boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.3)'
        }}>
          <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0, letterSpacing: '0.02em' }}>
            Examination Services Portal
          </p>
        </div>


        <button
          onClick={onTrackStatus}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            background: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = 'var(--accent)';
          }}
        >
          <Search size={18} /> Track Your Application Status
        </button>
      </header>

      <div className="glass-card" style={{ padding: '40px', marginBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-gradient)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
          <Info size={24} color="var(--accent)" />
          <h2 style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>Submission Guidelines</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
          {[
            'Select a service from the options below',
            'Prepare all required documents in PDF format',
            'Save your Application ID for future reference',
            'Notifications will be sent to your registered email'
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={18} color="var(--success)" style={{ marginTop: '4px', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
        {FORMS.map((form) => {
          const Icon = form.Icon;
          return (
            <div
              key={form.id}
              className="glass-card"
              style={{
                padding: '35px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: 'white',
                border: '1px solid var(--glass-border)'
              }}
              onClick={() => onSelectForm(form.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(15, 23, 42, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(37, 99, 235, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: 'var(--accent)'
              }}>
                <Icon size={32} />
              </div>
              <h3 style={{ fontSize: '1.45rem', marginBottom: '12px', color: 'var(--primary)' }}>{form.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, leading: '1.5' }}>{form.desc}</p>

              <div style={{
                marginTop: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid var(--glass-border)'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(15, 23, 42, 0.05)',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: '10px'
                }}>
                  {form.category}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '700', fontSize: '0.9rem' }}>
                  Apply Now <Send size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
}
