'use client';

import React, { useState, useEffect } from 'react';
import { ShieldPlus, Loader2, Pencil, Trash2, RotateCcw, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../usuarios/page.module.css'; // Usamos los mismos estilos base
import { api } from '../../../lib/axios';

export default function RolesConfigPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Crear Rol
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  // Editar Rol
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRolId, setEditingRolId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  // Permisos
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [allPermisos, setAllPermisos] = useState<any[]>([]);
  const [selectedRolePermisos, setSelectedRolePermisos] = useState<string[]>([]);
  const [managingRol, setManagingRol] = useState<any>(null);
  const [savingPermisos, setSavingPermisos] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permisosRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permisos').catch(() => ({ data: [] }))
      ]);
      setRoles(rolesRes.data);
      if (permisosRes.data) setAllPermisos(permisosRes.data);
    } catch (error) {
      console.error('Error cargando roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/roles', formData);
      setIsModalOpen(false);
      setFormData({ nombre: '', descripcion: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear rol");
    }
  };

  const openEditModal = (r: any) => {
    setEditingRolId(r.id);
    setEditFormData({
      nombre: r.nombre,
      descripcion: r.descripcion || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRolId) return;

    try {
      await api.patch(`/roles/${editingRolId}`, editFormData);
      setIsEditModalOpen(false);
      setEditingRolId(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al actualizar rol");
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas desactivar el rol ${nombre}?`)) {
      try {
        await api.delete(`/roles/${id}`);
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.message || "Error al desactivar rol");
      }
    }
  };

  const handleRestore = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas volver a habilitar el rol ${nombre}?`)) {
      try {
        await api.patch(`/roles/${id}`, { activo: true });
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.message || "Error al habilitar rol");
      }
    }
  };

  const openPermisosModal = async (rol: any) => {
    setManagingRol(rol);
    try {
      const { data } = await api.get(`/roles/${rol.id}/permisos`);
      setSelectedRolePermisos(data);
    } catch (error) {
      console.error('Error cargando permisos del rol');
      setSelectedRolePermisos([]);
    }
    setIsPermisosModalOpen(true);
  };

  const togglePermiso = (codigo: string) => {
    setSelectedRolePermisos(prev => 
      prev.includes(codigo) ? prev.filter(p => p !== codigo) : [...prev, codigo]
    );
  };

  const handleSavePermisos = async () => {
    if (!managingRol) return;
    try {
      setSavingPermisos(true);
      await api.patch(`/roles/${managingRol.id}/permisos`, { permisos: selectedRolePermisos });
      setIsPermisosModalOpen(false);
      alert('Permisos actualizados correctamente');
    } catch (error: any) {
      alert('Error al guardar permisos');
    } finally {
      setSavingPermisos(false);
    }
  };

  // Agrupar permisos por módulo para la matriz
  const groupedPermisos = allPermisos.reduce((acc: any, p: any) => {
    const parts = p.codigo.split(':');
    const modulo = parts[1] || 'general';
    if (!acc[modulo]) acc[modulo] = [];
    acc[modulo].push(p);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          <ShieldPlus size={18} strokeWidth={2.5} />
          Nuevo Rol
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Listado de Roles</h2>
          <div className={styles.searchMini}>
            <input type="text" placeholder="Buscar rol..." className={styles.inputMini} />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className={styles.spin} size={32} color="var(--color-blue)" />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No hay roles registrados aún.
                    </td>
                  </tr>
                ) : (
                  roles.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span className={styles.userName}>{r.nombre}</span>
                      </td>
                      <td className={styles.textMuted}>
                        {r.descripcion || '-'}
                      </td>
                      <td>
                        <span className={`${styles.pill} ${r.activo ? styles.pillGreen : styles.pillRed}`}>
                          {r.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.textMuted}>
                        {new Date(r.creadoEn).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button 
                            className={styles.btnAction} 
                            onClick={() => openPermisosModal(r)}
                            title="Gestionar permisos"
                          >
                            <ShieldCheck size={18} />
                          </button>
                          <button 
                            className={styles.btnAction} 
                            onClick={() => openEditModal(r)}
                            title="Editar rol"
                          >
                            <Pencil size={18} />
                          </button>
                          {r.activo ? (
                            <button 
                              className={`${styles.btnAction} ${styles.btnDelete}`} 
                              onClick={() => handleDelete(r.id, r.nombre)}
                              title="Desactivar rol"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button 
                              className={`${styles.btnAction} ${styles.btnRestore}`} 
                              onClick={() => handleRestore(r.id, r.nombre)}
                              title="Habilitar rol"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Modal Crear */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Rol"
      >
        <form onSubmit={handleCreate}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre del Rol</label>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Ej. Administrador" 
              required 
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Acceso total al sistema" 
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>Guardar Rol</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Rol"
      >
        <form onSubmit={handleUpdate}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre del Rol</label>
            <input 
              type="text" 
              className={styles.formInput} 
              required 
              value={editFormData.nombre}
              onChange={e => setEditFormData({...editFormData, nombre: e.target.value})}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={editFormData.descripcion}
              onChange={e => setEditFormData({...editFormData, descripcion: e.target.value})}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>Actualizar Rol</button>
          </div>
        </form>
      </Modal>

      {/* Modal Matriz de Permisos */}
      <Modal 
        isOpen={isPermisosModalOpen} 
        onClose={() => setIsPermisosModalOpen(false)} 
        title={`Permisos: ${managingRol?.nombre}`}
      >
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <p className={styles.textMuted} style={{ marginBottom: '1.5rem' }}>
            Selecciona los permisos que este rol tendrá dentro del sistema.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(groupedPermisos).map(([modulo, permisosArray]: [string, any]) => (
              <div key={modulo} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1rem', backgroundColor: 'var(--bg-subtle)' }}>
                <h4 style={{ textTransform: 'capitalize', marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Módulo: {modulo}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {permisosArray.map((p: any) => {
                    const accion = p.codigo.split(':')[2] || p.codigo;
                    return (
                      <label key={p.codigo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedRolePermisos.includes(p.codigo)}
                          onChange={() => togglePermiso(p.codigo)}
                          style={{ accentColor: 'var(--text-main)', width: '16px', height: '16px' }}
                        />
                        <span title={p.descripcion} style={{ textTransform: 'capitalize' }}>
                          {accion.replace('_', ' ')}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsPermisosModalOpen(false)}>Cancelar</button>
            <button type="button" className={styles.btnPrimary} onClick={handleSavePermisos} disabled={savingPermisos}>
              {savingPermisos ? 'Guardando...' : 'Guardar Permisos'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
