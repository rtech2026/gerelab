'use client'

/**
 * Utilitário de alta performance para concatenar e mesclar múltiplos áudios no navegador
 * com pausas respiratórias configuráveis usando Web Audio API nativa.
 */

// Converte AudioBuffer para arquivo WAV PCM 16-bit padrão da indústria
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numOfChan * bytesPerSample

  const dataLength = buffer.length * blockAlign
  const bufferLength = 44 + dataLength

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')

  // FMT sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true)
  view.setUint16(22, numOfChan, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)

  // data sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Escrever samples PCM 16-bit interpolados
  const channels: Float32Array[] = []
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = channels[channel][i]
      // Clamp para evitar distorções
      sample = Math.max(-1, Math.min(1, sample))
      // Conversão para 16-bit signed integer (-32768 a 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Mescla uma lista de blobs de áudio em um único áudio contínuo, inserindo
 * um intervalo de silêncio (pausa respiratória) entre cada faixa.
 */
export async function mergeAudioBlobs(
  blobs: Blob[],
  pauseSeconds: number = 0.6
): Promise<{ blob: Blob; duration: number; url: string }> {
  if (!blobs || blobs.length === 0) {
    throw new Error('Nenhum áudio fornecido para mesclagem.')
  }

  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('Web Audio API não suportada neste navegador.')
  }

  const audioCtx = new AudioContextClass()

  try {
    // 1. Decodificar todos os blobs em AudioBuffers
    const decodedBuffers: AudioBuffer[] = []
    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      decodedBuffers.push(audioBuffer)
    }

    // 2. Determinar sampleRate máximo e canais
    const sampleRate = decodedBuffers[0].sampleRate
    const numberOfChannels = Math.max(
      ...decodedBuffers.map((b) => b.numberOfChannels)
    )

    // 3. Calcular duração total em samples (incluindo pausas)
    const pauseSamples = Math.floor(pauseSeconds * sampleRate)
    let totalSamples = 0

    decodedBuffers.forEach((buf, idx) => {
      totalSamples += buf.length
      if (idx < decodedBuffers.length - 1) {
        totalSamples += pauseSamples
      }
    })

    // 4. Criar OfflineAudioContext para renderização rápida sem perda
    const offlineCtx = new OfflineAudioContext(
      numberOfChannels,
      totalSamples,
      sampleRate
    )

    let currentSampleOffset = 0

    // 5. Agendar cada buffer no tempo correto
    for (let i = 0; i < decodedBuffers.length; i++) {
      const buffer = decodedBuffers[i]
      const source = offlineCtx.createBufferSource()
      source.buffer = buffer
      source.connect(offlineCtx.destination)

      const startTime = currentSampleOffset / sampleRate
      source.start(startTime)

      currentSampleOffset += buffer.length + (i < decodedBuffers.length - 1 ? pauseSamples : 0)
    }

    // 6. Renderizar áudio final
    const renderedBuffer = await offlineCtx.startRendering()

    // 7. Converter para arquivo WAV
    const mergedBlob = audioBufferToWav(renderedBuffer)
    const mergedUrl = URL.createObjectURL(mergedBlob)
    const totalDuration = renderedBuffer.duration

    return {
      blob: mergedBlob,
      duration: totalDuration,
      url: mergedUrl,
    }
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
    }
  }
}
