import React from 'react';

export default function GeneralConfigPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Perfil de Empresa</h2>
      <p style={{ color: 'var(--text-muted)' }}>Configuraciones globales como el nombre de la librería, NIT y logo irán aquí.</p>
    </div>
  );
}
