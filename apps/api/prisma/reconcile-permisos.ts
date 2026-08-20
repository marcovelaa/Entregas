export function diffCatalogoPermisos(
  existentes: string[],
  deseados: string[],
): { aAgregar: string[]; aQuitar: string[] } {
  const existentesSet = new Set(existentes);
  const deseadosSet = new Set(deseados);
  return {
    aAgregar: deseados.filter((codigo) => !existentesSet.has(codigo)),
    aQuitar: existentes.filter((codigo) => !deseadosSet.has(codigo)),
  };
}
