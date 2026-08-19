import crypto from 'node:crypto'

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WSS_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
const CHROMIUM_VERSION = '130.0.2849.68'
const WIN_EPOCH = 11644473600n
const S_TO_NS = 10000000n

function drmToken(): string {
  const ticks = BigInt(Math.floor(Date.now() / 1000)) + WIN_EPOCH
  const rounded = ticks - (ticks % 300n)
  const winTicks = rounded * S_TO_NS
  return crypto
    .createHash('sha256')
    .update(winTicks.toString() + TRUSTED_TOKEN, 'ascii')
    .digest('hex')
    .toUpperCase()
}

function uuid() {
  return crypto.randomUUID().replace(/-/g, '')
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Convert a 0.5..2.0 rate multiplier into an Edge percentage string. */
function ratePercent(rate: number): string {
  const pct = Math.round((rate - 1) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

export type EdgeTTSOptions = {
  text: string
  voice: string
  rate?: number
  pitch?: number // semitone-ish, -50..50 as Hz
}

export async function synthesizeEdge({
  text,
  voice,
  rate = 1,
  pitch = 0,
}: EdgeTTSOptions): Promise<Buffer> {
  const WS: typeof WebSocket | undefined = (globalThis as any).WebSocket
  if (!WS) throw new Error('WebSocket not available in runtime')

  const connectId = uuid()
  const url =
    `${WSS_URL}?TrustedClientToken=${TRUSTED_TOKEN}` +
    `&Sec-MS-GEC=${drmToken()}` +
    `&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}` +
    `&ConnectionId=${connectId}`

  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voice}'>` +
    `<prosody rate='${ratePercent(rate)}' pitch='${pitch >= 0 ? '+' : ''}${pitch}Hz'>` +
    `${escapeXml(text)}` +
    `</prosody></voice></speak>`

  return new Promise<Buffer>((resolve, reject) => {
    let ws: WebSocket
    try {
      ws = new WS(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
          Origin: 'chrome-extension://jdiccldimpahaajaamn-editor',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      } as any)
    } catch {
      ws = new WS(url)
    }
    ws.binaryType = 'arraybuffer'

    const chunks: Buffer[] = []
    const timer = setTimeout(() => {
      try {
        ws.close()
      } catch {}
      reject(new Error('Edge TTS timeout'))
    }, 15000)

    const finish = (buf: Buffer | null, err?: Error) => {
      clearTimeout(timer)
      try {
        ws.close()
      } catch {}
      if (err) reject(err)
      else if (buf && buf.length > 0) resolve(buf)
      else reject(new Error('Edge TTS returned no audio'))
    }

    ws.onopen = () => {
      const configMsg =
        `X-Timestamp:${new Date().toString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: false,
                  wordBoundaryEnabled: false,
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        })
      ws.send(configMsg)

      const ssmlMsg =
        `X-RequestId:${connectId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml
      ws.send(ssmlMsg)
    }

    ws.onmessage = (event: MessageEvent) => {
      const { data } = event
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          finish(chunks.length ? Buffer.concat(chunks) : null)
        }
        return
      }
      // Binary audio frame: [2-byte header length][header][audio]
      const buf = Buffer.from(data as ArrayBuffer)
      if (buf.length < 2) return
      const headerLen = buf.readUInt16BE(0)
      const audio = buf.subarray(2 + headerLen)
      if (audio.length > 0) chunks.push(audio)
    }

    ws.onerror = () => finish(null, new Error('Edge TTS websocket error'))
    ws.onclose = () => {
      if (chunks.length) finish(Buffer.concat(chunks))
    }
  })
}
