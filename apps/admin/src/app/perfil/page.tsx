'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, Eye, EyeOff, Shield, Mail, Phone, Hash } from 'lucide-react';
import styles from './page.module.css';
import { api } from '../../lib/axios';
import { getUser, SessionUser } from '../../lib/auth-session';

export default function PerfilPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await api.patch('/usuarios/me/password', {
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Configuración de la Cuenta</h1>
        <p className={styles.pageSubtitle}>Administra tu información personal y la seguridad de tu cuenta.</p>
      </header>

      <div className={styles.contentGrid}>
        {user && (
          <div className={styles.section}>
            <div className={styles.sectionSidebar}>
              <h3 className={styles.sectionTitle}>Perfil Personal</h3>
              <p className={styles.sectionDescription}>Esta información es utilizada para identificarte dentro del sistema y los reportes.</p>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.card}>
                <div className={styles.profileAvatarGroup}>
                  <div className={styles.avatarCircle}>
                    {user.nombres.charAt(0)}
                    {user.apellidos !== '-' ? user.apellidos.charAt(0) : ''}
                  </div>
                  <div className={styles.avatarInfo}>
                    <h4>{user.nombres} {user.apellidos !== '-' ? user.apellidos : ''}</h4>
                    <span className={styles.badge}>{user.rol || 'Administrador'}</span>
                  </div>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.dataRow}>
                  <label>Correo electrónico</label>
                  <p>{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionSidebar}>
            <h3 className={styles.sectionTitle}>Seguridad</h3>
            <p className={styles.sectionDescription}>Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
          </div>
          
          <div className={styles.sectionContent}>
            <div className={styles.card}>
              {error && <div className={styles.errorBanner}>{error}</div>}
              {success && <div className={styles.successBanner}>¡Contraseña actualizada correctamente!</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña Actual</label>
            <div className={styles.passwordInputWrapper}>
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                className={styles.formInput} 
                required 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
              />
              <button 
                type="button" 
                className={styles.eyeButton} 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nueva Contraseña</label>
            <div className={styles.passwordInputWrapper}>
              <input 
                type={showNewPassword ? "text" : "password"} 
                className={styles.formInput} 
                required 
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button 
                type="button" 
                className={styles.eyeButton} 
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirmar Nueva Contraseña</label>
            <div className={styles.passwordInputWrapper}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className={styles.formInput} 
                required 
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
              />
              <button 
                type="button" 
                className={styles.eyeButton} 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

                <div className={styles.formFooter}>
                  <button type="submit" className={styles.btnPrimary} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
