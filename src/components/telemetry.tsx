"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { appName } from "@/lib/config";

type Tracker = {
  track: (
    event?: string | { url: string; title: string; referrer: string },
    data?: Record<string, string>,
  ) => void;
};
declare global {
  interface Window {
    umami?: Tracker;
  }
}
let initialized = false;
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
};
const telemetryAllowed = () =>
  localStorage.getItem("ms52-analytics") !== "off" &&
  navigator.doNotTrack !== "1" &&
  process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === "true";
export function track(event: string) {
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("ms52-analytics") !== "off" &&
    navigator.doNotTrack !== "1"
  )
    window.umami?.track(event, { application: appName });
}
export function Telemetry() {
  const pathname = usePathname();
  const enabled = useSyncExternalStore(
    subscribe,
    telemetryAllowed,
    () => false,
  );
  const [scriptReady, setScriptReady] = useState(false);
  const lastPage = useRef("");
  useEffect(() => {
    const allowed =
      localStorage.getItem("ms52-analytics") !== "off" &&
      navigator.doNotTrack !== "1";
    // Configuration is supplied only after telemetry hosting and policy are approved.
    if (
      !allowed ||
      process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== "true" ||
      initialized ||
      !process.env.NEXT_PUBLIC_FARO_URL
    )
      return;
    initialized = true;
    void Promise.all([
      import("@grafana/faro-web-sdk"),
      import("@grafana/faro-web-tracing"),
    ])
      .then(([sdk, tracing]) => {
        sdk.initializeFaro({
          url: process.env.NEXT_PUBLIC_FARO_URL!,
          app: {
            name: appName,
            version: process.env.NEXT_PUBLIC_APP_VERSION || "local",
            environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
          },
          instrumentations: [
            ...sdk.getWebInstrumentations({ captureConsole: false }),
            new tracing.TracingInstrumentation({
              instrumentationOptions: {
                propagateTraceHeaderCorsUrls: [
                  window.location.origin + "/api/products",
                ],
              },
            }),
          ],
          ignoreUrls: [
            /\/api\/(session|accounts|orders)/,
            /\/api\/products\/.+/,
          ],
          beforeSend(item) {
            item.meta.page = {
              url: window.location.origin + window.location.pathname,
            };
            item.meta.user = {};
            const sensitive =
              /\/(login|register|account|order|checkout|admin)(\/|$)/.test(
                window.location.pathname,
              );
            if (item.type === sdk.TransportItemType.MEASUREMENT) {
              const measurement =
                item.payload as import("@grafana/faro-web-sdk").MeasurementEvent;
              item.payload = {
                type: measurement.type,
                values: measurement.values,
                timestamp: measurement.timestamp,
              };
              return item;
            }
            if (item.type === sdk.TransportItemType.EXCEPTION) {
              const payload =
                item.payload as import("@grafana/faro-web-sdk").ExceptionEvent;
              item.payload = {
                type: "Error",
                timestamp: payload.timestamp,
                value: "Browser application error",
                stacktrace: undefined,
                context: undefined,
              };
              return item;
            }
            if (
              item.type === sdk.TransportItemType.TRACE &&
              !sensitive &&
              !window.location.search
            )
              return item;
            return null;
          },
        });
      })
      .catch(() => {
        initialized = false;
      });
  }, []);
  useEffect(() => {
    if (
      !enabled ||
      !scriptReady ||
      appName === "admin" ||
      lastPage.current === pathname
    )
      return;
    lastPage.current = pathname;
    const safePath = /\/(account|order|checkout|login|register)(\/|$)/.test(
      pathname,
    )
      ? "/store/private"
      : pathname;
    window.umami?.track({
      url: window.location.origin + safePath,
      title: "Microsserv52 " + appName,
      referrer: window.location.origin,
    });
  }, [enabled, scriptReady, pathname]);
  if (
    !enabled ||
    appName === "admin" ||
    !process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ||
    !process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  )
    return null;
  return (
    <Script
      src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
      strategy="afterInteractive"
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
      data-domains={process.env.NEXT_PUBLIC_UMAMI_DOMAINS}
      data-auto-track="false"
      onReady={() => setScriptReady(true)}
    />
  );
}
