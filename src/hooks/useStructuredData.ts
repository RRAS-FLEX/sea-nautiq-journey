import { useEffect, useMemo } from "react";

export const useStructuredData = (scriptId: string, data: Record<string, unknown> | null) => {
  const serialized = useMemo(() => {
    if (!data) {
      return "";
    }
    return JSON.stringify(data);
  }, [data]);

  useEffect(() => {
    if (!serialized) {
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = serialized;

    return () => {
      const currentScript = document.getElementById(scriptId);
      currentScript?.parentNode?.removeChild(currentScript);
    };
  }, [scriptId, serialized]);
};
