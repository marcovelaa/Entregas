import { diffCatalogoPermisos } from './reconcile-permisos';

describe('diffCatalogoPermisos', () => {
  it('detecta códigos nuevos para agregar', () => {
    const resultado = diffCatalogoPermisos(['a:ver'], ['a:ver', 'a:crear']);
    expect(resultado.aAgregar).toEqual(['a:crear']);
    expect(resultado.aQuitar).toEqual([]);
  });

  it('detecta códigos retirados para quitar', () => {
    const resultado = diffCatalogoPermisos(['a:ver', 'a:gestionar'], ['a:ver']);
    expect(resultado.aQuitar).toEqual(['a:gestionar']);
    expect(resultado.aAgregar).toEqual([]);
  });

  it('no reporta nada cuando ya está sincronizado', () => {
    const resultado = diffCatalogoPermisos(['a:ver'], ['a:ver']);
    expect(resultado).toEqual({ aAgregar: [], aQuitar: [] });
  });
});
