import React from 'react';
import styles from './page.module.css';
import { Accordion } from '@/components/molecules/Accordion/Accordion';

export const metadata = {
  title: 'Preguntas Frecuentes | Entregas',
  description: 'Encuentra respuestas a las preguntas más frecuentes sobre envíos, pagos y devoluciones.',
};

const FAQ_ITEMS = [
  {
    question: '¿Cuáles son los métodos de pago aceptados?',
    answer: 'Nuestros pagos se realizan de forma rápida y segura mediante transferencia por código QR.'
  },
  {
    question: '¿Hacen envíos a todo el país?',
    answer: 'Sí, realizamos envíos a nivel nacional. Llegamos a todos los departamentos del país.'
  },
  {
    question: '¿Puedo devolver un producto si no estoy satisfecho?',
    answer: '¡Por supuesto! Tienes hasta 7 días calendario desde la recepción de tu pedido para solicitar una devolución. El producto debe estar en su empaque original y sin uso. Contáctanos por nuestro canal de atención al cliente para iniciar el proceso.'
  },
  {
    question: '¿Cómo hago el seguimiento de mi pedido?',
    answer: 'El seguimiento de tu pedido es súper personalizado: se realiza directamente mediante WhatsApp en contacto con el encargado de ventas asignado a tu compra.'
  },
  {
    question: '¿Los libros son originales?',
    answer: 'Sí, garantizamos que todo nuestro material bibliográfico y útiles escolares son 100% originales, adquiridos directamente de las editoriales y marcas autorizadas.'
  }
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Preguntas Frecuentes</h1>
          <p>Resolvemos tus dudas principales para que compres con total confianza.</p>
        </div>
        
        <div className={styles.accordionSection}>
          <Accordion items={FAQ_ITEMS} />
        </div>

        <div className={styles.contactSupport}>
          <p>¿No encontraste lo que buscabas?</p>
          <button className={styles.contactBtn}>Contáctanos por WhatsApp</button>
        </div>
      </main>
    </div>
  );
}
