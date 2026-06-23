"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { setOpenDropdown, subscribeDropdown, getOpenDropdown } from "./dropdown-manager";
import { cn } from "@/lib/utils";

type Option = { value: string; label: React.ReactNode };

type SelectProps = {
  id?: string;
  value?: string;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  /** logical id for shared dropdown state - used so only one dropdown is open at a time */
  dropdownId?: string;
};

function Select({ id, value, options = [], placeholder = "Select...", disabled = false, className = "", onChange, dropdownId }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [menuMaxHeight, setMenuMaxHeight] = useState<number | undefined>(undefined);
  const idRef = useRef<string>(dropdownId || id || `dropdown-${Math.random().toString(36).slice(2, 9)}`);

  // No timestamp guard needed — we'll stop propagation on trigger/menu instead

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (!dropdownRef.current) return;
      const target = e.target as Node | null;
      if (!target) return;
      const withinTrigger = dropdownRef.current.contains(target);
      const withinMenu = menuRef.current?.contains(target);
      if (!withinTrigger && !withinMenu) {
        setOpenDropdown(null);
        setOpen(false);
      }
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const selectedIndex = options.findIndex((o) => o.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const current = optionRefs.current[highlightedIndex];
    current?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  useEffect(() => {
    if (!open || !buttonRef.current || !dropdownRef.current) return;

    const btnRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Estimate desired menu height (max 60vh) but we'll cap to available space.
    const desired = Math.min(viewportHeight * 0.6, 360);
    const spaceBelow = viewportHeight - btnRect.bottom - 12; // 12px safety
    const spaceAbove = btnRect.top - 12;

    if (spaceBelow >= Math.min(desired, 120)) {
      setPlacement("down");
      setMenuMaxHeight(Math.max(80, Math.min(desired, spaceBelow)));
    } else if (spaceAbove >= Math.min(desired, 120)) {
      setPlacement("up");
      setMenuMaxHeight(Math.max(80, Math.min(desired, spaceAbove)));
    } else {
      // neither side has ideal space — pick side with more room but cap height
      if (spaceBelow >= spaceAbove) {
        setPlacement("down");
        setMenuMaxHeight(Math.max(60, spaceBelow));
      } else {
        setPlacement("up");
        setMenuMaxHeight(Math.max(60, spaceAbove));
      }
    }
  }, [open]);

  // subscribe to global dropdown manager so only one is open at a time
  useEffect(() => {
    const unsub = subscribeDropdown((openId) => {
      const mine = idRef.current;
      if (openId === mine) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    });
    return unsub;
  }, []);

  function handleSelect(v: string) {
    // temporary debug to verify the option-to-state path
    // eslint-disable-next-line no-console
    console.log(`[Select:${idRef.current}] option selected ->`, v, "currentValue=", value);
    onChange && onChange(v);
    setOpenDropdown(null);
    setOpen(false);
  }

  function moveHighlight(direction: 1 | -1) {
    if (options.length === 0) return;
    setHighlightedIndex((current) => {
      const normalized = current < 0 ? 0 : current;
      const next = (normalized + direction + options.length) % options.length;
      return next;
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const mine = idRef.current;
        setOpenDropdown(mine);
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) {
        handleSelect(option.value);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpenDropdown(null);
      setOpen(false);
    }
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={(e) => {
          // debug: trigger click
          // eslint-disable-next-line no-console
          console.log(`[Select:${idRef.current}] trigger clicked currentOpen=`, getOpenDropdown(), ` open=`, open);
          e.stopPropagation();
          const mine = idRef.current;
          const currently = getOpenDropdown();
          if (currently === mine) {
            setOpenDropdown(null);
            setOpen(false);
          } else {
            setOpenDropdown(mine);
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15",
          disabled ? "cursor-not-allowed opacity-60" : ""
        )}
      >
        <span className="truncate text-left text-sm">{selected ? selected.label : placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`ml-3 text-white/40 transition-transform ${open ? "-rotate-180" : "rotate-0"}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            (() => {
              const rect = buttonRef.current?.getBoundingClientRect();
              const left = rect ? rect.left + window.scrollX : 0;
              const topDown = rect ? rect.bottom + window.scrollY + 8 : 0;
              const width = dropdownRef.current ? dropdownRef.current.offsetWidth : rect ? rect.width : undefined;
              const style: React.CSSProperties = {
                position: "absolute",
                left,
                top: placement === "down" ? topDown : undefined,
                // when flipping up we'll position using bottom
                bottom: placement === "up" ? window.innerHeight - (rect ? rect.top : 0) + 8 : undefined,
                width,
                background: "rgba(15,23,42,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                borderRadius: 18,
                maxHeight: menuMaxHeight,
                overflow: "auto",
                padding: 8,
                zIndex: 9999,
              };

              return (
                <div
                  ref={menuRef}
                  role="listbox"
                  aria-activedescendant={value}
                  className={`hidden-scrollbar transform-gpu transition-all duration-220 ease-out ${placement === "down" ? "origin-top" : "origin-bottom"}`}
                  style={style}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {options.map((opt, index) => (
                    <button
                      key={opt.value}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      onPointerDown={(e) => {
                        // debug: confirm pointer events reach the option before the menu closes
                        // eslint-disable-next-line no-console
                        console.log(`[Select:${idRef.current}] option pointerdown ->`, opt.value);
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(opt.value);
                      }}
                      onMouseDown={(e) => {
                        // debug fallback for environments that don't fire pointer events on the option
                        // eslint-disable-next-line no-console
                        console.log(`[Select:${idRef.current}] option mousedown ->`, opt.value);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        // debug fallback if the browser only delivers click for the option
                        // eslint-disable-next-line no-console
                        console.log(`[Select:${idRef.current}] option click ->`, opt.value);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left text-sm text-white transition-colors duration-150 outline-none",
                        opt.value === value ? "bg-violet-500/20 text-violet-100" : "hover:bg-white/5 hover:text-white",
                        options[highlightedIndex]?.value === opt.value ? "ring-1 ring-violet-400/40" : ""
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              );
            })(),
            document.body
          )
        : null}
    </div>
  );
}

export { Select };
