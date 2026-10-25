"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: content stays visible when motion is unavailable. */
export default function StudioMotion() {
  const path = usePathname();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const animate = (
      element: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (preference.matches) return;
      const animation = element.animate(frames, options);
      animations.add(animation);
      animation.finished
        .catch(() => {})
        .finally(() => animations.delete(animation));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          animate(
            entry.target,
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 480,
              delay: Math.min(index * 55, 220),
              easing: "cubic-bezier(.2,.8,.2,1)",
            },
          );
        });
      },
      { threshold: 0.08 },
    );
    const scan = () => {
      document
        .querySelectorAll(
          ".play-heading, .cast-card, .prompt-studio, .playful-agent, .stat, .panel, .personalize-dialog",
        )
        .forEach((element) => {
          if (!seen.has(element)) {
            seen.add(element);
            observer.observe(element);
          }
        });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    const click = (event: MouseEvent) => {
      const button = (event.target as Element).closest("button");
      if (!button || button.disabled) return;
      animate(button, [{ scale: "1" }, { scale: ".96" }, { scale: "1" }], {
        duration: 230,
        easing: "ease-out",
      });
    };
    let active: HTMLElement | null = null;
    let frame = 0;
    const reset = () => {
      active?.style.removeProperty("rotate");
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || event.pointerType !== "mouse") return;
      const card = (event.target as Element).closest<HTMLElement>(".cast-card");
      if (active !== card) reset();
      active = card;
      cancelAnimationFrame(frame);
      if (!card) return;
      frame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        card.style.rotate = `${x * 5}deg`;
      });
    };
    const reduce = () => {
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel());
        reset();
      }
    };
    document.addEventListener("click", click);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    preference.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
      reset();
      document.removeEventListener("click", click);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      preference.removeEventListener("change", reduce);
    };
  }, [path]);
  return null;
}
