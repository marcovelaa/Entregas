import React from 'react';

interface Level {
  id: string;
  name: string;
  colorClass: string;
  href: string | null;
}

interface Grade {
  id: string;
  name: string;
  subjects: { id: string; name: string }[];
}

interface CatalogSidebarProps {
  levels: Level[];
  catalogData: Record<string, Grade[]>;
  activeLevel: string;
  setActiveLevel: (id: string) => void;
  activeGrade: string;
  setActiveGrade: (id: string) => void;
  setActiveSubject: (id: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  styles: Record<string, string>;
}

export function CatalogSidebar({
  levels,
  catalogData,
  activeLevel,
  setActiveLevel,
  activeGrade,
  setActiveGrade,
  setActiveSubject,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  styles
}: CatalogSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOverlayOpen : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Accordion */}
      <div className={styles.sidebarWrapper}>
        <aside className={`${styles.sidebarSticky} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeaderMobile}>
            <h3>Filtrar Catálogo</h3>
            <button className={styles.closeSidebarBtn} onClick={() => setIsMobileMenuOpen(false)}>×</button>
          </div>
          
          <h3 className={styles.sidebarTitle}>Catálogo</h3>
          
          <div className={styles.sidebarSection}>
            <h4 className={styles.sidebarSubtitle}>Nivel educativo</h4>
            <nav className={styles.categoryNav}>
              {levels.map(lvl => {
                const isLevelExpanded = activeLevel === lvl.id;
                
                return (
                  <div key={lvl.id} className={styles.levelGroup}>
                    <button 
                      className={`${styles.levelBtn} ${isLevelExpanded ? styles.levelExpanded : ''}`}
                      onClick={() => {
                        if (activeLevel === lvl.id) {
                          setActiveLevel('');
                          setActiveGrade('');
                          setActiveSubject('all');
                        } else {
                          setActiveLevel(lvl.id);
                          setActiveGrade('');
                          setActiveSubject('all');
                        }
                      }}
                    >
                      <div className={styles.levelNameWrapper}>
                        <span className={`${styles.levelDot} ${isLevelExpanded ? styles.levelDotActive : ''}`}></span>
                        <span className={styles.levelName}>{lvl.name}</span>
                      </div>
                      <svg className={`${styles.chevron} ${isLevelExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    
                    <div className={`${styles.gradesWrapper} ${isLevelExpanded ? styles.gradesOpen : ''}`}>
                      <div className={styles.gradesInner}>
                        {catalogData[lvl.id]?.map(grade => {
                          const isGradeExpanded = activeGrade === grade.id;
                          return (
                            <label key={grade.id} className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                className={styles.checkboxInput}
                                checked={isGradeExpanded}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setActiveGrade(grade.id);
                                    setActiveSubject('all');
                                  } else {
                                    setActiveGrade('');
                                  }
                                }}
                              />
                              <span className={styles.checkboxText}>{grade.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
}
