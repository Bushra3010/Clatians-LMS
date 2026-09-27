"use client";

/**
 * In-app screens (detail pages, the profile sheet, a course's batch view…)
 * change without changing the URL. Without help, the phone's back gesture or
 * back button would leave the app entirely — to the login page — which looks
 * like being logged out.
 *
 * Every in-app step forward calls pushBack() with how to undo it. That adds a
 * browser history entry at the same URL, so the system back gesture pops our
 * entry and we run the undo instead of leaving the page. In-app back buttons
 * call goBack(), which goes through the same history entry, so both paths
 * stay in step.
 */

type Entry = {
  undo: () => void;
  /** False once the component that pushed the entry has unmounted. */
  alive: () => boolean;
};

const stack: Entry[] = [];
let listening = false;

function onPopState(e: PopStateEvent) {
  const depth = typeof e.state?.lmsBack === "number" ? e.state.lmsBack : 0;
  if (depth > stack.length) {
    // A browser "forward" into a step we can't redo — step straight back.
    window.history.back();
    return;
  }
  while (stack.length > depth) {
    const entry = stack.pop()!;
    if (entry.alive()) {
      entry.undo();
      return;
    }
    // A stale step (its screen is gone): skip it so the press isn't wasted.
    if (stack.length === depth && depth > 0) {
      window.history.back();
      return;
    }
  }
}

function listen() {
  if (listening || typeof window === "undefined") return;
  window.addEventListener("popstate", onPopState);
  listening = true;
}

/** Record a step the back gesture should undo. */
export function pushBack(undo: () => void, alive: () => boolean = () => true) {
  listen();
  stack.push({ undo, alive });
  window.history.pushState({ lmsBack: stack.length }, "");
}

/** Change what the latest step undoes, without adding a history entry. */
export function replaceBack(undo: () => void, alive: () => boolean = () => true) {
  if (!stack.length) return pushBack(undo, alive);
  stack[stack.length - 1] = { undo, alive };
}

/** In-app back button: undo the latest step, or run `fallback` if there is none. */
export function goBack(fallback?: () => void) {
  listen();
  if (stack.length) window.history.back();
  else fallback?.();
}

/** How many in-app steps are open (0 = at the app's root screen). */
export const backDepth = () => stack.length;
