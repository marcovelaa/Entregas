'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ComboEditorForm } from '../components/ComboEditorForm';

export default function EditarComboPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <ComboEditorForm initialId={id} isEditing={true} />;
}
