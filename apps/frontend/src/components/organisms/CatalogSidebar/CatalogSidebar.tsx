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
  styles: any;
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
                    <span className={styles.levelName}>{lvl.name}</span>
                    <svg className={`${styles.chevron} ${isLevelExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  <div className={`${styles.gradesWrapper} ${isLevelExpanded ? styles.gradesOpen : ''}`}>
                    <div className={styles.gradesInner}>
                      {catalogData[lvl.id].map(grade => {
                        const isGradeExpanded = activeGrade === grade.id;
                        return (
                          <div key={grade.id} className={styles.gradeGroup}>
                            <button
                              className={`${styles.categoryBtn} ${isGradeExpanded ? styles.categoryExpanded : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveGrade(grade.id);
                                setActiveSubject('all');
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <span className={styles.categoryName}>{grade.name}</span>
                              <svg className={`${styles.chevron} ${isGradeExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
