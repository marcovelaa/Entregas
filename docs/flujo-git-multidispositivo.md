# Flujo Git — Trabajo simultáneo en 2 dispositivos

## El mapa mental

```
iMac                    GitHub (origin)              Laptop (Windows)
 │                           │                            │
 ├── git pull ──────────────►│◄────────────── git pull ──┤
 │                           │                            │
 ├── [trabajás aquí]         │         [trabajás aquí] ──┤
 │                           │                            │
 └── git push ─────────────►│◄────────────── git push ──┘
```

GitHub es el árbitro. Nadie trabaja "contra" el otro — ambos sincronizan contra el centro.

---

## Regla de oro (sin excepción)

> **Antes de escribir UNA SOLA línea de código: `git pull --rebase`**

Si no hacés esto, vas a acumular divergencias y los conflictos se vuelven innecesariamente dolorosos.

---

## Escenario A — Trabajás de a uno (el más común)

Aunque tenés 2 devices, en la práctica solés trabajar en uno a la vez.

### Rutina en el device que arrancás a usar:

```bash
# 1. Traer todos los cambios del otro device
git pull --rebase origin main

# 2. Trabajar...

# 3. Al terminar un bloque (aunque sea una feature pequeña):
git add -A
git commit -m "feat: descripción de lo que hiciste"
git push origin main
```

### Regla de cierre:
Antes de cerrar la laptop o la iMac, **siempre hacé push**. Así el otro device arranca limpio.

```bash
git push origin main
```

---

## Escenario B — Trabajo verdaderamente simultáneo

Los dos están editando al mismo tiempo. Acá la clave son las **ramas (branches)**.

### Setup inicial (hacerlo una sola vez):

Definen qué trabaja cada uno en ese momento:

```bash
# En iMac — por ejemplo trabajando en el backend:
git checkout -b feat/backend-auth

# En Laptop — por ejemplo trabajando en el frontend:
git checkout -b feat/frontend-catalog
```

### Flujo en cada device (independiente):

```bash
# trabajar...
git add -A
git commit -m "feat: lo que hiciste"
git push origin feat/backend-auth   # o el nombre de tu rama
```

### Cuando terminan y quieren unir:

```bash
# Asegurarse que main está actualizado
git checkout main
git pull --rebase origin main

# Mergear la rama del iMac
git merge feat/backend-auth

# Mergear la rama del Laptop
git merge feat/frontend-catalog

# Subir main unificado
git push origin main
```

---

## Escenario C — Editan el mismo archivo al mismo tiempo (conflicto)

Esto VA A PASAR. No es un error, es parte del flujo. Hay que saber resolverlo.

### Cómo se ve un conflicto:

```
<<<<<<< HEAD (tus cambios locales)
const precio = producto.precio_base * 1.15;
=======
const precio = producto.precio_base + gastos;
>>>>>>> origin/main (cambios del otro device)
```

### Cómo resolverlo:

```bash
# 1. Git te avisa qué archivos tienen conflicto:
git status
# → both modified: src/productos/service.ts

# 2. Abrís el archivo, encontrás los marcadores <<<< ==== >>>>
# 3. Editás manualmente: dejás el código correcto, borrás los marcadores
# 4. Marcás como resuelto y continuás:
git add src/productos/service.ts
git rebase --continue   # si usabas rebase
# o
git commit              # si usabas merge
```

### En VS Code es más fácil:
VS Code muestra los conflictos con botones visuales:
- **Accept Current Change** → quedás con tu versión
- **Accept Incoming Change** → quedás con la del otro device
- **Accept Both Changes** → combinás ambas

---

## Comandos de emergencia (cuando algo sale mal)

```bash
# Ver en qué estado está tu repo:
git status

# Ver el historial reciente:
git log --oneline -10

# "Espera, metí la pata, quiero descartar mis cambios locales":
git restore .

# "Quiero volver al último commit limpio":
git reset --hard HEAD

# "Quiero ver qué cambió en el otro device sin aplicarlo todavía":
git fetch origin
git diff main origin/main
```

---

## Checklist diario

### Al EMPEZAR a trabajar (cualquier device):
- [ ] `git pull --rebase origin main`
- [ ] Confirmar que `git status` está limpio

### Al TERMINAR un bloque de trabajo:
- [ ] `git add -A`
- [ ] `git commit -m "tipo: descripción"`
- [ ] `git push origin main` (o tu rama)

### Al CERRAR el device:
- [ ] `git push` — siempre, aunque parezca redundante

---

## Convención de commits para este proyecto

Usar **Conventional Commits** — ya lo tienen configurado:

| Prefix | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `refactor:` | Cambio de código sin cambiar comportamiento |
| `chore:` | Configuración, dependencias, scripts |
| `docs:` | Documentación |
| `test:` | Tests |

Ejemplo:
```bash
git commit -m "feat: agregar endpoint de reserva de stock QR"
git commit -m "fix: corregir cálculo de stock_disponible en inventario"
```

---

## Recomendación para este proyecto (ENTREGAS.com.bo)

Dado que el monorepo tiene **backend (NestJS)** y **frontend (Next.js)** separados en `/apps`, la división natural es:

```
iMac   → trabaja en apps/api (backend)
Laptop → trabaja en apps/web (frontend)
```

Esto minimiza conflictos al mínimo porque raramente tocan los mismos archivos.
