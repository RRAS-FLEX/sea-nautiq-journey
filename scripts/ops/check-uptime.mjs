const DEFAULT_TIMEOUT_MS = Number(process.env.UPTIME_TIMEOUT_MS || 6000);
const APP_HEALTH_URL = process.env.APP_HEALTH_URL || "http://localhost:8080/";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const withTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const latencyMs = Date.now() - startedAt;
    return { ok: response.ok, status: response.status, latencyMs, url, error: null };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
};

const checkApp = async () => {
  const result = await withTimeout(APP_HEALTH_URL, { method: "GET" });
  return {
    name: "app",
    ...result,
    ok: result.status !== null && result.status < 500,
  };
};

const checkSupabase = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      name: "supabase",
      ok: false,
      status: null,
      latencyMs: 0,
      url: "",
      error: "Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY",
    };
  }

  const target = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/boats?select=id&limit=1`;
  const result = await withTimeout(target, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  return {
    name: "supabase",
    ...result,
  };
};

const main = async () => {
  const checks = await Promise.all([checkApp(), checkSupabase()]);
  const allHealthy = checks.every((check) => check.ok);

  const output = {
    checkedAt: new Date().toISOString(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
    allHealthy,
    checks,
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(allHealthy ? 0 : 1);
};

main();
