# Despiece Auto y Moto

App Android que explica cada pieza de un auto o una moto: **dónde va, para qué sirve, mantenimiento, vida útil y síntomas de falla**. Se explora tocando una zona del vehículo o buscando por nombre, función o síntoma.

- **Offline:** los 49 datos de piezas van dentro del APK. Funciona sin internet.
- **Online (opcional):** con Firebase (Firestore) la app descarga actualizaciones y las guarda para usarlas luego sin conexión.
- **Se compila en la nube:** no hace falta instalar nada en la netbook (GitHub → Codemagic → APK).

> La información es orientativa y está basada en manuales y guías públicas (ver `SOURCES.md`). Para tu modelo, seguí siempre el manual del fabricante.

---

## Paso a paso (todo desde el navegador)

### 1. Subir el proyecto a GitHub
1. Entrá a github.com → **New repository** (nombre sugerido: `despiece-app`, privado o público).
2. Descomprimí el ZIP en la netbook y subí **el contenido de la carpeta** (arrastrar y soltar en *Add file → Upload files*). Tienen que quedar `package.json`, `codemagic.yaml`, `src/`, `www/`, etc. en la raíz del repo.
3. Para editar archivos después, abrí el repo y presioná la tecla `.` (punto): se abre un editor web liviano, sin instalar nada.

### 2. Firebase (opcional, para actualizar datos online)
Podés saltear este paso: la app funciona igual solo con los datos incluidos.
1. console.firebase.google.com → **Crear proyecto** (plan gratuito Spark).
2. **Firestore Database → Crear base de datos**. En la pestaña **Reglas**, pegá el contenido de `firestore.rules` y publicá.
3. **Configuración del proyecto → Tus apps → Web (`</>`)** → copiá el bloque `firebaseConfig`.
4. En GitHub editá `src/firebase-config.js` y reemplazá `null` por ese bloque (ver el ejemplo comentado en el archivo).
5. Cargar las piezas en Firestore (colección `piezas`, un documento por pieza con el `id` como nombre): la forma más simple es `tools/seed.mjs` desde **GitHub Codespaces** (corre en la nube, no en tu netbook):
   - Firebase → Configuración → Cuentas de servicio → *Generar nueva clave privada*, y subila al Codespace como `tools/serviceAccount.json` (**no** la subas al repo; ya está en `.gitignore`).
   - En la terminal del Codespace: `cd tools && npm install && node seed.mjs`.

### 3. Generar el APK con Codemagic
1. codemagic.io → **Sign up** con tu cuenta de GitHub.
2. **Add application** → elegí el repo `despiece-app` → tipo de proyecto: usá la configuración **`codemagic.yaml`** (ya viene lista en el repo).
3. **Start new build** → workflow `apk-despiece`. Tarda unos minutos.
4. Al terminar, descargá el `.apk` desde **Artifacts**.
   - Opcional: en `codemagic.yaml` descomentá la sección `publishing` y poné tu correo para recibir el APK por mail.
   - Codemagic tiene un plan gratuito con minutos limitados; revisá su cupo vigente en codemagic.io/pricing.

### 4. Instalar en el celular
Pasá el `.apk` al celular (WhatsApp, Drive, cable), abrilo y aceptá *Instalar apps de orígenes desconocidos* cuando el teléfono lo pida. El APK generado es de tipo *debug*: sirve para uso personal. Para publicarlo en Google Play hace falta firmarlo (release); Codemagic tiene guía para subir un keystore.

---

## Cómo actualizar el contenido

| Quiero… | Hago… |
|---|---|
| Agregar o corregir una pieza (queda en el APK) | Editar `src/data/parts.json` en GitHub y volver a compilar en Codemagic |
| Actualizar sin recompilar el APK | Editar/crear el documento en Firestore (colección `piezas`). La app lo recibe al abrirse con internet |
| Ocultar una pieza desde Firestore | Crear un documento con el mismo `id` y el campo `borrar: true` |

Cada pieza tiene: `id`, `v` (`auto` / `moto` / `ambos`), `sys` (sistema), `n` (nombre), `loc`, `fun`, `mant`, `vida`, `sint` (lista), `fuente` (lista).

## Estructura

```
src/main.js            interfaz, filtros, diagramas
src/sync.js            sincronización con Firestore (caché offline)
src/firebase-config.js tu configuración de Firebase
src/data/parts.json    piezas incluidas en el APK
www/                   index.html, estilos, PWA (manifest + service worker)
codemagic.yaml         receta de compilación en la nube
firestore.rules        reglas de seguridad (solo lectura desde la app)
tools/seed.mjs         carga parts.json a Firestore
```

## Notas técnicas
- Capacitor 7 (Node 22, Java 21 en Codemagic), Firebase JS SDK 11, empaquetado con esbuild.
- Los archivos web también sirven como **PWA**: si los publicás en Firebase Hosting o GitHub Pages (tras `npm run build`), se instala desde Chrome y funciona offline.
- Icono: el APK usa el icono por defecto de Capacitor. Para uno propio se puede agregar `@capacitor/assets` más adelante.
- Esta receta no pudo ejecutarse en el entorno donde se generó. Si Codemagic rechaza algo del `codemagic.yaml` (por ejemplo el `instance_type`), el mensaje de error indica el valor válido.
