import {
  handleSupportChat,
  MAX_BODY_BYTES,
  PASSCODE_HEADER,
  STREAM_HEADERS,
} from '../../server/supportChat.ts'

/**
 * Netlify Function — 실시간 채팅 상담 프록시.
 *
 * ANTHROPIC_API_KEY / SUPPORT_CHAT_PASSCODE는 Netlify 환경변수에서만 읽는다.
 * 클라이언트 번들에는 어떤 비밀도 포함되지 않는다.
 *
 * `requirePasscodeConfigured: true` — 공개 URL이므로 암호가 설정되지 않았다면
 * 아예 열지 않는다(환경변수 누락으로 무방비 공개되는 사고 방지).
 */
export default async (req: Request): Promise<Response> => {
  const jsonError = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  // 본문 크기 선제 차단 (Content-Length 기준)
  const declaredLength = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError(413, { error: '요청이 너무 커요.' })
  }

  let rawBody = ''
  if (req.method === 'POST') {
    rawBody = await req.text()
  }

  const outcome = await handleSupportChat(
    {
      method: req.method,
      rawBody,
      passcode: req.headers.get(PASSCODE_HEADER),
      clientId:
        req.headers.get('x-nf-client-connection-ip') ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        'unknown',
    },
    {
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      passcode: process.env.SUPPORT_CHAT_PASSCODE || null,
      requirePasscodeConfigured: true,
    }
  )

  if (outcome.kind === 'error') {
    return jsonError(outcome.status, outcome.body)
  }
  return new Response(outcome.stream, { status: 200, headers: STREAM_HEADERS })
}

export const config = { path: '/api/support-chat' }
