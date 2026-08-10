# Setup iMac — Conexión correcta al repo Entregas

## Datos del repo

- **URL**: https://github.com/marcovelaa/Entregas.git
- **Usuario GitHub**: marcovelaa
- **Email**: marco.vela.calderon@gmail.com

---

## Paso 1 — Configurar identidad Git

```bash
git config --global user.name "marcovelaa"
git config --global user.email "marco.vela.calderon@gmail.com"
```

Verificar:
```bash
git config user.name
git config user.email
```

Debe mostrar `marcovelaa` y `marco.vela.calderon@gmail.com`.

---

## Paso 2 — Limpiar credenciales viejas (cuenta nyakovm)

```bash
git credential-osxkeychain erase
host=github.com
protocol=https

```

> Presioná Enter dos veces al final. No va a mostrar ningún mensaje, es correcto.

---

## Paso 3 — Generar Personal Access Token en GitHub

Hacé esto desde el browser (logueado como marcovelaa):

1. GitHub → avatar → **Settings**
2. Menú izquierdo, al fondo → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. Nombre: `imac-entregas`
6. Expiración: `No expiration` (o 90 días)
7. Scope: marcar `repo` ✓ (el primero del listado)
8. Clic en **Generate token**
9. **Copiá el token** — solo lo vas a ver UNA vez

---

## Paso 4 — Verificar que el remote apunta al repo correcto

```bash
git remote -v
```

Debe mostrar:
```
origin  https://github.com/marcovelaa/Entregas.git (fetch)
origin  https://github.com/marcovelaa/Entregas.git (push)
```

Si muestra otra URL, corregirla:
```bash
git remote set-url origin https://github.com/marcovelaa/Entregas.git
```

---

## Paso 5 — Probar la conexión

```bash
git push origin main
```

Va a pedir credenciales:
- **Username**: `marcovelaa`
- **Password**: el token del Paso 3 (NO tu password de GitHub)

Las credenciales quedan guardadas en el Keychain de macOS para futuros push/pull.

---

## Paso 6 — Verificar que todo funciona

```bash
git pull --rebase origin main
git push origin main
```

Si ambos comandos terminan sin error, la iMac está correctamente conectada.

---

## Flujo diario desde la iMac

```bash
# Al EMPEZAR a trabajar:
git pull --rebase origin main

# Al TERMINAR un bloque:
git add -A
git commit -m "feat: descripción de lo que hiciste"
git push origin main
```
