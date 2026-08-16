/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { getKmaShortTermForecast } from "../lib/services/kmaForecastServer";
import type { Region } from "../lib/types";

interface Env {
  ASSETS: Fetcher;
  KMA_SERVICE_KEY?: string;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/kma-forecast") {
      if (request.method !== "GET") {
        return Response.json(
          { error: "Method not allowed." },
          {
            status: 405,
            headers: { allow: "GET" },
          },
        );
      }
      const region = url.searchParams.get("region");
      if (region !== "jeju" && region !== "honam") {
        return Response.json(
          { error: "region must be jeju or honam." },
          { status: 400 },
        );
      }
      if (!env.KMA_SERVICE_KEY) {
        return new Response(null, {
          status: 204,
          headers: { "cache-control": "no-store" },
        });
      }
      try {
        const forecast = await getKmaShortTermForecast(
          region as Region,
          env.KMA_SERVICE_KEY,
          request.signal,
        );
        return Response.json(forecast, {
          headers: {
            "cache-control":
              "public, max-age=300, stale-while-revalidate=300",
          },
        });
      } catch (error) {
        console.warn(
          "[GridFlow KMA server adapter]",
          error instanceof Error ? error.message : error,
        );
        return Response.json(
          { error: "KMA forecast is temporarily unavailable." },
          {
            status: 502,
            headers: { "cache-control": "no-store" },
          },
        );
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
      // honeycharge_app(별도 Vite SPA, 완전히 무관한 git 히스토리)를
      // public/app/에 정적으로 빌드해 두고 여기서 직접 서빙합니다.
      // Next.js rewrites()는 정적 public 파일로의 리라이트를 지원하지
      // 않아서(vinext 한계), Worker fetch 레벨에서 처리합니다.
      //
      // 실제 자산 요청(마지막 경로 조각에 확장자가 있음, 예: .js/.css/
      // .jpg)은 그대로 통과시켜 vinext의 기존 정적 서빙 경로가 처리하게
      // 둡니다. 확장자가 없는 경로는 react-router 클라이언트 라우트로
      // 보고 index.html로 폴백합니다 — handler.fetch를 직접 다시
      // 호출하면(중첩 호출) 응답 바디가 비어서 오는 vinext 버그가 있어,
      // 진짜 서브리퀘스트(전역 fetch)로 다시 요청해 우회합니다.
      const lastSegment = url.pathname.split("/").pop() ?? "";
      const isAssetRequest = lastSegment.includes(".");
      if (isAssetRequest) {
        return handler.fetch(request, env, ctx);
      }
      return fetch(new URL("/app/index.html", request.url), request);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
