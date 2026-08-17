import React from 'react';

export interface VentaDetalleData {
  cantidad: number;
  precio_unitario: string | number;
  precio_unitario_catalogo?: string | number;
  subtotal: string | number;
  producto?: { nombre: string };
  producto_id?: string;
}

export interface VentaData {
  id: string | number;
  creado_en: string | Date;
  nombre_cajero?: string;
  usuario_id?: string;
  metodo_pago?: string;
  cliente?: { nombres: string; apellidos?: string | null; documento_identidad?: string | null };
  detalles: VentaDetalleData[];
  descuento_total: string | number;
  total: string | number;
}

export interface ConfigNegocioData {
  nombre: string;
  direccion: string;
  telefono: string;
  nit: string;
}

interface TicketImpresionProps {
  ticketData: VentaData;
  configNegocio: ConfigNegocioData;
  onClose: () => void;
}

export const TicketImpresion: React.FC<TicketImpresionProps> = ({ ticketData, configNegocio, onClose }) => {
  const handlePrint = () => {
    const content = document.getElementById('printable-ticket')?.innerHTML;
    if (content) {
      const ticketHTML = `
        <html>
          <head>
            <title>Imprimir Comprobante</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              body { font-family: "Courier New", Courier, monospace; margin: 0; padding: 10px; color: #000; width: 300px; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(ticketHTML);
        doc.close();
      }

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div id="printable-ticket" style={{
        width: '100%', maxWidth: '300px', backgroundColor: '#fff', padding: '1rem',
        fontFamily: '"Courier New", Courier, monospace', color: '#000', border: '1px solid #e2e8f0',
        borderRadius: '4px', margin: '0 auto', lineHeight: '1.2'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '-1px', textTransform: 'uppercase' }}>
            {configNegocio.nombre}
          </h2>
          <p style={{ margin: '0.2rem 0', fontSize: '0.8rem' }}>{configNegocio.direccion}</p>
          <p style={{ margin: '0.2rem 0', fontSize: '0.8rem' }}>Tel: {configNegocio.telefono} | NIT: {configNegocio.nit}</p>
          <p style={{ margin: '10px 0 5px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>NOTA DE VENTA</p>
          <p style={{ margin: '0', fontSize: '0.75rem' }}>Nro: {String(ticketData.id).padStart(7, '0')}</p>
        </div>
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fecha:</span> <span>{new Date(ticketData.creado_en).toLocaleString('es-BO')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cajero:</span> <span>{ticketData.nombre_cajero || ticketData.usuario_id || 'Sistema'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Método:</span> <span>{ticketData.metodo_pago || 'EFECTIVO'}</span></div>
        </div>
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Señor(es):</span> <span>{ticketData.cliente ? `${ticketData.cliente.nombres} ${ticketData.cliente.apellidos || ''}` : 'Consumidor Final'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NIT/CI:</span> <span>{ticketData.cliente?.documento_identidad || '0'}</span></div>
        </div>
        <table style={{ width: '100%', fontSize: '0.75rem', marginBottom: '0.5rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000' }}>
              <th style={{ textAlign: 'left', paddingBottom: '0.3rem', width: '60%' }}>CANT / DESCRIPCIÓN</th>
              <th style={{ textAlign: 'right', paddingBottom: '0.3rem', width: '40%' }}>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {ticketData.detalles?.map((d: VentaDetalleData, idx: number) => {
              const precioCat = d.precio_unitario_catalogo ? Number(d.precio_unitario_catalogo) : Number(d.precio_unitario);
              const tieneRebaja = precioCat > Number(d.precio_unitario) + 0.0001;
              return (
                <tr key={idx}>
                  <td style={{ verticalAlign: 'top', paddingTop: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{d.producto?.nombre || `Prod ID: ${d.producto_id}`}</div>
                    <div style={{ color: '#475569', fontSize: '0.7rem' }}>
                      {d.cantidad} x Bs. {parseFloat(d.precio_unitario as string).toFixed(2)}
                      {tieneRebaja && (
                        <span style={{ marginLeft: '4px', textDecoration: 'line-through', color: '#94a3b8' }}>
                          (Bs. {parseFloat(precioCat as any).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    Bs. {parseFloat(d.subtotal as string).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
          {Number(ticketData.descuento_total) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              <span>DESC.:</span>
              <span>- Bs. {parseFloat(ticketData.descuento_total as string).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>
            <span>TOTAL:</span>
            <span>Bs. {parseFloat(ticketData.total as string).toFixed(2)}</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1.2rem', marginBottom: '0.5rem' }}>
          <p style={{ margin: '4px 0 2px 0', fontWeight: 'bold' }}>¡Gracias por su preferencia!</p>
          <p style={{ margin: '2px 0', color: '#475569' }}>Vuelva pronto</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
        <button 
          onClick={onClose}
          style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          Cerrar
        </button>
        <button 
          onClick={handlePrint}
          style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          Imprimir Boleta
        </button>
      </div>
    </div>
  );
};
