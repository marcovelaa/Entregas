'use client';
import React from 'react';
import styles from '../productos.module.css';

interface Props {
  productPayload: any;
  setProductPayload: (p: any) => void;
  categorias: any[];
  selectedNaturaleza: string;
}

export default function AtributosSection({ productPayload, setProductPayload, categorias, selectedNaturaleza }: Props) {
  const { atributos = {} } = productPayload;

  const updateAttr = (key: string, value: any) => {
    setProductPayload({ ...productPayload, atributos: { ...atributos, [key]: value } });
  };

  // Textos Escolares has a specialized form
  if (selectedNaturaleza === 'Textos Escolares') {
    return (
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-nivel">Nivel Escolar</label>
          <select
            id="atributo-nivel"
            className={styles.formSelect}
            value={atributos.nivel || ''}
            onChange={e => {
              setProductPayload({
                ...productPayload,
                atributos: { ...atributos, nivel: e.target.value, subnivel: '' }
              });
            }}
          >
            <option value="">Sin nivel (Plan Lector)</option>
            <option value="Inicial">Inicial</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
        </div>

        {atributos.nivel === 'Inicial' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="atributo-subnivel">Sub-Nivel</label>
            <select id="atributo-subnivel" className={styles.formSelect} value={atributos.subnivel || ''} onChange={e => updateAttr('subnivel', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Pollito">Pollito</option>
              <option value="Nidito">Nidito</option>
              <option value="Prekinder">Prekinder</option>
              <option value="Kinder">Kinder</option>
            </select>
          </div>
        )}

        {(atributos.nivel === 'Primaria' || atributos.nivel === 'Secundaria') && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="atributo-subnivel">Grado</label>
            <select id="atributo-subnivel" className={styles.formSelect} value={atributos.subnivel || ''} onChange={e => updateAttr('subnivel', e.target.value)}>
              <option value="">Seleccionar...</option>
              {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-serie">Serie / Proyecto</label>
          <input id="atributo-serie" className={styles.formInput} placeholder="Ej. Bicentenario" value={atributos.serie || ''} onChange={e => updateAttr('serie', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-materia">Materia</label>
          <input id="atributo-materia" className={styles.formInput} placeholder="Ej. Matemáticas" value={atributos.materia || ''} onChange={e => updateAttr('materia', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-autor">Autor(es)</label>
          <input id="atributo-autor" className={styles.formInput} placeholder="Ej. García Márquez" value={atributos.autor || ''} onChange={e => updateAttr('autor', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-isbn">ISBN</label>
          <input id="atributo-isbn" className={styles.formInput} placeholder="ISBN del libro" value={atributos.isbn || ''} onChange={e => updateAttr('isbn', e.target.value)} />
        </div>
        <div className={`${styles.formGroup} ${styles.formGridFull}`}>
          <label className={styles.checkboxRow} htmlFor="atributo-plan-lector">
            <input id="atributo-plan-lector" type="checkbox" checked={atributos.es_plan_lector || false} onChange={e => updateAttr('es_plan_lector', e.target.checked)} />
            <strong>Pertenece a Plan Lector</strong>
          </label>
        </div>
      </div>
    );
  }

  // Cuadernos specialized form
  if (selectedNaturaleza === 'Cuadernos') {
    return (
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-tamano">Tamaño</label>
          <select id="atributo-tamano" className={styles.formSelect} value={atributos.tamano || ''} onChange={e => updateAttr('tamano', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Oficio">Oficio</option>
            <option value="Carta">Carta</option>
            <option value="Medio Oficio">Medio Oficio</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-tipo-tapa">Tipo de Tapa</label>
          <select id="atributo-tipo-tapa" className={styles.formSelect} value={atributos.tipo_tapa || ''} onChange={e => updateAttr('tipo_tapa', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Dura">Dura</option>
            <option value="Blanda">Blanda</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-cantidad-hojas">Cantidad de Hojas</label>
          <input id="atributo-cantidad-hojas" type="number" className={styles.formInput} placeholder="Ej. 100" value={atributos.cantidad_hojas || ''} onChange={e => updateAttr('cantidad_hojas', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-tipo-hojas">Tipo de Hojas</label>
          <select id="atributo-tipo-hojas" className={styles.formSelect} value={atributos.tipo_hojas || ''} onChange={e => updateAttr('tipo_hojas', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Cuadriculado">Cuadriculado</option>
            <option value="Rayado">Rayado</option>
            <option value="Liso">Liso</option>
            <option value="Punteado">Punteado</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-tipo-anillado">Tipo de Anillado</label>
          <select id="atributo-tipo-anillado" className={styles.formSelect} value={atributos.tipo_anillado || ''} onChange={e => updateAttr('tipo_anillado', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Espiral">Espiral</option>
            <option value="Cosido">Cosido</option>
            <option value="Grapado">Grapado</option>
          </select>
        </div>
      </div>
    );
  }

  // Material Escolar specialized form (Escritura, Lápices, Pegamentos, etc.)
  if (selectedNaturaleza === 'Material Escolar') {
    const isEscritura = atributos.tipo_articulo === 'Escritura (Bolígrafos, Marcadores)';
    const isLapices = atributos.tipo_articulo === 'Lápices y Colores';
    const isAdhesivos = atributos.tipo_articulo === 'Adhesivos y Pegamentos';
    const isGeometria = atributos.tipo_articulo === 'Geometría y Medición';

    return (
      <div className={styles.formGrid}>
        <div className={`${styles.formGroup} ${styles.formGridFull}`}>
          <label className={styles.formLabel} htmlFor="atributo-tipo-articulo">Tipo de Artículo *</label>
          <select id="atributo-tipo-articulo" className={styles.formSelect} value={atributos.tipo_articulo || ''} onChange={e => {
            // Reset other attributes when switching type to keep data clean
            setProductPayload({
              ...productPayload,
              atributos: { tipo_articulo: e.target.value }
            });
          }}>
            <option value="">Seleccionar Tipo de Artículo...</option>
            <option value="Escritura (Bolígrafos, Marcadores)">Escritura (Bolígrafos, Marcadores)</option>
            <option value="Lápices y Colores">Lápices y Colores</option>
            <option value="Adhesivos y Pegamentos">Adhesivos y Pegamentos</option>
            <option value="Geometría y Medición">Geometría y Medición</option>
            <option value="Otro">Otro Material Escolar</option>
          </select>
        </div>

        {isEscritura && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-tamano-punta">Punta / Trazo</label>
              <select id="atributo-tamano-punta" className={styles.formSelect} value={atributos.tamano_punta || ''} onChange={e => updateAttr('tamano_punta', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="1.0 mm (Medium)">1.0 mm (Medium)</option>
                <option value="0.7 mm (Fina)">0.7 mm (Fina)</option>
                <option value="0.5 mm (Ultra Fina)">0.5 mm (Ultra Fina)</option>
                <option value="1.2 mm (Gruesa)">1.2 mm (Gruesa)</option>
                <option value="Punta Cónica">Punta Cónica</option>
                <option value="Biselada / Chisel">Biselada / Chisel</option>
                <option value="Punta Pincel">Punta Pincel</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-tipo-tinta">Composición de Tinta</label>
              <select id="atributo-tipo-tinta" className={styles.formSelect} value={atributos.tipo_tinta || ''} onChange={e => updateAttr('tipo_tinta', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="A base de Aceite">A base de Aceite</option>
                <option value="Tinta Gel Líquida">Tinta Gel Líquida</option>
                <option value="Tinta al Agua">Tinta al Agua</option>
                <option value="Permanente / Indeleble">Permanente / Indeleble</option>
                <option value="Borrable">Borrable</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-color-tinta">Color de Tinta</label>
              <input id="atributo-color-tinta" className={styles.formInput} placeholder="Ej. Azul, Rojo, Negro, Surtido" value={atributos.color || ''} onChange={e => updateAttr('color', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-escritura-forma-cuerpo">Forma del Cuerpo</label>
              <select id="atributo-escritura-forma-cuerpo" className={styles.formSelect} value={atributos.forma_cuerpo || ''} onChange={e => updateAttr('forma_cuerpo', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Circular">Circular</option>
                <option value="Hexagonal">Hexagonal</option>
                <option value="Triangular (Ergonómico)">Triangular (Ergonómico)</option>
                <option value="Grip de Goma">Grip de Goma</option>
              </select>
            </div>
          </>
        )}

        {isLapices && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-graduacion">Graduación / Dureza (Lápiz negro)</label>
              <select id="atributo-graduacion" className={styles.formSelect} value={atributos.graduacion || ''} onChange={e => updateAttr('graduacion', e.target.value)}>
                <option value="">No aplica / Seleccionar...</option>
                <option value="HB / N° 2">HB / N° 2</option>
                <option value="2B">2B</option>
                <option value="4B">4B</option>
                <option value="6B">6B</option>
                <option value="H">H</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-cantidad-colores">Cantidad de Colores (Set)</label>
              <select id="atributo-cantidad-colores" className={styles.formSelect} value={atributos.cantidad_colores || ''} onChange={e => updateAttr('cantidad_colores', e.target.value)}>
                <option value="">No aplica / Individual...</option>
                <option value="Set x12">Set x12</option>
                <option value="Set x24">Set x24</option>
                <option value="Set x36">Set x36</option>
                <option value="Set x48+">Set x48+</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-lapices-forma-cuerpo">Forma del Cuerpo</label>
              <select id="atributo-lapices-forma-cuerpo" className={styles.formSelect} value={atributos.forma_cuerpo || ''} onChange={e => updateAttr('forma_cuerpo', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Circular">Circular</option>
                <option value="Hexagonal">Hexagonal</option>
                <option value="Triangular (Ergonómico)">Triangular (Ergonómico)</option>
              </select>
            </div>
          </>
        )}

        {isAdhesivos && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-tipo-adhesivo">Tipo de Adhesivo</label>
              <select id="atributo-tipo-adhesivo" className={styles.formSelect} value={atributos.tipo_adhesivo || ''} onChange={e => updateAttr('tipo_adhesivo', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Pegamento en Barra">Pegamento en Barra</option>
                <option value="Pegamento Líquido (Isocola/Carpintero)">Pegamento Líquido (Isocola/Carpintero)</option>
                <option value="Silicona Líquida">Silicona Líquida</option>
                <option value="Silicona en Barra (Caliente)">Silicona en Barra (Caliente)</option>
                <option value="Cinta Adhesiva">Cinta Adhesiva</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-adhesivos-medida">Contenido / Medida</label>
              <input id="atributo-adhesivos-medida" className={styles.formInput} placeholder="Ej. 40g, 100ml, 12mm x 10m" value={atributos.medida || ''} onChange={e => updateAttr('medida', e.target.value)} />
            </div>
          </>
        )}

        {isGeometria && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-instrumento">Instrumento</label>
              <select id="atributo-instrumento" className={styles.formSelect} value={atributos.instrumento || ''} onChange={e => updateAttr('instrumento', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Regla Recta">Regla Recta</option>
                <option value="Escuadra">Escuadra</option>
                <option value="Transportador">Transportador</option>
                <option value="Compás">Compás</option>
                <option value="Estuche Geométrico">Estuche Geométrico</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-geometria-medida">Tamaño / Longitud</label>
              <input id="atributo-geometria-medida" className={styles.formInput} placeholder="Ej. 20cm, 30cm" value={atributos.medida || ''} onChange={e => updateAttr('medida', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-material">Material</label>
              <select id="atributo-material" className={styles.formSelect} value={atributos.material || ''} onChange={e => updateAttr('material', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Plástico Flexible">Plástico Flexible</option>
                <option value="Acrílico Rígido">Acrílico Rígido</option>
                <option value="Metal">Metal</option>
                <option value="Madera">Madera</option>
              </select>
            </div>
          </>
        )}

        {atributos.tipo_articulo && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-caracteristicas">Características Extra</label>
              <input id="atributo-caracteristicas" className={styles.formInput} placeholder="Ej. No tóxico, Lavable, Retráctil" value={atributos.caracteristicas || ''} onChange={e => updateAttr('caracteristicas', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="atributo-material-presentacion">Presentación Base</label>
              <select id="atributo-material-presentacion" className={styles.formSelect} value={atributos.presentacion || ''} onChange={e => updateAttr('presentacion', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="Individual">Individual</option>
                <option value="Caja x12">Caja x12</option>
                <option value="Caja x50">Caja x50</option>
                <option value="Blister">Blister</option>
                <option value="Set">Set/Estuche</option>
              </select>
            </div>
          </>
        )}
      </div>
    );
  }

  // Papelería specialized form
  if (selectedNaturaleza === 'Papelería' || selectedNaturaleza === 'Papeles') {
    return (
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-tipo-papel">Tipo de Papel / Material *</label>
          <select id="atributo-tipo-papel" className={styles.formSelect} value={atributos.tipo_papel || ''} onChange={e => updateAttr('tipo_papel', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Papel Bond">Papel Bond</option>
            <option value="Cartulina">Cartulina</option>
            <option value="Papel Fotográfico">Papel Fotográfico</option>
            <option value="Papel Crepé">Papel Crepé</option>
            <option value="Papel Seda">Papel Seda</option>
            <option value="Papel Kraft">Papel Kraft</option>
            <option value="Papel Afiche">Papel Afiche</option>
            <option value="Goma Eva / Foami">Goma Eva / Foami</option>
            <option value="Papel Lustre">Papel Lustre</option>
            <option value="Papel Celofán">Papel Celofán</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-papeleria-tamano">Tamaño / Formato</label>
          <select id="atributo-papeleria-tamano" className={styles.formSelect} value={atributos.tamano || ''} onChange={e => updateAttr('tamano', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="A4">A4 (21 x 29.7 cm)</option>
            <option value="Oficio">Oficio (21.6 x 33 cm)</option>
            <option value="Carta">Carta (21.6 x 27.9 cm)</option>
            <option value="Pliego Entero">Pliego Entero</option>
            <option value="Medio Pliego">Medio Pliego</option>
            <option value="A3">A3 (29.7 x 42 cm)</option>
            <option value="Rollo">Rollo</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-gramaje">Gramaje (Grosor)</label>
          <select id="atributo-gramaje" className={styles.formSelect} value={atributos.gramaje || ''} onChange={e => updateAttr('gramaje', e.target.value)}>
            <option value="">No aplica / Seleccionar...</option>
            <option value="75g">75g</option>
            <option value="80g">80g</option>
            <option value="90g">90g</option>
            <option value="120g">120g</option>
            <option value="150g">150g</option>
            <option value="180g">180g</option>
            <option value="200g+">200g o más</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-color-diseno">Color / Diseño</label>
          <input id="atributo-color-diseno" className={styles.formInput} placeholder="Ej. Blanco, Colores Pastel, Estampado" value={atributos.color || ''} onChange={e => updateAttr('color', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="atributo-papeleria-presentacion">Presentación (Empaque)</label>
          <select id="atributo-papeleria-presentacion" className={styles.formSelect} value={atributos.presentacion || ''} onChange={e => updateAttr('presentacion', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Resma x500">Resma x500 hojas</option>
            <option value="Paquete x100">Paquete x100 hojas</option>
            <option value="Paquete x50">Paquete x50 hojas</option>
            <option value="Unidad (Pliego/Lámina)">Unidad (Pliego / Lámina)</option>
            <option value="Rollo">Rollo</option>
          </select>
        </div>
      </div>
    );
  }

  // Dynamic form based on category template
  const matchedCat = categorias.find((c: any) => c.nombre.toLowerCase() === selectedNaturaleza.toLowerCase());
  const template = matchedCat?.plantilla_atributos || [];

  if (template.length === 0) {
    return (
      <div className={styles.infoMessage}>
        <span>Esta categoría no tiene atributos específicos configurados.</span>
      </div>
    );
  }

  return (
    <div className={styles.formGrid}>
      {template.map((field: any) => {
        const fieldId = `atributo-dinamico-${field.name}`;
        return (
          <div key={field.name} className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</label>
            {field.type === 'select' ? (
              <select
                id={fieldId}
                className={styles.formSelect}
                value={atributos[field.name] || ''}
                onChange={e => updateAttr(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Seleccionar...</option>
                {(field.options || []).map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={fieldId}
                className={styles.formInput}
                placeholder={field.label}
                value={atributos[field.name] || ''}
                onChange={e => updateAttr(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
