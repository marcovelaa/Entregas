'use client';
import React, { useState } from 'react';
import styles from './Accordion.module.css';

interface AccordionItem {
  question: string;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.accordionContainer}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={`${styles.accordionItem} ${isOpen ? styles.open : ''}`}
          >
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleItem(index)}
              aria-expanded={isOpen}
            >
              <h3>{item.question}</h3>
              <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
            </button>
            <div 
              className={styles.accordionContent}
              style={{ maxHeight: isOpen ? '500px' : '0' }}
            >
              <div className={styles.innerContent}>
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
