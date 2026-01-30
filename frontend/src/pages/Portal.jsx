import React from 'react';

const FORMS = [
  { id: 'duplicate-grade-card', title: 'Duplicate Grade Card', icon: '📄', category: 'Academic', desc: 'Apply for loss or damage of grade cards.' },
  { id: 'cgpa-conversion', title: 'CGPA Conversion', icon: '📊', category: 'Academic', desc: 'Convert CGPA to percentage marks.' },
  { id: 'supplementary-exam', title: 'Supplementary Exam', icon: '📝', category: 'Exam', desc: 'Register for backlog papers.' },
  { id: 'duplicate-degree', title: 'Duplicate Degree', icon: '🎓', category: 'Degree', desc: 'Replace lost degree certificates.' },
  { id: 'name-change', title: 'Name Change', icon: '👤', category: 'Records', desc: 'Update your official name.' },
  { id: 'repeat-paper', title: 'Repeat Paper', icon: '🔄', category: 'Exam', desc: 'Repeat CIE and ESE papers.' },
  { id: 'retotaling', title: 'Re-totaling', icon: '🔢', category: 'Exam', desc: 'Verify your marks total.' },
  { id: 'on-request-degree', title: 'On-Request Degree', icon: '📜', category: 'Degree', desc: 'Early degree issuance.' },
  { id: 'migration', title: 'Migration Certificate', icon: '🚀', category: 'Transfer', desc: 'Transfer to another university.' },
];

export default function Portal({ onSelectForm }) {
  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="title-gradient" style={{ fontSize: '3.5rem', marginBottom: '10px' }}>
          Student Services Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Sri Sathya Sai Institute of Higher Learning
        </p>
      </header>

      <div className="glass-card" style={{ padding: '40px', marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: '#60a5fa' }}>📋 Official Instructions</h2>
        <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <li>✨ Select a service from the grid below</li>
          <li>✨ Prepare required PDF documents</li>
          <li>✨ Keep your Application ID for tracking</li>
          <li>✨ Monitor your email for status updates</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {FORMS.map((form) => (
          <div
            key={form.id}
            className="glass-card"
            style={{
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => onSelectForm(form.id)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '3rem', marginBottom: '15px' }}>{form.icon}</span>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>{form.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1 }}>{form.desc}</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', padding: '4px 10px', borderRadius: '20px' }}>
                {form.category}
              </span>
              <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>Apply →</span>
            </div>
          </div>
        ))}
      </div>
    </div >
  );
}
