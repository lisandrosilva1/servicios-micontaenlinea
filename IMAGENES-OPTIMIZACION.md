# Guía de Optimización de Imágenes para MiContaEnLínea

## Nombres SEO-Optimizados para las Imágenes

Las imágenes deben guardarse en la carpeta `/img/` con los siguientes nombres:

### 1. Calculadora con Documentos Financieros
- **Nombre archivo**: `calculadora-servicios-fiscales-sat.jpg`
- **Ubicación**: `/img/servicios/`
- **Dimensiones recomendadas**: 800x600px
- **Peso máximo**: 150KB
- **Uso**: Sección de servicios (facturación, declaraciones)
- **Alt text**: "Calculadora y documentos financieros para servicios fiscales ante el SAT"
- **Formato**: WebP (primario) + JPEG (fallback)

### 2. Documento Fiscal Mexicano con Monedas
- **Nombre archivo**: `declaracion-ejercicio-personas-morales-regimen-general.jpg`
- **Ubicación**: `/img/servicios/`
- **Dimensiones recomendadas**: 800x600px
- **Peso máximo**: 150KB
- **Uso**: Sección de declaraciones mensuales
- **Alt text**: "Declaración del ejercicio personas morales del régimen general con monedas mexicanas"
- **Formato**: WebP + JPEG

### 3. Billetes Mexicanos con SAT
- **Nombre archivo**: `impuestos-sat-mexico-dinero.jpg`
- **Ubicación**: `/img/servicios/`
- **Dimensiones recomendadas**: 800x600px
- **Peso máximo**: 150KB
- **Uso**: Sección principal de régimen fiscal
- **Alt text**: "Billetes mexicanos y referencia al SAT para servicios de régimen fiscal"
- **Formato**: WebP + JPEG

### 4. Formularios 1040 con Calculadora
- **Nombre archivo**: `impuestos-formulario-1040-calculo.jpg`
- **Ubicación**: `/img/servicios/`
- **Dimensiones recomendadas**: 800x600px
- **Peso máximo**: 150KB
- **Uso**: Sección comparativa (impuestos internacionales)
- **Alt text**: "Formularios de impuestos 1040 con calculadora para cálculos fiscales profesionales"
- **Formato**: WebP + JPEG

### 5. Mano Usando Calculadora en Documentos
- **Nombre archivo**: `contador-calculando-impuestos-documentos.jpg`
- **Ubicación**: `/img/servicios/`
- **Dimensiones recomendadas**: 800x600px
- **Peso máximo**: 150KB
- **Uso**: Sección de asesoría o hero section
- **Alt text**: "Contador profesional realizando cálculos de impuestos sobre documentos financieros"
- **Formato**: WebP + JPEG

## Instrucciones de Optimización

### Para WebP (Recomendado):
```bash
ffmpeg -i original.jpg -c:v libwebp -quality 80 optimizado.webp
```

### Para JPEG (Fallback):
```bash
ffmpeg -i original.jpg -quality 80 -resize 800x600 optimizado.jpg
```

## Ubicación en HTML

Las imágenes se integrarán en los siguientes archivos:

- `/index.html` - Sección de servicios y hero
- `/servicios/facturacion.html` - Documentos fiscales
- `/servicios/declaraciones-mensuales.html` - Declaraciones
- `/servicios/cambio-regimen.html` - Régimen fiscal
- `/servicios/actualizacion-actividades.html` - Actividades
- `/servicios/asesoria-telefonica.html` - Asesoría profesional

## Tags HTML Recomendados

```html
<picture>
  <source srcset="/img/servicios/nombre-imagen.webp" type="image/webp">
  <img src="/img/servicios/nombre-imagen.jpg" alt="Alt text descriptivo" loading="lazy">
</picture>
```

## Meta Tags para Imágenes

Añadir a cada página:
```html
<meta property="og:image" content="https://servicios.micontaenlinea.mx/img/servicios/nombre-imagen.jpg">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="600">
```

## Schema.org Markup para Imágenes

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "url": "https://servicios.micontaenlinea.mx/img/servicios/nombre-imagen.jpg",
  "name": "Descripción de la imagen",
  "description": "Descripción completa de la imagen"
}
```
