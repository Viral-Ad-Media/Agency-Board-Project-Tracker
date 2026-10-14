"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { TOUR_STEPS } from "../lib/onboarding";

type Rect = { top: number; left: number; width: number; height: number };

type ProductTourProps = {
  isActive: boolean;
  onFinish: () => void;
};

const HIGHLIGHT_PADDING = 6;
const CALLOUT_WIDTH = 300;
const CALLOUT_GAP = 14;
const VIEWPORT_MARGIN = 16;

export function ProductTour({ isActive, onFinish }: ProductTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (isActive) setStepIndex(0);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !step) return;

    const target = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    target?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });

    function measure() {
      const element = document.querySelector(`[data-tour-id="${step.targetId}"]`);
      if (!element) {
        setRect(null);
        return;
      }
      const domRect = element.getBoundingClientRect();
      setRect({
        top: domRect.top,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height,
      });
    }

    measure();
    const settleTimer = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isActive, step]);

  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onFinish();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onFinish]);

  if (!isActive || !step || typeof window === "undefined") return null;

  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  function goNext() {
    if (isLast) {
      onFinish();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  const highlight = rect
    ? {
        top: rect.top - HIGHLIGHT_PADDING,
        left: rect.left - HIGHLIGHT_PADDING,
        width: rect.width + HIGHLIGHT_PADDING * 2,
        height: rect.height + HIGHLIGHT_PADDING * 2,
      }
    : null;

  let calloutTop = window.innerHeight / 2 - 90;
  let calloutLeft = window.innerWidth / 2 - CALLOUT_WIDTH / 2;

  if (highlight) {
    const spaceBelow = window.innerHeight - (highlight.top + highlight.height);
    const spaceAbove = highlight.top;
    const placeBelow =
      step.placement === "bottom" ? spaceBelow > 180 || spaceBelow > spaceAbove : spaceBelow > 180 && spaceAbove < 180;

    calloutTop = placeBelow
      ? highlight.top + highlight.height + CALLOUT_GAP
      : highlight.top - CALLOUT_GAP - 160;
    calloutTop = Math.max(VIEWPORT_MARGIN, Math.min(calloutTop, window.innerHeight - 180));

    calloutLeft = highlight.left + highlight.width / 2 - CALLOUT_WIDTH / 2;
    calloutLeft = Math.max(
      VIEWPORT_MARGIN,
      Math.min(calloutLeft, window.innerWidth - CALLOUT_WIDTH - VIEWPORT_MARGIN),
    );
  }

  return (
    <div className="tour-root">
      {highlight ? (
        <div
          className="tour-highlight"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      <div
        className="tour-callout"
        style={{ top: calloutTop, left: calloutLeft, width: CALLOUT_WIDTH }}
        role="dialog"
        aria-label={step.title}
      >
        <div className="tour-callout-header">
          <span className="tour-step-count">
            {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button
            className="tour-close"
            type="button"
            onClick={onFinish}
            aria-label="End tour"
          >
            <X size={14} />
          </button>
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        <div className="tour-actions">
          <button className="btn-secondary tour-skip" type="button" onClick={onFinish}>
            Skip tour
          </button>
          <div className="tour-actions-spacer" />
          {!isFirst ? (
            <button className="btn-secondary" type="button" onClick={goBack}>
              Back
            </button>
          ) : null}
          <button className="btn-primary tour-next" type="button" onClick={goNext}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
