# Lectura entre líneas — generación de audios

Esta actividad usa archivos `.mp3` pre-generados con **Google Cloud Text-to-Speech**
(voces neuronales en español de México). Los audios se commitean junto con el código,
así que en producción no hay llamada de red a Google ni se necesita API key — solo
se sirven archivos estáticos.

## Configurar Google Cloud TTS (una sola vez)

1. Andá a [console.cloud.google.com](https://console.cloud.google.com) y entrá a tu proyecto
   (o creá uno nuevo).
2. En "APIs & Services → Library", buscá **Cloud Text-to-Speech API** y habilitala.
3. En "APIs & Services → Credentials", creá una **API key**. Restringila a la
   Text-to-Speech API para mayor seguridad.
4. Copiá la key (empieza con `AIza...`).

> Free tier: 1 millón de caracteres por mes con voces Neural2. Los 8 textos de esta
> actividad consumen ~2k chars, así que entra de sobra sin costo.

## Generar los audios

```bash
cd activities/lectura-entre-lineas
GCP_TTS_API_KEY="AIza..." node generate-audio.js
```

El script lee `texts.js`, llama a Google Cloud TTS por cada texto, y guarda los
MP3 en `assets/audio/01.mp3`, `02.mp3`, ... etc.

### Variables opcionales

| Variable | Default | Qué hace |
|---|---|---|
| `GCP_TTS_API_KEY` | (requerida) | Tu API key |
| `GCP_TTS_VOICE` | `es-MX-Neural2-A` | Voz a usar. Probá `B` (otra femenina), `C` (masculina), `D` (otra masculina) |
| `GCP_TTS_RATE` | `0.92` | Velocidad. `1.0` = normal. Para chicos de primaria, `0.9` se entiende mejor |

Ejemplo con voz masculina y velocidad más pausada:

```bash
GCP_TTS_API_KEY="AIza..." \
GCP_TTS_VOICE="es-MX-Neural2-C" \
GCP_TTS_RATE="0.88" \
node generate-audio.js
```

## Modificar o agregar textos

1. Editá `texts.js` (agregá o cambiá entradas).
2. Re-corré el script.
3. Commiteá los `.mp3` nuevos.

## Por qué este approach

- **Calidad consistente**: la voz neuronal de Google suena igual en cualquier dispositivo,
  a diferencia de Web Speech API que depende de la voz instalada en el SO del usuario.
- **Cero costo en runtime**: pagás una vez al generar, después es solo HTTP estático.
- **Sin API key en el browser**: la key vive en tu shell al momento de generar; el
  HTML público no la toca.
- **Funciona offline** después del primer load (el browser cachea los MP3).
- **Sin backend**: no necesitás levantar nada para que la actividad funcione.
