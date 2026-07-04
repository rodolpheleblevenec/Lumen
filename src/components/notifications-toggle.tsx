"use client";

import { useEffect, useState } from "react";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/app/(app)/actions";

type State = "loading" | "unsupported" | "denied" | "off" | "on" | "busy";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function NotificationsToggle() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "loading") return null;

  if (state === "unsupported") {
    return (
      <p className="text-sm text-ink-soft">
        Notifications non supportées ici. Sur iPhone : ajoute d&apos;abord
        Lumen à l&apos;écran d&apos;accueil (Partager → Sur l&apos;écran
        d&apos;accueil).
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-sm text-ink-soft">
        Notifications bloquées — réactive-les dans les réglages du
        navigateur.
      </p>
    );
  }

  const on = state === "on";
  return (
    <button
      onClick={on ? disable : enable}
      disabled={state === "busy"}
      role="switch"
      aria-checked={on}
      className="shadow-card flex min-h-12 w-full items-center justify-between gap-4 rounded-[18px] bg-card p-4 text-left transition disabled:opacity-60"
    >
      <span>
        <span className="block text-[13.5px] font-bold">
          Rappel quotidien de la leçon
        </span>
        <span className="block text-xs text-ink-soft">
          Chaque matin à 8h, ne rate pas ton streak.
        </span>
      </span>
      <span
        className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-line"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            on ? "left-[23px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
