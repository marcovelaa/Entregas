'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, Pencil, Trash2, RotateCcw, Key } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from './page.module.css';
import { api } from '../../../lib/axios';

export default function UsuariosConfigPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Crear Usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    rolId: '',
    password: '',
    codigoReferido: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Editar Usuario
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombreCompleto: '',
    email: '',
    rolId: '',
    codigoReferido: ''
  });

  // Modal de Confirmación
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/roles')
      ]);
      setUsuarios(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const parts = formData.nombreCompleto.trim().split(' ');
      const nombres = parts[0] || '';
      const apellidos = parts.slice(1).join(' ') || '-';

      await api.post('/usuarios', {
        nombres,
        apellidos,
        email: formData.email,
        password: formData.password,
        rolId: formData.rolId,
        codigoReferido: formData.codigoReferido.trim() || undefined,
      });

      setIsModalOpen(false);
      setFormData({ nombreCompleto: '', email: '', rolId: '', password: '', codigoReferido: '' });
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al crear usuario";
      setCreateError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const openEditModal = (u: any) => {
    setEditingUserId(u.id);
    setEditFormData({
      nombreCompleto: `${u.nombres} ${u.apellidos === '-' ? '' : u.apellidos}`.trim(),
      email: u.email,
      rolId: u.rolId,
      codigoReferido: u.codigoReferido || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      const parts = editFormData.nombreCompleto.trim().split(' ');
      const nombres = parts[0] || '';
      const apellidos = parts.slice(1).join(' ') || '-';
      
      await api.patch(`/usuarios/${editingUserId}`, {
        nombres,
        apellidos,
        rolId: editFormData.rolId,
        codigoReferido: editFormData.codigoReferido.trim() || null,
      });
      
      setIsEditModalOpen(false);
      setEditingUserId(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al actualizar usuario");
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Desactivar Usuario',
      message: `¿Estás seguro de que deseas desactivar a ${nombre}?`,
      action: async () => {
        try {
          await api.delete(`/usuarios/${id}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchData();
        } catch (error: any) {
          alert("Error al desactivar usuario");
        }
      }
    });
  };

  const handleRestore = (id: string, nombre: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Habilitar Usuario',
      message: `¿Estás seguro de que deseas volver a habilitar a ${nombre}?`,
      action: async () => {
        try {
          await api.patch(`/usuarios/${id}`, { activo: true });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchData();
        } catch (error: any) {
          alert("Error al habilitar usuario");
        }
      }
    });
  };

  const openResetModal = (u: any) => {
    setResetUserId(u.id);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;
    try {
      await api.patch(`/usuarios/${resetUserId}`, { password: newPassword });
      setIsResetModalOpen(false);
      setResetUserId(null);
      setNewPassword('');
      alert("Contraseña restablecida correctamente.");
    } catch (error: any) {
      alert("Error al restablecer la contraseña");
    }
  };

  const getRoleName = (rolId: string) => {
    const rol = roles.find(r => r.id === rolId);
    return rol ? rol.nombre : 'Desconocido';
  };

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} strokeWidth={2.5} />
          Nuevo Usuario
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Listado de Usuarios</h2>
          <div className={styles.searchMini}>
            <input type="text" placeholder="Buscar usuario..." className={styles.inputMini} />
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
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Cód. Referido</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No hay usuarios registrados aún.
                    </td>
                  </tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatarDark}>
                            {u.nombres.charAt(0)}{u.apellidos !== '-' ? u.apellidos.charAt(0) : ''}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{u.nombres} {u.apellidos === '-' ? '' : u.apellidos}</span>
                            <span className={styles.userEmail}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.pill} ${styles.pillBlue}`}>
                          {getRoleName(u.rolId)}
                        </span>
                      </td>
                      <td className={styles.textMuted}>
                        {u.codigoReferido || '-'}
                      </td>
                      <td>
                        <span className={`${styles.pill} ${u.activo ? styles.pillGreen : styles.pillRed}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.textMuted}>
                        {new Date(u.creadoEn).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button 
                            className={styles.btnAction} 
                            onClick={() => openEditModal(u)}
                            title="Editar usuario"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            className={styles.btnAction} 
                            onClick={() => openResetModal(u)}
                            title="Restablecer contraseña"
                          >
                            <Key size={18} />
                          </button>
                          {u.activo ? (
                            <button 
                              className={`${styles.btnAction} ${styles.btnDelete}`} 
                              onClick={() => handleDelete(u.id, u.nombres)}
                              title="Desactivar usuario"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button 
                              className={`${styles.btnAction} ${styles.btnRestore}`} 
                              onClick={() => handleRestore(u.id, u.nombres)}
                              title="Habilitar usuario"
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
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ nombreCompleto: '', email: '', rolId: '', password: '', codigoReferido: '' });
          setCreateError(null);
        }}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleCreate}>
          {createError && <div className={styles.errorBanner}>{createError}</div>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre completo</label>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Ej. Juan Pérez" 
              required 
              value={formData.nombreCompleto}
              onChange={e => setFormData({...formData, nombreCompleto: e.target.value})}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo electrónico</label>
            <input 
              type="email" 
              className={styles.formInput} 
              placeholder="juan.perez@entregas.com.bo" 
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rol del usuario</label>
            <select 
              className={styles.formSelect} 
              required 
              value={formData.rolId}
              onChange={e => setFormData({...formData, rolId: e.target.value})}
            >
              <option value="" disabled>Seleccione un rol...</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña temporal</label>
            <input 
              type="password" 
              className={styles.formInput} 
              placeholder="••••••••" 
              required 
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código de referido (opcional)</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Ej. REF123"
              maxLength={50}
              value={formData.codigoReferido}
              onChange={e => setFormData({...formData, codigoReferido: e.target.value})}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => {
                setIsModalOpen(false);
                setFormData({ nombreCompleto: '', email: '', rolId: '', password: '', codigoReferido: '' });
                setCreateError(null);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>Guardar Usuario</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Usuario"
      >
        <form onSubmit={handleUpdate}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre completo</label>
            <input 
              type="text" 
              className={styles.formInput} 
              required 
              value={editFormData.nombreCompleto}
              onChange={e => setEditFormData({...editFormData, nombreCompleto: e.target.value})}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo electrónico</label>
            <input 
              type="email" 
              className={styles.formInput} 
              required 
              value={editFormData.email}
              onChange={e => setEditFormData({...editFormData, email: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rol del usuario</label>
            <select 
              className={styles.formSelect} 
              required 
              value={editFormData.rolId}
              onChange={e => setEditFormData({...editFormData, rolId: e.target.value})}
            >
              <option value="" disabled>Seleccione un rol...</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código de referido (opcional)</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Ej. REF123"
              maxLength={50}
              value={editFormData.codigoReferido}
              onChange={e => setEditFormData({...editFormData, codigoReferido: e.target.value})}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>Actualizar Usuario</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
        title={confirmModal.title}
        maxWidth="400px"
      >
        <div style={{ marginBottom: '1.5rem', color: 'var(--text-color)', lineHeight: '1.5' }}>
          {confirmModal.message}
        </div>
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.btnCancel} 
            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className={styles.btnPrimary}
            style={confirmModal.title.includes('Desactivar') ? { backgroundColor: 'var(--color-red, #ef4444)' } : {}}
            onClick={confirmModal.action}
          >
            Confirmar
          </button>
        </div>
      </Modal>

      {/* Modal Restablecer Contraseña */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
        title="Restablecer Contraseña"
        maxWidth="400px"
      >
        <form onSubmit={handleResetPassword}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nueva Contraseña</label>
            <input 
              type="password" 
              className={styles.formInput} 
              required 
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsResetModalOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>Guardar Contraseña</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
