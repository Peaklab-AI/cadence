// src/components/Button/Button.tsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// src/lib/cx.ts
import { clsx } from "clsx";
function cx(...inputs) {
  return clsx(inputs);
}

// src/components/Button/Button.module.css
var Button_default = {"button": "button__Button", "primary": "primary__Button", "outline": "outline__Button", "accent": "accent__Button", "secondary": "secondary__Button", "ghost": "ghost__Button", "inverse": "inverse__Button", "quiet": "quiet__Button", "sm": "sm__Button", "md": "md__Button", "lg": "lg__Button", "withArrow": "withArrow__Button", "fullWidth": "fullWidth__Button", "arrowBadge": "arrowBadge__Button", "arrowIcon": "arrowIcon__Button"};

// src/components/Button/Button.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var Button = React.forwardRef(
  ({
    className,
    children,
    variant = "primary",
    size = "md",
    arrow = false,
    icon: Icon = ArrowRight,
    fullWidth = false,
    href,
    disabled,
    ...props
  }, ref) => {
    const Component = href ? motion.a : motion.button;
    return /* @__PURE__ */ jsxs(
      Component,
      {
        ref,
        href,
        disabled: href ? void 0 : disabled,
        "aria-disabled": href ? disabled || void 0 : void 0,
        className: cx(
          Button_default.button,
          Button_default[variant],
          Button_default[size],
          fullWidth && Button_default.fullWidth,
          arrow && Button_default.withArrow,
          className
        ),
        ...props,
        children: [
          children,
          arrow && /* @__PURE__ */ jsx("span", { className: Button_default.arrowBadge, "aria-hidden": "true", children: /* @__PURE__ */ jsx(Icon, { className: Button_default.arrowIcon }) })
        ]
      }
    );
  }
);
Button.displayName = "Button";
var Button_default2 = Button;

// src/components/IconButton/IconButton.tsx
import React2 from "react";
import { motion as motion2 } from "framer-motion";

// src/components/IconButton/IconButton.module.css
var IconButton_default = {"iconButton": "iconButton__IconButton", "icon": "icon__IconButton", "outline": "outline__IconButton", "ghost": "ghost__IconButton", "primary": "primary__IconButton", "sm": "sm__IconButton", "md": "md__IconButton", "lg": "lg__IconButton"};

// src/components/IconButton/IconButton.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var IconButton = React2.forwardRef(
  ({ className, icon, variant = "outline", size = "md", href, disabled, ...props }, ref) => {
    const Component = href ? motion2.a : motion2.button;
    return /* @__PURE__ */ jsx2(
      Component,
      {
        ref,
        href,
        disabled: href ? void 0 : disabled,
        "aria-disabled": href ? disabled || void 0 : void 0,
        className: cx(IconButton_default.iconButton, IconButton_default[variant], IconButton_default[size], className),
        ...props,
        children: /* @__PURE__ */ jsx2("span", { className: IconButton_default.icon, "aria-hidden": "true", children: icon })
      }
    );
  }
);
IconButton.displayName = "IconButton";
var IconButton_default2 = IconButton;

// src/components/Container/Container.tsx
import React3 from "react";

// src/components/Container/Container.module.css
var Container_default = {"container": "container__Container", "max": "max__Container", "narrow": "narrow__Container", "full": "full__Container", "gutter": "gutter__Container"};

// src/components/Container/Container.tsx
var Container = React3.forwardRef(
  ({ as = "div", size = "max", gutter = false, className, children, ...props }, ref) => {
    return React3.createElement(
      as,
      {
        ref,
        className: cx(
          Container_default.container,
          Container_default[size],
          gutter && Container_default.gutter,
          className
        ),
        ...props
      },
      children
    );
  }
);
Container.displayName = "Container";
var Container_default2 = Container;

// src/components/AnimatedBackground/AnimatedBackground.tsx
import React4, { useEffect, useRef, useState } from "react";
import {
  motion as motion3,
  motionValue,
  useReducedMotion
} from "framer-motion";

// src/components/AnimatedBackground/AnimatedBackground.module.css
var AnimatedBackground_default = {"root": "root__AnimatedBackground", "background": "background__AnimatedBackground", "grid": "grid__AnimatedBackground", "shapesLayer": "shapesLayer__AnimatedBackground", "shape": "shape__AnimatedBackground", "image": "image__AnimatedBackground"};

// src/components/AnimatedBackground/AnimatedBackground.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var BEAM_BASE_ANGLE = 90;
var BEAM_ANGLE_RANGE = 35;
function useRandomShapeConfigs(count) {
  const [configs, setConfigs] = useState([]);
  useEffect(() => {
    setConfigs(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        length: Math.random() * 300 + 560,
        thickness: Math.random() * 160 + 280,
        // A single opacity value on a transparent -> color -> transparent
        // gradient, same as the original static beams - no separate fill
        // alpha layered on top, which just compounds down to invisible
        // against a near-white wash.
        opacity: Math.random() * 0.14 + 0.22,
        // Half the shapes read as "nearer" (crisp), half "farther" (soft) -
        // a cheap static depth cue rather than a continuous blur formula.
        blur: Math.random() > 0.5 ? Math.random() * 1 + 0.5 : 0,
        // Slow drift - crossing the full width of a typical hero takes over
        // a minute.
        speed: Math.random() * 14 + 14,
        // Angular speed magnitude (deg/s) for the bounded wobble - sign is
        // randomized per-shape at spawn time and flips at the wobble's
        // limits, not here.
        spinSpeed: 360 / (Math.random() * 60 + 50),
        staticTop: Math.random() * 100,
        staticLeft: Math.random() * 100,
        staticAngle: BEAM_BASE_ANGLE + (Math.random() * 2 - 1) * BEAM_ANGLE_RANGE
      }))
    );
  }, [count]);
  return configs;
}
function stepPhysics(configs, physics, bounds, dt) {
  const { width, height } = bounds;
  if (!width || !height) return;
  const items = configs.map((cfg) => ({ cfg, phys: physics.get(cfg.id) })).filter(
    (item) => !!item.phys
  );
  const maxAngle = BEAM_BASE_ANGLE + BEAM_ANGLE_RANGE;
  const minAngle = BEAM_BASE_ANGLE - BEAM_ANGLE_RANGE;
  for (const { cfg, phys } of items) {
    phys.x += phys.vx * dt;
    phys.y += phys.vy * dt;
    phys.angle += phys.spin * dt;
    if (phys.angle > maxAngle) {
      phys.angle = maxAngle;
      phys.spin = -Math.abs(phys.spin);
    } else if (phys.angle < minAngle) {
      phys.angle = minAngle;
      phys.spin = Math.abs(phys.spin);
    }
    if (phys.x < 0) {
      phys.x = 0;
      phys.vx = Math.abs(phys.vx);
    } else if (phys.x + cfg.length > width) {
      phys.x = width - cfg.length;
      phys.vx = -Math.abs(phys.vx);
    }
    if (phys.y < 0) {
      phys.y = 0;
      phys.vy = Math.abs(phys.vy);
    } else if (phys.y + cfg.thickness > height) {
      phys.y = height - cfg.thickness;
      phys.vy = -Math.abs(phys.vy);
    }
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const ra = (a.cfg.length + a.cfg.thickness) / 4;
      const rb = (b.cfg.length + b.cfg.thickness) / 4;
      const dx = b.phys.x + b.cfg.length / 2 - (a.phys.x + a.cfg.length / 2);
      const dy = b.phys.y + b.cfg.thickness / 2 - (a.phys.y + a.cfg.thickness / 2);
      const dist = Math.hypot(dx, dy) || 1e-3;
      const minDist = ra + rb;
      if (dist >= minDist) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.phys.x -= nx * overlap / 2;
      a.phys.y -= ny * overlap / 2;
      b.phys.x += nx * overlap / 2;
      b.phys.y += ny * overlap / 2;
      const avn = a.phys.vx * nx + a.phys.vy * ny;
      const bvn = b.phys.vx * nx + b.phys.vy * ny;
      a.phys.vx += (bvn - avn) * nx;
      a.phys.vy += (bvn - avn) * ny;
      b.phys.vx += (avn - bvn) * nx;
      b.phys.vy += (avn - bvn) * ny;
    }
  }
}
function useBouncingShapes(configs, layerRef, paused) {
  const motionValuesRef = useRef(/* @__PURE__ */ new Map());
  const physicsRef = useRef(/* @__PURE__ */ new Map());
  const boundsRef = useRef({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  for (const cfg of configs) {
    if (!motionValuesRef.current.has(cfg.id)) {
      motionValuesRef.current.set(cfg.id, {
        x: motionValue(0),
        y: motionValue(0),
        rotate: motionValue(cfg.staticAngle)
      });
    }
  }
  useEffect(() => {
    const layer = layerRef.current;
    if (paused || configs.length === 0 || !layer) return;
    const measure = () => {
      const rect = layer.getBoundingClientRect();
      boundsRef.current = { width: rect.width, height: rect.height };
    };
    measure();
    for (const cfg of configs) {
      if (physicsRef.current.has(cfg.id)) continue;
      const { width, height } = boundsRef.current;
      const dir = Math.random() * Math.PI * 2;
      physicsRef.current.set(cfg.id, {
        x: Math.random() * Math.max(width - cfg.length, 0),
        y: Math.random() * Math.max(height - cfg.thickness, 0),
        vx: Math.cos(dir) * cfg.speed,
        vy: Math.sin(dir) * cfg.speed,
        angle: cfg.staticAngle,
        spin: cfg.spinSpeed * (Math.random() > 0.5 ? 1 : -1)
      });
    }
    setReady(true);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : void 0;
    resizeObserver == null ? void 0 : resizeObserver.observe(layer);
    let frameId;
    let lastTime = null;
    const tick = (time) => {
      if (lastTime !== null) {
        const dt = Math.min((time - lastTime) / 1e3, 0.05);
        stepPhysics(configs, physicsRef.current, boundsRef.current, dt);
        for (const cfg of configs) {
          const phys = physicsRef.current.get(cfg.id);
          const mv = motionValuesRef.current.get(cfg.id);
          if (!phys || !mv) continue;
          mv.x.set(phys.x);
          mv.y.set(phys.y);
          mv.rotate.set(phys.angle);
        }
      }
      lastTime = time;
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      resizeObserver == null ? void 0 : resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [configs, layerRef, paused]);
  return { motionValues: motionValuesRef.current, ready };
}
var AnimatedBackground = React4.forwardRef(
  ({ shapeCount = 4, grid = true, background, image, className, ...props }, ref) => {
    const configs = useRandomShapeConfigs(shapeCount);
    const shouldReduceMotion = useReducedMotion();
    const layerRef = useRef(null);
    const { motionValues, ready } = useBouncingShapes(
      configs,
      layerRef,
      !!shouldReduceMotion
    );
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        ref,
        role: "presentation",
        "aria-hidden": "true",
        className: cx(AnimatedBackground_default.root, className),
        ...props,
        children: [
          background && /* @__PURE__ */ jsx3("div", { className: AnimatedBackground_default.background, "data-tone": background }),
          grid && /* @__PURE__ */ jsx3("div", { className: AnimatedBackground_default.grid }),
          /* @__PURE__ */ jsx3("div", { className: AnimatedBackground_default.shapesLayer, ref: layerRef, children: configs.map((cfg) => {
            const commonStyle = {
              width: `${cfg.length}px`,
              height: `${cfg.thickness}px`,
              opacity: cfg.opacity,
              filter: cfg.blur ? `blur(${cfg.blur}px)` : void 0
            };
            if (shouldReduceMotion) {
              return /* @__PURE__ */ jsx3(
                "div",
                {
                  className: AnimatedBackground_default.shape,
                  style: {
                    ...commonStyle,
                    top: `${cfg.staticTop}%`,
                    left: `${cfg.staticLeft}%`,
                    transform: `rotate(${cfg.staticAngle}deg)`
                  }
                },
                cfg.id
              );
            }
            if (!ready) return null;
            const mv = motionValues.get(cfg.id);
            return /* @__PURE__ */ jsx3(
              motion3.div,
              {
                className: AnimatedBackground_default.shape,
                style: { ...commonStyle, x: mv.x, y: mv.y, rotate: mv.rotate }
              },
              cfg.id
            );
          }) }),
          image && /* @__PURE__ */ jsx3("img", { src: image, alt: "", className: AnimatedBackground_default.image })
        ]
      }
    );
  }
);
AnimatedBackground.displayName = "AnimatedBackground";
var AnimatedBackground_default2 = AnimatedBackground;

// src/components/GradientBackground/GradientBackground.tsx
import React5 from "react";

// src/components/GradientBackground/GradientBackground.module.css
var GradientBackground_default = {"root": "root__GradientBackground"};

// src/components/GradientBackground/GradientBackground.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
var GradientBackground = React5.forwardRef(
  ({ tone = "butter", animated = false, revealOnHover = false, className, children, ...props }, ref) => /* @__PURE__ */ jsx4(
    "div",
    {
      ref,
      "data-tone": tone,
      "data-animated": animated || void 0,
      "data-reveal-on-hover": revealOnHover || void 0,
      className: cx(GradientBackground_default.root, className),
      ...props,
      children
    }
  )
);
GradientBackground.displayName = "GradientBackground";
var GradientBackground_default2 = GradientBackground;

// src/components/Select/Select.tsx
import React7, { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";
import { motion as motion4, AnimatePresence } from "framer-motion";

// src/lib/motion.ts
var DURATION = {
  fast: 0.12,
  base: 0.18,
  slow: 0.32,
  reveal: 0.52
};
var EASE = {
  standard: [0.2, 0, 0, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1]
};
var pressTransition = { duration: DURATION.fast, ease: EASE.standard };
var controlTransition = {
  duration: DURATION.base,
  ease: EASE.standard
};
var disclosureTransition = {
  duration: DURATION.slow,
  ease: EASE.standard
};
var revealTransition = { duration: DURATION.reveal, ease: EASE.out };

// src/components/Text/Text.tsx
import React6 from "react";

// src/lib/padding.ts
function resolvePadding(padding) {
  if (padding === void 0) return {};
  const sides = typeof padding === "number" ? { x: padding, y: padding } : padding;
  const { x, y, t, r, b, l } = sides;
  const top = t ?? y;
  const right = r ?? x;
  const bottom = b ?? y;
  const left = l ?? x;
  const style = {};
  if (top !== void 0) style.paddingTop = `var(--plu-space-${top})`;
  if (right !== void 0) style.paddingRight = `var(--plu-space-${right})`;
  if (bottom !== void 0) style.paddingBottom = `var(--plu-space-${bottom})`;
  if (left !== void 0) style.paddingLeft = `var(--plu-space-${left})`;
  return style;
}

// src/components/Text/Text.module.css
var Text_default = {"base": "base__Text", "body": "body__Text", "lead": "lead__Text", "small": "small__Text", "muted": "muted__Text", "pretty": "pretty__Text"};

// src/components/Text/Text.tsx
var Text = React6.forwardRef(
  ({ as, variant, wrap, padding, className, style, children, ...props }, ref) => {
    const Component = as || "p";
    const hasCustomTextSize = className && /(^|\s)([a-z0-9]+:)?text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[[^\]]+\])($|\s)/.test(
      className
    );
    const activeVariant = variant || (hasCustomTextSize ? "none" : "body");
    return React6.createElement(
      Component,
      {
        ref,
        className: cx(
          Text_default.base,
          activeVariant !== "none" && Text_default[activeVariant],
          wrap === "pretty" && Text_default.pretty,
          className
        ),
        style: { ...resolvePadding(padding), ...style },
        ...props
      },
      children
    );
  }
);
Text.displayName = "Text";
var Text_default2 = Text;

// src/components/Select/Select.module.css
var Select_default = {"container": "container__Select", "label": "label__Select", "fieldWrapper": "fieldWrapper__Select", "icon": "icon__Select", "input": "input__Select", "inputOpen": "inputOpen__Select", "inputError": "inputError__Select", "inputWithIcon": "inputWithIcon__Select", "inputNoIcon": "inputNoIcon__Select", "chevronWrapper": "chevronWrapper__Select", "errorText": "errorText__Select", "dropdown": "dropdown__Select", "dropdownList": "dropdownList__Select", "option": "option__Select", "optionIcon": "optionIcon__Select", "optionLabel": "optionLabel__Select", "optionCheck": "optionCheck__Select", "noResults": "noResults__Select"};

// src/components/Select/Select.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var Select = React7.forwardRef(
  ({
    label,
    value,
    onChange,
    options,
    placeholder = "Select an option",
    error
  }, ref) => {
    const [isOpen, setIsOpen] = useState2(false);
    const containerRef = useRef2(null);
    const selectedOption = options.find((opt) => opt.value === value);
    const [inputValue, setInputValue] = useState2((selectedOption == null ? void 0 : selectedOption.label) || "");
    const [prevValue, setPrevValue] = useState2(value);
    const [prevIsOpen, setPrevIsOpen] = useState2(isOpen);
    if (value !== prevValue) {
      setPrevValue(value);
      setInputValue((selectedOption == null ? void 0 : selectedOption.label) || "");
    }
    if (isOpen !== prevIsOpen) {
      setPrevIsOpen(isOpen);
      if (!isOpen && selectedOption) {
        setInputValue(selectedOption.label);
      }
    }
    let filteredOptions = options.filter(
      (opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    if (filteredOptions.length === 0) {
      const otherOption = options.find((opt) => opt.label === "Other");
      if (otherOption) {
        filteredOptions = [otherOption];
      }
    }
    useEffect2(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);
    const showIcon = selectedOption && selectedOption.icon && inputValue === selectedOption.label;
    return /* @__PURE__ */ jsxs3(
      "div",
      {
        className: Select_default.container,
        ref: (node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        },
        children: [
          /* @__PURE__ */ jsx5("label", { className: Select_default.label, children: label }),
          /* @__PURE__ */ jsxs3("div", { className: Select_default.fieldWrapper, children: [
            showIcon && /* @__PURE__ */ jsx5("span", { className: Select_default.icon, children: selectedOption.icon }),
            /* @__PURE__ */ jsx5(
              "input",
              {
                type: "text",
                value: inputValue,
                onChange: (e) => {
                  setInputValue(e.target.value);
                  setIsOpen(true);
                },
                onFocus: () => setIsOpen(true),
                onBlur: (e) => {
                  if (containerRef.current && e.relatedTarget instanceof Node && !containerRef.current.contains(e.relatedTarget)) {
                    setIsOpen(false);
                    if (inputValue === "" && selectedOption) {
                      setInputValue(selectedOption.label);
                    }
                  }
                },
                placeholder,
                className: cx(
                  Select_default.input,
                  error ? Select_default.inputError : isOpen && Select_default.inputOpen,
                  showIcon ? Select_default.inputWithIcon : Select_default.inputNoIcon
                )
              }
            ),
            /* @__PURE__ */ jsx5("div", { className: Select_default.chevronWrapper, "aria-hidden": "true", children: "\u25BE" }),
            error && /* @__PURE__ */ jsx5(Text, { as: "p", variant: "small", className: Select_default.errorText, children: error }),
            /* @__PURE__ */ jsx5(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx5(
              motion4.div,
              {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 8 },
                transition: pressTransition,
                className: Select_default.dropdown,
                children: /* @__PURE__ */ jsx5("div", { className: Select_default.dropdownList, children: filteredOptions.length > 0 ? filteredOptions.map((option) => /* @__PURE__ */ jsxs3(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      onChange(option.value);
                      setInputValue(option.label);
                      setIsOpen(false);
                    },
                    className: Select_default.option,
                    children: [
                      option.icon && /* @__PURE__ */ jsx5("span", { className: Select_default.optionIcon, children: option.icon }),
                      /* @__PURE__ */ jsx5(
                        Text,
                        {
                          as: "span",
                          variant: "small",
                          className: Select_default.optionLabel,
                          children: option.label
                        }
                      ),
                      value === option.value && /* @__PURE__ */ jsx5(
                        "span",
                        {
                          className: Select_default.optionCheck,
                          "aria-hidden": "true",
                          children: "\u2713"
                        }
                      )
                    ]
                  },
                  option.value
                )) : /* @__PURE__ */ jsx5(Text, { as: "div", variant: "small", className: Select_default.noResults, children: "No options found" }) })
              }
            ) })
          ] })
        ]
      }
    );
  }
);
Select.displayName = "Select";
var Select_default2 = Select;

// src/components/Logo/Logo.tsx
import React8 from "react";

// src/components/Logo/Logo.module.css
var Logo_default = {"wrapper": "wrapper__Logo", "iconWrap": "iconWrap__Logo", "svg": "svg__Logo", "wordmark": "wordmark__Logo", "peak": "peak__Logo", "peakLight": "peakLight__Logo", "lab": "lab__Logo", "labLight": "labLight__Logo", "srOnly": "srOnly__Logo"};

// src/components/Logo/wordmarkPaths.ts
var WORDMARK_VIEWBOX_WIDTH = 8074.66;
var WORDMARK_VIEWBOX_HEIGHT = 2478;
var WORDMARK_ASCENDER = 1984;
var WORDMARK_UNITS_PER_EM = 2048;
var PEAK_GLYPHS = [
  { d: "M138 -418V1118H392V933H409Q429 973 466.0 1019.0Q503 1065 566.5 1098.5Q630 1132 729 1132Q859 1132 963.0 1066.0Q1067 1000 1128.5 871.5Q1190 743 1190 557Q1190 373 1130.0 244.0Q1070 115 965.5 47.5Q861 -20 728 -20Q633 -20 569.0 12.5Q505 45 467.0 91.0Q429 137 409 177H398V-418ZM658 194Q745 194 804.0 241.5Q863 289 893.0 371.5Q923 454 923 558Q923 662 893.5 743.5Q864 825 805.0 871.5Q746 918 658 918Q572 918 513.0 873.0Q454 828 423.5 747.5Q393 667 393 558Q393 449 423.5 367.0Q454 285 513.5 239.5Q573 194 658 194Z", x: 0 },
  { d: "M632 -23Q463 -23 341.5 48.0Q220 119 154.5 248.0Q89 377 89 552Q89 725 153.5 855.0Q218 985 336.5 1058.5Q455 1132 615 1132Q717 1132 809.5 1099.0Q902 1066 973.5 997.0Q1045 928 1085.5 821.5Q1126 715 1126 568V486H212V663H997L875 611Q875 705 846.0 776.5Q817 848 759.5 888.0Q702 928 616 928Q530 928 470.0 887.5Q410 847 378.5 779.5Q347 712 347 629V507Q347 401 383.0 328.0Q419 255 484.0 218.0Q549 181 635 181Q692 181 738.5 197.5Q785 214 819.0 246.5Q853 279 870 326L1109 277Q1082 187 1017.0 119.5Q952 52 854.5 14.5Q757 -23 632 -23Z", x: 1232.94 },
  { d: "M450 -23Q344 -23 259.0 15.5Q174 54 125.0 129.0Q76 204 76 314Q76 409 111.5 471.0Q147 533 207.5 570.0Q268 607 344.0 626.0Q420 645 502 653Q599 664 660.0 672.0Q721 680 749.5 698.0Q778 716 778 754V759Q778 814 756.0 852.5Q734 891 690.5 911.5Q647 932 583 932Q518 932 470.5 912.0Q423 892 393.0 860.0Q363 828 349 791L108 840Q141 939 210.0 1003.5Q279 1068 374.5 1100.0Q470 1132 582 1132Q661 1132 741.5 1113.5Q822 1095 889.0 1051.0Q956 1007 997.0 933.0Q1038 859 1038 747V0H789V154H779Q754 107 710.5 66.5Q667 26 602.5 1.5Q538 -23 450 -23ZM517 170Q598 170 656.5 202.0Q715 234 747.5 286.5Q780 339 780 401V533Q767 523 736.5 514.0Q706 505 668.5 498.0Q631 491 594.5 486.0Q558 481 533 478Q475 470 428.0 452.0Q381 434 354.5 401.5Q328 369 328 317Q328 269 352.5 236.5Q377 204 419.5 187.0Q462 170 517 170Z", x: 2398.89 },
  { d: "M376 352V667H417L820 1118H1125L631 567H577ZM138 0V1490H398V0ZM839 0 473 509 649 693 1151 0Z", x: 3529.83 }
];
var LAB_GLYPHS = [
  { d: "M197 0V1490H340V127H1048V0Z", x: 4650.78 },
  { d: "M465 -25Q363 -25 279.5 14.0Q196 53 146.5 129.0Q97 205 97 313Q97 396 128.0 452.5Q159 509 217.0 545.5Q275 582 353.5 603.0Q432 624 527 636Q620 648 685.0 656.5Q750 665 784.5 684.0Q819 703 819 745V771Q819 846 788.5 900.0Q758 954 699.5 983.0Q641 1012 557 1012Q478 1012 418.0 987.5Q358 963 318.5 923.5Q279 884 259 837L129 881Q166 972 233.0 1027.0Q300 1082 384.0 1107.5Q468 1133 554 1133Q620 1133 690.0 1115.5Q760 1098 820.0 1056.5Q880 1015 917.0 942.5Q954 870 954 759V0H821V177H811Q787 126 740.0 79.5Q693 33 624.5 4.0Q556 -25 465 -25ZM485 96Q587 96 662.0 141.0Q737 186 778.0 262.0Q819 338 819 429V588Q804 574 770.0 563.0Q736 552 692.5 544.0Q649 536 605.0 530.0Q561 524 528 520Q435 509 368.5 484.0Q302 459 267.5 416.0Q233 373 233 307Q233 240 266.0 193.0Q299 146 356.0 121.0Q413 96 485 96Z", x: 5761.72 },
  { d: "M661 -24Q561 -24 492.5 12.5Q424 49 382.5 103.0Q341 157 318 209H303V0H171V1490H307V903H318Q340 954 381.5 1007.0Q423 1060 490.5 1096.5Q558 1133 661 1133Q798 1133 901.0 1061.0Q1004 989 1062.0 859.0Q1120 729 1120 556Q1120 382 1062.5 251.5Q1005 121 902.0 48.5Q799 -24 661 -24ZM643 99Q753 99 828.5 160.0Q904 221 943.5 325.0Q983 429 983 557Q983 685 944.0 787.5Q905 890 829.0 950.0Q753 1010 643 1010Q535 1010 459.5 952.0Q384 894 344.5 792.0Q305 690 305 557Q305 424 345.0 320.5Q385 217 460.5 158.0Q536 99 643 99Z", x: 6841.66 }
];

// src/components/Logo/Logo.tsx
import { Fragment, jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var WORDMARK_HEIGHT_RATIO = 0.75 * (WORDMARK_VIEWBOX_HEIGHT / WORDMARK_UNITS_PER_EM);
var Logo = React8.forwardRef(
  ({ variant = "lockup-light", height = 30 }, ref) => {
    const showText = variant === "lockup-light" || variant === "lockup-dark" || variant === "lockup-mono";
    const onDarkText = variant === "lockup-dark";
    const mono = variant === "lockup-mono" || variant === "mark-mono";
    const paper = variant === "mark-paper";
    const onDarkShadow = variant === "lockup-dark" || variant === "mark-paper";
    const strokeLeft = paper ? "var(--plu-color-paper)" : mono ? "var(--plu-color-ink)" : "url(#c-left)";
    const strokeRight = paper ? "var(--plu-color-paper)" : mono ? "var(--plu-color-ink)" : "url(#c-right)";
    const wrapperStyle = {
      "--logo-height": `${height}px`,
      "--wordmark-height": `${height * WORDMARK_HEIGHT_RATIO}px`
    };
    return /* @__PURE__ */ jsxs4("div", { ref, className: Logo_default.wrapper, style: wrapperStyle, children: [
      /* @__PURE__ */ jsx6("div", { className: Logo_default.iconWrap, children: /* @__PURE__ */ jsxs4(
        "svg",
        {
          viewBox: "0 0 32 32",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
          className: Logo_default.svg,
          children: [
            /* @__PURE__ */ jsxs4("defs", { children: [
              /* @__PURE__ */ jsxs4(
                "linearGradient",
                {
                  id: "c-left",
                  x1: "6",
                  y1: "24",
                  x2: "16",
                  y2: "6",
                  gradientUnits: "userSpaceOnUse",
                  children: [
                    /* @__PURE__ */ jsx6("stop", { offset: "0%", stopColor: "var(--plu-color-teal-deep)" }),
                    /* @__PURE__ */ jsx6("stop", { offset: "100%", stopColor: "var(--plu-color-teal)" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs4(
                "linearGradient",
                {
                  id: "c-right",
                  x1: "16",
                  y1: "6",
                  x2: "26",
                  y2: "24",
                  gradientUnits: "userSpaceOnUse",
                  children: [
                    /* @__PURE__ */ jsx6("stop", { offset: "0%", stopColor: "var(--plu-color-teal)" }),
                    /* @__PURE__ */ jsx6("stop", { offset: "100%", stopColor: "var(--plu-color-spring)" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx6(
                "filter",
                {
                  id: "c-shadow",
                  x: "-10",
                  y: "-10",
                  width: "52",
                  height: "52",
                  filterUnits: "userSpaceOnUse",
                  children: /* @__PURE__ */ jsx6(
                    "feDropShadow",
                    {
                      dx: "0",
                      dy: "1.5",
                      stdDeviation: "1.5",
                      floodColor: "#000",
                      floodOpacity: onDarkShadow ? "0.25" : "0.1"
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ jsxs4("g", { strokeWidth: "6.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsx6(
                "path",
                {
                  d: "M 6 24 Q 13 19 16 6",
                  stroke: strokeLeft,
                  filter: "url(#c-shadow)"
                }
              ),
              /* @__PURE__ */ jsx6(
                "path",
                {
                  d: "M 16 6 Q 19 19 26 24",
                  stroke: strokeRight,
                  filter: "url(#c-shadow)"
                }
              )
            ] })
          ]
        }
      ) }),
      showText && /* @__PURE__ */ jsxs4(Fragment, { children: [
        /* @__PURE__ */ jsx6(
          "svg",
          {
            viewBox: `0 0 ${WORDMARK_VIEWBOX_WIDTH} ${WORDMARK_VIEWBOX_HEIGHT}`,
            className: Logo_default.wordmark,
            "aria-hidden": "true",
            focusable: "false",
            children: /* @__PURE__ */ jsxs4("g", { transform: `translate(0 ${WORDMARK_ASCENDER}) scale(1 -1)`, children: [
              /* @__PURE__ */ jsx6("g", { className: cx(Logo_default.peak, onDarkText && Logo_default.peakLight), children: PEAK_GLYPHS.map((glyph) => /* @__PURE__ */ jsx6(
                "path",
                {
                  d: glyph.d,
                  transform: `translate(${glyph.x} 0)`
                },
                glyph.x
              )) }),
              /* @__PURE__ */ jsx6("g", { className: cx(Logo_default.lab, onDarkText && Logo_default.labLight), children: LAB_GLYPHS.map((glyph) => /* @__PURE__ */ jsx6(
                "path",
                {
                  d: glyph.d,
                  transform: `translate(${glyph.x} 0)`
                },
                glyph.x
              )) })
            ] })
          }
        ),
        /* @__PURE__ */ jsx6("span", { className: Logo_default.srOnly, children: "peakLab" })
      ] })
    ] });
  }
);
Logo.displayName = "Logo";
var Logo_default2 = Logo;

// src/components/Title/Title.tsx
import React9 from "react";

// src/components/Title/Title.module.css
var Title_default = {"base": "base__Title", "hero": "hero__Title", "subhero": "subhero__Title", "section": "section__Title", "subsection": "subsection__Title", "card": "card__Title", "subtitle": "subtitle__Title", "item": "item__Title", "micro": "micro__Title", "none": "none__Title", "pretty": "pretty__Title"};

// src/components/Title/Title.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
var Title = React9.forwardRef(
  ({ as: Component = "h2", variant, wrap, padding, className, style, children, ...props }, ref) => {
    const variants2 = {
      hero: Title_default.hero,
      subhero: Title_default.subhero,
      section: Title_default.section,
      subsection: Title_default.subsection,
      card: Title_default.card,
      subtitle: Title_default.subtitle,
      item: Title_default.item,
      micro: Title_default.micro,
      none: Title_default.none
    };
    const hasCustomTextSize = className && /(^|\s)([a-z0-9]+:)?text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[[^\]]+\])($|\s)/.test(
      className
    );
    const activeVariant = variant || (hasCustomTextSize ? "none" : "section");
    return /* @__PURE__ */ jsx7(
      Component,
      {
        ref,
        className: cx(Title_default.base, variants2[activeVariant], wrap === "pretty" && Title_default.pretty, className),
        style: { ...resolvePadding(padding), ...style },
        ...props,
        children
      }
    );
  }
);
Title.displayName = "Title";
var Title_default2 = Title;

// src/components/Link/Link.tsx
import React10 from "react";

// src/components/Link/Link.module.css
var Link_default = {"link": "link__Link", "default": "default__Link", "gradient": "gradient__Link", "nav": "nav__Link", "footer": "footer__Link"};

// src/components/Link/Link.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
var Link = React10.forwardRef(
  ({ variant = "default", className, children, ...props }, ref) => {
    return /* @__PURE__ */ jsx8(
      "a",
      {
        ref,
        className: cx(Link_default.link, Link_default[variant], className),
        ...props,
        children
      }
    );
  }
);
Link.displayName = "Link";
var Link_default2 = Link;

// src/components/Form/Form.tsx
import React11, { createContext, useContext, useState as useState3 } from "react";

// src/components/Form/Form.module.css
var Form_default = {"form": "form__Form", "field": "field__Form", "label": "label__Form", "required": "required__Form", "message": "message__Form"};

// src/components/Form/Form.tsx
import { jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
var FormContext = createContext(void 0);
function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a Form");
  }
  return context;
}
var FormComponent = React11.forwardRef(
  ({ className, children, errors: externalErrors, onErrorsChange, ...props }, ref) => {
    const [internalErrors, setInternalErrors] = useState3({});
    const errors = externalErrors !== void 0 ? externalErrors : internalErrors;
    const setErrors = onErrorsChange !== void 0 ? onErrorsChange : setInternalErrors;
    return /* @__PURE__ */ jsx9(FormContext.Provider, { value: { errors, setErrors }, children: /* @__PURE__ */ jsx9("form", { ref, className: cx(Form_default.form, className), ...props, children }) });
  }
);
FormComponent.displayName = "Form";
var FormField = React11.forwardRef(
  ({ name, className, children, ...props }, ref) => {
    return /* @__PURE__ */ jsx9(
      "div",
      {
        ref,
        className: cx(Form_default.field, className),
        "data-field-name": name,
        ...props,
        children
      }
    );
  }
);
FormField.displayName = "FormField";
var FormLabel = React11.forwardRef(
  ({ className, children, required, ...props }, ref) => {
    return /* @__PURE__ */ jsxs5("label", { ref, className: cx(Form_default.label, className), ...props, children: [
      children,
      required && /* @__PURE__ */ jsx9("span", { className: Form_default.required, children: "*" })
    ] });
  }
);
FormLabel.displayName = "FormLabel";
var FormMessage = React11.forwardRef(
  ({ name, className, ...props }, ref) => {
    const { errors } = useFormContext();
    const error = errors[name];
    if (!error) return null;
    return /* @__PURE__ */ jsx9(
      Text,
      {
        ref,
        as: "p",
        variant: "small",
        className: cx(Form_default.message, className),
        ...props,
        children: error
      }
    );
  }
);
FormMessage.displayName = "FormMessage";
var Form = Object.assign(FormComponent, {
  Field: FormField,
  Label: FormLabel,
  Message: FormMessage
});
var Form_default2 = Form;

// src/components/Accordion/Accordion.tsx
import React12, { useState as useState4 } from "react";
import { motion as motion5, AnimatePresence as AnimatePresence2 } from "framer-motion";
import { ChevronDown } from "lucide-react";

// src/components/Accordion/Accordion.module.css
var Accordion_default = {"container": "container__Accordion", "item": "item__Accordion", "header": "header__Accordion", "title": "title__Accordion", "chevron": "chevron__Accordion", "contentOuter": "contentOuter__Accordion", "contentInner": "contentInner__Accordion", "demoWidth": "demoWidth__Accordion"};

// src/components/Accordion/Accordion.tsx
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
var Accordion = React12.forwardRef(
  ({ items, allowMultiple = false, defaultExpanded = [], className }, ref) => {
    const [expandedIds, setExpandedIds] = useState4(
      new Set(defaultExpanded)
    );
    const toggleItem = (id) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(id);
        }
        return next;
      });
    };
    const handleKeyDown = (e, id) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleItem(id);
      }
    };
    return /* @__PURE__ */ jsx10("div", { ref, className: cx(Accordion_default.container, className), children: items.map((item) => {
      const isExpanded = expandedIds.has(item.id);
      return /* @__PURE__ */ jsxs6("div", { className: Accordion_default.item, children: [
        /* @__PURE__ */ jsxs6(
          "button",
          {
            type: "button",
            className: Accordion_default.header,
            onClick: () => toggleItem(item.id),
            onKeyDown: (e) => handleKeyDown(e, item.id),
            "aria-expanded": isExpanded,
            "aria-controls": `accordion-content-${item.id}`,
            id: `accordion-header-${item.id}`,
            children: [
              /* @__PURE__ */ jsx10(Text, { as: "span", variant: "body", className: Accordion_default.title, children: item.title }),
              /* @__PURE__ */ jsx10(
                motion5.div,
                {
                  animate: { rotate: isExpanded ? 180 : 0 },
                  transition: controlTransition,
                  className: Accordion_default.chevron,
                  children: /* @__PURE__ */ jsx10(ChevronDown, { size: 20 })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx10(AnimatePresence2, { initial: false, children: isExpanded && /* @__PURE__ */ jsx10(
          motion5.div,
          {
            id: `accordion-content-${item.id}`,
            role: "region",
            "aria-labelledby": `accordion-header-${item.id}`,
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: disclosureTransition,
            className: Accordion_default.contentOuter,
            children: /* @__PURE__ */ jsx10("div", { className: Accordion_default.contentInner, children: item.content })
          }
        ) })
      ] }, item.id);
    }) });
  }
);
Accordion.displayName = "Accordion";
var Accordion_default2 = Accordion;

// src/components/Alert/Alert.tsx
import React13 from "react";
import { motion as motion6, AnimatePresence as AnimatePresence3 } from "framer-motion";

// src/components/Alert/Alert.module.css
var Alert_default = {"alert": "alert__Alert", "info": "info__Alert", "success": "success__Alert", "warning": "warning__Alert", "error": "error__Alert", "infoIcon": "infoIcon__Alert", "successIcon": "successIcon__Alert", "warningIcon": "warningIcon__Alert", "errorIcon": "errorIcon__Alert", "inner": "inner__Alert", "flex1": "flex1__Alert", "title": "title__Alert", "body": "body__Alert", "closeBtn": "closeBtn__Alert", "icon": "icon__Alert", "srOnly": "srOnly__Alert"};

// src/components/Alert/Alert.tsx
import { jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
var variantClass = {
  info: Alert_default.info,
  success: Alert_default.success,
  warning: Alert_default.warning,
  error: Alert_default.error
};
var iconClass = {
  info: Alert_default.infoIcon,
  success: Alert_default.successIcon,
  warning: Alert_default.warningIcon,
  error: Alert_default.errorIcon
};
var Alert = React13.forwardRef(
  ({
    title,
    children,
    variant = "info",
    onClose,
    isOpen = true,
    className = "",
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsx11(AnimatePresence3, { children: isOpen && /* @__PURE__ */ jsx11(
      motion6.div,
      {
        ref,
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: controlTransition,
        className: cx(Alert_default.alert, variantClass[variant], className),
        role: "alert",
        ...props,
        children: /* @__PURE__ */ jsxs7("div", { className: Alert_default.inner, children: [
          /* @__PURE__ */ jsxs7("div", { className: Alert_default.flex1, children: [
            title && /* @__PURE__ */ jsx11(
              Title,
              {
                as: "h3",
                variant: "none",
                className: cx(Alert_default.title, iconClass[variant]),
                children: title
              }
            ),
            /* @__PURE__ */ jsx11("div", { className: Alert_default.body, children })
          ] }),
          onClose && /* @__PURE__ */ jsxs7(
            "button",
            {
              type: "button",
              className: cx(Alert_default.closeBtn, iconClass[variant]),
              onClick: onClose,
              "aria-label": "Close alert",
              children: [
                /* @__PURE__ */ jsx11("span", { className: Alert_default.srOnly, children: "Close" }),
                /* @__PURE__ */ jsx11(
                  "svg",
                  {
                    className: Alert_default.icon,
                    fill: "currentColor",
                    viewBox: "0 0 20 20",
                    children: /* @__PURE__ */ jsx11(
                      "path",
                      {
                        fillRule: "evenodd",
                        d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
                        clipRule: "evenodd"
                      }
                    )
                  }
                )
              ]
            }
          )
        ] })
      }
    ) });
  }
);
Alert.displayName = "Alert";

// src/components/Avatar/Avatar.tsx
import React14, { useState as useState5 } from "react";
import { motion as motion7 } from "framer-motion";

// src/components/Avatar/Avatar.module.css
var Avatar_default = {"wrapper": "wrapper__Avatar", "avatar": "avatar__Avatar", "sm": "sm__Avatar", "md": "md__Avatar", "lg": "lg__Avatar", "xl": "xl__Avatar", "image": "image__Avatar", "statusDot": "statusDot__Avatar", "online": "online__Avatar", "offline": "offline__Avatar", "busy": "busy__Avatar", "away": "away__Avatar", "statusSm": "statusSm__Avatar", "statusMd": "statusMd__Avatar", "statusLg": "statusLg__Avatar", "statusXl": "statusXl__Avatar"};

// src/components/Avatar/Avatar.tsx
import { jsx as jsx12, jsxs as jsxs8 } from "react/jsx-runtime";
var sizeStyles = {
  sm: Avatar_default.sm,
  md: Avatar_default.md,
  lg: Avatar_default.lg,
  xl: Avatar_default.xl
};
var statusStyles = {
  online: Avatar_default.online,
  offline: Avatar_default.offline,
  busy: Avatar_default.busy,
  away: Avatar_default.away
};
var statusSizeStyles = {
  sm: Avatar_default.statusSm,
  md: Avatar_default.statusMd,
  lg: Avatar_default.statusLg,
  xl: Avatar_default.statusXl
};
var Avatar = React14.forwardRef(
  ({ src, alt, fallback, size = "md", status, className = "", ...props }, ref) => {
    const [hasError, setHasError] = useState5(false);
    const sStyle = sizeStyles[size];
    return /* @__PURE__ */ jsxs8("div", { className: Avatar_default.wrapper, children: [
      /* @__PURE__ */ jsx12(
        motion7.div,
        {
          ref,
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: controlTransition,
          className: cx(Avatar_default.avatar, sStyle, className),
          ...props,
          children: src && !hasError ? /* @__PURE__ */ jsx12(
            "img",
            {
              src,
              alt: alt || fallback,
              onError: () => setHasError(true),
              className: Avatar_default.image
            }
          ) : /* @__PURE__ */ jsx12("span", { children: fallback })
        }
      ),
      status && /* @__PURE__ */ jsx12(
        "span",
        {
          className: cx(
            Avatar_default.statusDot,
            statusStyles[status],
            statusSizeStyles[size]
          ),
          title: status
        }
      )
    ] });
  }
);
Avatar.displayName = "Avatar";

// src/components/Badge/Badge.tsx
import React15 from "react";
import { motion as motion8 } from "framer-motion";

// src/components/Badge/Badge.module.css
var Badge_default = {"badge": "badge__Badge", "dot": "dot__Badge", "dotAccent2": "dotAccent2__Badge", "sm": "sm__Badge", "md": "md__Badge", "lg": "lg__Badge", "solidPrimary": "solidPrimary__Badge", "solidSecondary": "solidSecondary__Badge", "solidSuccess": "solidSuccess__Badge", "solidWarning": "solidWarning__Badge", "solidError": "solidError__Badge", "solidGray": "solidGray__Badge", "outlinePrimary": "outlinePrimary__Badge", "outlineSecondary": "outlineSecondary__Badge", "outlineSuccess": "outlineSuccess__Badge", "outlineWarning": "outlineWarning__Badge", "outlineError": "outlineError__Badge", "outlineGray": "outlineGray__Badge", "subtlePrimary": "subtlePrimary__Badge", "subtleSecondary": "subtleSecondary__Badge", "subtleSuccess": "subtleSuccess__Badge", "subtleWarning": "subtleWarning__Badge", "subtleError": "subtleError__Badge", "subtleGray": "subtleGray__Badge", "tone": "tone__Badge", "withDot": "withDot__Badge", "neutral": "neutral__Badge", "accent": "accent__Badge", "accent2": "accent2__Badge", "inverse": "inverse__Badge"};

// src/components/Badge/Badge.tsx
import { jsx as jsx13, jsxs as jsxs9 } from "react/jsx-runtime";
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
var Badge = React15.forwardRef(
  ({
    variant = "solid",
    colorScheme = "gray",
    size = "md",
    dot,
    tone,
    className,
    children,
    ...props
  }, ref) => {
    const colorVariantKey = `${variant}${capitalize(colorScheme)}`;
    const resolvedDot = dot ?? (tone ? true : false);
    return /* @__PURE__ */ jsxs9(
      motion8.span,
      {
        ref,
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: revealTransition,
        className: cx(
          Badge_default.badge,
          tone ? cx(Badge_default.tone, Badge_default[tone]) : cx(Badge_default[colorVariantKey], Badge_default[size]),
          resolvedDot && Badge_default.withDot,
          className
        ),
        ...props,
        children: [
          resolvedDot && /* @__PURE__ */ jsx13(
            "span",
            {
              className: cx(Badge_default.dot, tone === "accent2" && Badge_default.dotAccent2),
              "aria-hidden": "true"
            }
          ),
          children
        ]
      }
    );
  }
);
Badge.displayName = "Badge";

// src/components/Breadcrumbs/Breadcrumbs.tsx
import React16 from "react";
import { ChevronRight, Home } from "lucide-react";

// src/components/Breadcrumbs/Breadcrumbs.module.css
var Breadcrumbs_default = {"nav": "nav__Breadcrumbs", "list": "list__Breadcrumbs", "item": "item__Breadcrumbs", "icon": "icon__Breadcrumbs", "current": "current__Breadcrumbs", "link": "link__Breadcrumbs", "separator": "separator__Breadcrumbs"};

// src/components/Breadcrumbs/Breadcrumbs.tsx
import { jsx as jsx14, jsxs as jsxs10 } from "react/jsx-runtime";
var Breadcrumbs = React16.forwardRef(
  ({
    items,
    separator = /* @__PURE__ */ jsx14(ChevronRight, { size: 16, className: Breadcrumbs_default.icon }),
    homeIcon = true
  }, ref) => {
    return /* @__PURE__ */ jsx14("nav", { ref, "aria-label": "Breadcrumb", className: Breadcrumbs_default.nav, children: /* @__PURE__ */ jsx14("ol", { className: Breadcrumbs_default.list, children: items.map((item, index) => {
      const isLast = index === items.length - 1;
      const isFirst = index === 0;
      return /* @__PURE__ */ jsxs10("li", { className: Breadcrumbs_default.item, children: [
        isFirst && homeIcon && !item.icon && /* @__PURE__ */ jsx14(Home, { size: 16, className: Breadcrumbs_default.icon }),
        item.icon && /* @__PURE__ */ jsx14("span", { className: Breadcrumbs_default.icon, children: item.icon }),
        isLast || !item.href ? /* @__PURE__ */ jsx14(
          "span",
          {
            className: Breadcrumbs_default.current,
            "aria-current": isLast ? "page" : void 0,
            children: item.label
          }
        ) : /* @__PURE__ */ jsx14("a", { href: item.href, className: Breadcrumbs_default.link, children: item.label }),
        !isLast && /* @__PURE__ */ jsx14("span", { "aria-hidden": "true", className: Breadcrumbs_default.separator, children: separator })
      ] }, index);
    }) }) });
  }
);
Breadcrumbs.displayName = "Breadcrumbs";

// src/components/Card/Card.tsx
import React17 from "react";
import { motion as motion9 } from "framer-motion";

// src/components/Card/Card.module.css
var Card_default = {"card": "card__Card", "interactive": "interactive__Card", "default": "default__Card", "sunken": "sunken__Card", "accent": "accent__Card", "inverse": "inverse__Card", "header": "header__Card", "title": "title__Card", "description": "description__Card", "content": "content__Card", "footer": "footer__Card", "demoContent": "demoContent__Card", "demoText": "demoText__Card", "demoFooterBetween": "demoFooterBetween__Card", "demoButtonSecondary": "demoButtonSecondary__Card", "demoButtonPrimary": "demoButtonPrimary__Card"};

// src/components/Card/Card.tsx
import { jsx as jsx15 } from "react/jsx-runtime";
var Card = React17.forwardRef(
  ({
    className = "",
    tone = "default",
    padding = 28,
    radius,
    interactive = false,
    style,
    ...props
  }, ref) => /* @__PURE__ */ jsx15(
    motion9.div,
    {
      ref,
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: revealTransition,
      className: cx(
        Card_default.card,
        Card_default[tone],
        interactive && Card_default.interactive,
        className
      ),
      style: {
        padding: typeof padding === "number" ? `${padding}px` : padding,
        ...radius ? { borderRadius: radius } : {},
        ...style
      },
      ...props
    }
  )
);
Card.displayName = "Card";
var CardHeader = React17.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx15("div", { ref, className: cx(Card_default.header, className), ...props }));
CardHeader.displayName = "CardHeader";
var CardTitle = React17.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx15(
  Title,
  {
    ref,
    as: "h3",
    variant: "card",
    className: cx(Card_default.title, className),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React17.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx15(
  Text,
  {
    ref,
    as: "p",
    className: cx(Card_default.description, className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React17.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx15("div", { ref, className: cx(Card_default.content, className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React17.forwardRef(({ className = "", ...props }, ref) => /* @__PURE__ */ jsx15("div", { ref, className: cx(Card_default.footer, className), ...props }));
CardFooter.displayName = "CardFooter";

// src/components/Checkbox/Checkbox.tsx
import React18 from "react";
import { motion as motion10 } from "framer-motion";

// src/components/Checkbox/Checkbox.module.css
var Checkbox_default = {"wrapper": "wrapper__Checkbox", "wrapperDisabled": "wrapperDisabled__Checkbox", "boxContainer": "boxContainer__Checkbox", "hiddenInput": "hiddenInput__Checkbox", "box": "box__Checkbox", "boxChecked": "boxChecked__Checkbox", "boxDisabled": "boxDisabled__Checkbox", "checkIcon": "checkIcon__Checkbox", "textContainer": "textContainer__Checkbox", "label": "label__Checkbox", "labelDisabled": "labelDisabled__Checkbox", "description": "description__Checkbox", "descriptionDisabled": "descriptionDisabled__Checkbox"};

// src/components/Checkbox/Checkbox.tsx
import { jsx as jsx16, jsxs as jsxs11 } from "react/jsx-runtime";
var Checkbox = React18.forwardRef(
  ({ checked, onChange, label, description, className, id, disabled, ...rest }, ref) => {
    const defaultId = React18.useId();
    const checkboxId = id || defaultId;
    return /* @__PURE__ */ jsxs11(
      "label",
      {
        htmlFor: checkboxId,
        className: cx(
          Checkbox_default.wrapper,
          disabled && Checkbox_default.wrapperDisabled,
          className
        ),
        children: [
          /* @__PURE__ */ jsxs11("span", { className: Checkbox_default.boxContainer, children: [
            /* @__PURE__ */ jsx16(
              "input",
              {
                ...rest,
                ref,
                type: "checkbox",
                id: checkboxId,
                checked,
                disabled,
                onChange: (e) => onChange(e.target.checked),
                className: Checkbox_default.hiddenInput
              }
            ),
            /* @__PURE__ */ jsx16(
              "span",
              {
                "aria-hidden": "true",
                className: cx(
                  Checkbox_default.box,
                  checked && Checkbox_default.boxChecked,
                  disabled && Checkbox_default.boxDisabled
                ),
                children: /* @__PURE__ */ jsx16(
                  motion10.span,
                  {
                    className: Checkbox_default.checkIcon,
                    initial: false,
                    animate: { scale: checked ? 1 : 0, opacity: checked ? 1 : 0 },
                    transition: pressTransition,
                    children: "\u2713"
                  }
                )
              }
            )
          ] }),
          (label || description) && /* @__PURE__ */ jsxs11("span", { className: Checkbox_default.textContainer, children: [
            label && /* @__PURE__ */ jsx16(
              Text,
              {
                as: "span",
                className: cx(Checkbox_default.label, disabled && Checkbox_default.labelDisabled),
                children: label
              }
            ),
            description && /* @__PURE__ */ jsx16(
              Text,
              {
                as: "span",
                variant: "small",
                className: cx(
                  Checkbox_default.description,
                  disabled && Checkbox_default.descriptionDisabled
                ),
                children: description
              }
            )
          ] })
        ]
      }
    );
  }
);
Checkbox.displayName = "Checkbox";
var Checkbox_default2 = Checkbox;

// src/components/Dialog/Dialog.tsx
import React19, { useEffect as useEffect3, useRef as useRef3 } from "react";
import { motion as motion11, AnimatePresence as AnimatePresence4 } from "framer-motion";
import { X } from "lucide-react";

// src/components/Dialog/Dialog.module.css
var Dialog_default = {"overlayWrapper": "overlayWrapper__Dialog", "overlay": "overlay__Dialog", "panel": "panel__Dialog", "header": "header__Dialog", "description": "description__Dialog", "closeButton": "closeButton__Dialog", "body": "body__Dialog"};

// src/components/Dialog/Dialog.tsx
import { jsx as jsx17, jsxs as jsxs12 } from "react/jsx-runtime";
var Dialog = React19.forwardRef(
  ({ isOpen, onClose, title, description, children, className }, ref) => {
    const overlayRef = useRef3(null);
    useEffect3(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };
      if (isOpen) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
      }
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, onClose]);
    const handleOverlayClick = (e) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    };
    return /* @__PURE__ */ jsx17(AnimatePresence4, { children: isOpen && /* @__PURE__ */ jsxs12("div", { className: Dialog_default.overlayWrapper, children: [
      /* @__PURE__ */ jsx17(
        motion11.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: controlTransition,
          ref: overlayRef,
          onClick: handleOverlayClick,
          className: Dialog_default.overlay,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxs12(
        motion11.div,
        {
          ref,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": title ? "dialog-title" : void 0,
          "aria-describedby": description ? "dialog-description" : void 0,
          initial: { opacity: 0, scale: 0.98, y: 12 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.98, y: 12 },
          transition: disclosureTransition,
          className: cx(Dialog_default.panel, className),
          children: [
            /* @__PURE__ */ jsxs12("div", { className: Dialog_default.header, children: [
              /* @__PURE__ */ jsxs12("div", { children: [
                title && /* @__PURE__ */ jsx17(Title, { as: "h2", variant: "card", id: "dialog-title", children: title }),
                description && /* @__PURE__ */ jsx17(
                  Text,
                  {
                    as: "p",
                    variant: "small",
                    id: "dialog-description",
                    className: Dialog_default.description,
                    children: description
                  }
                )
              ] }),
              /* @__PURE__ */ jsx17(
                "button",
                {
                  onClick: onClose,
                  className: Dialog_default.closeButton,
                  "aria-label": "Close dialog",
                  children: /* @__PURE__ */ jsx17(X, { size: 20 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx17("div", { className: Dialog_default.body, children })
          ]
        }
      )
    ] }) });
  }
);
Dialog.displayName = "Dialog";
var Dialog_default2 = Dialog;

// src/components/Drawer/Drawer.tsx
import React20, { useEffect as useEffect4, useState as useState6, useRef as useRef4 } from "react";
import { createPortal } from "react-dom";
import { motion as motion12, AnimatePresence as AnimatePresence5 } from "framer-motion";
import { X as X2 } from "lucide-react";

// src/components/Drawer/Drawer.module.css
var Drawer_default = {"overlay": "overlay__Drawer", "backdrop": "backdrop__Drawer", "panel": "panel__Drawer", "fullHeight": "fullHeight__Drawer", "fullWidth": "fullWidth__Drawer", "widthSm": "widthSm__Drawer", "widthMd": "widthMd__Drawer", "widthLg": "widthLg__Drawer", "widthXl": "widthXl__Drawer", "widthFull": "widthFull__Drawer", "heightSm": "heightSm__Drawer", "heightMd": "heightMd__Drawer", "heightLg": "heightLg__Drawer", "heightXl": "heightXl__Drawer", "heightFull": "heightFull__Drawer", "header": "header__Drawer", "title": "title__Drawer", "closeButton": "closeButton__Drawer", "content": "content__Drawer", "demoTrigger": "demoTrigger__Drawer", "demoText": "demoText__Drawer"};

// src/components/Drawer/Drawer.tsx
import { jsx as jsx18, jsxs as jsxs13 } from "react/jsx-runtime";
var widthClasses = {
  sm: "widthSm",
  md: "widthMd",
  lg: "widthLg",
  xl: "widthXl",
  full: "widthFull"
};
var heightClasses = {
  sm: "heightSm",
  md: "heightMd",
  lg: "heightLg",
  xl: "heightXl",
  full: "heightFull"
};
var variants = {
  left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
  right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
  bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
};
var Drawer = React20.forwardRef(
  ({ isOpen, onClose, title, children, position = "right", size = "md" }, forwardedRef) => {
    const [mounted, setMounted] = useState6(false);
    const drawerRef = useRef4(null);
    useEffect4(() => {
      setMounted(true);
    }, []);
    useEffect4(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape") onClose();
      };
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, onClose]);
    if (!mounted) return null;
    const isHorizontal = position === "left" || position === "right";
    const drawerContent = /* @__PURE__ */ jsx18(AnimatePresence5, { children: isOpen && /* @__PURE__ */ jsxs13(
      "div",
      {
        className: Drawer_default.overlay,
        style: {
          justifyContent: position === "left" ? "flex-start" : position === "right" ? "flex-end" : "center",
          alignItems: position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "stretch"
        },
        children: [
          /* @__PURE__ */ jsx18(
            motion12.div,
            {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: controlTransition,
              onClick: onClose,
              className: Drawer_default.backdrop,
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxs13(
            motion12.div,
            {
              ref: (node) => {
                drawerRef.current = node;
                if (typeof forwardedRef === "function") forwardedRef(node);
                else if (forwardedRef) forwardedRef.current = node;
              },
              role: "dialog",
              "aria-modal": "true",
              "aria-labelledby": title ? "drawer-title" : void 0,
              initial: variants[position].initial,
              animate: variants[position].animate,
              exit: variants[position].exit,
              transition: disclosureTransition,
              className: cx(
                Drawer_default.panel,
                isHorizontal ? Drawer_default[widthClasses[size]] : Drawer_default.fullWidth,
                isHorizontal ? Drawer_default.fullHeight : Drawer_default[heightClasses[size]]
              ),
              children: [
                /* @__PURE__ */ jsxs13("div", { className: Drawer_default.header, children: [
                  title ? /* @__PURE__ */ jsx18(
                    Title,
                    {
                      as: "h2",
                      variant: "card",
                      id: "drawer-title",
                      className: Drawer_default.title,
                      children: title
                    }
                  ) : /* @__PURE__ */ jsx18("div", {}),
                  /* @__PURE__ */ jsx18(
                    "button",
                    {
                      onClick: onClose,
                      className: Drawer_default.closeButton,
                      "aria-label": "Close drawer",
                      children: /* @__PURE__ */ jsx18(X2, { size: 20 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx18("div", { className: Drawer_default.content, children })
              ]
            }
          )
        ]
      }
    ) });
    return createPortal(drawerContent, document.body);
  }
);
Drawer.displayName = "Drawer";

// src/components/DropdownMenu/DropdownMenu.tsx
import React21, { useState as useState7, useRef as useRef5, useEffect as useEffect5 } from "react";
import { motion as motion13, AnimatePresence as AnimatePresence6 } from "framer-motion";

// src/components/DropdownMenu/DropdownMenu.module.css
var DropdownMenu_default = {"container": "container__DropdownMenu", "triggerWrap": "triggerWrap__DropdownMenu", "menu": "menu__DropdownMenu", "alignLeft": "alignLeft__DropdownMenu", "alignRight": "alignRight__DropdownMenu", "alignCenter": "alignCenter__DropdownMenu", "itemsWrap": "itemsWrap__DropdownMenu", "divider": "divider__DropdownMenu", "item": "item__DropdownMenu", "itemEnabled": "itemEnabled__DropdownMenu", "itemDisabled": "itemDisabled__DropdownMenu", "itemIcon": "itemIcon__DropdownMenu", "itemIconDisabled": "itemIconDisabled__DropdownMenu", "demoTrigger": "demoTrigger__DropdownMenu", "demoDeleteLabel": "demoDeleteLabel__DropdownMenu"};

// src/components/DropdownMenu/DropdownMenu.tsx
import { jsx as jsx19, jsxs as jsxs14 } from "react/jsx-runtime";
var DropdownMenu = React21.forwardRef(
  ({ trigger, items, align = "left", className }, forwardedRef) => {
    const [isOpen, setIsOpen] = useState7(false);
    const containerRef = useRef5(null);
    const menuRef = useRef5(null);
    const toggleOpen = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);
    useEffect5(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
          closeMenu();
        }
      };
      const handleEscape = (event) => {
        if (event.key === "Escape" && isOpen) {
          closeMenu();
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);
    const handleKeyDown = (e, index) => {
      var _a;
      const actionableItems = Array.from(
        ((_a = menuRef.current) == null ? void 0 : _a.querySelectorAll('[role="menuitem"]')) || []
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = actionableItems[index + 1];
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = actionableItems[index - 1];
        if (prev) prev.focus();
      }
    };
    const alignmentClasses = {
      left: DropdownMenu_default.alignLeft,
      right: DropdownMenu_default.alignRight,
      center: DropdownMenu_default.alignCenter
    };
    return /* @__PURE__ */ jsxs14(
      "div",
      {
        className: DropdownMenu_default.container,
        ref: (node) => {
          containerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        },
        children: [
          /* @__PURE__ */ jsx19("div", { onClick: toggleOpen, className: DropdownMenu_default.triggerWrap, children: React21.isValidElement(trigger) ? React21.cloneElement(trigger, {
            "aria-haspopup": "true",
            "aria-expanded": isOpen
          }) : trigger }),
          /* @__PURE__ */ jsx19(AnimatePresence6, { children: isOpen && /* @__PURE__ */ jsx19(
            motion13.div,
            {
              ref: menuRef,
              initial: { opacity: 0, y: 10, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: 10, scale: 0.95 },
              transition: pressTransition,
              className: cx(DropdownMenu_default.menu, alignmentClasses[align], className),
              role: "menu",
              "aria-orientation": "vertical",
              tabIndex: -1,
              children: /* @__PURE__ */ jsx19("div", { className: DropdownMenu_default.itemsWrap, role: "none", children: items.map((item, index) => {
                if (item.divider) {
                  return /* @__PURE__ */ jsx19(
                    "div",
                    {
                      className: DropdownMenu_default.divider,
                      role: "none"
                    },
                    item.id
                  );
                }
                return /* @__PURE__ */ jsxs14(
                  "button",
                  {
                    role: "menuitem",
                    disabled: item.disabled,
                    onClick: () => {
                      var _a;
                      if (!item.disabled) {
                        (_a = item.onClick) == null ? void 0 : _a.call(item);
                        closeMenu();
                      }
                    },
                    onKeyDown: (e) => handleKeyDown(e, index),
                    className: cx(
                      DropdownMenu_default.item,
                      item.disabled ? DropdownMenu_default.itemDisabled : DropdownMenu_default.itemEnabled
                    ),
                    children: [
                      item.icon && /* @__PURE__ */ jsx19(
                        "span",
                        {
                          className: cx(
                            DropdownMenu_default.itemIcon,
                            item.disabled && DropdownMenu_default.itemIconDisabled
                          ),
                          children: item.icon
                        }
                      ),
                      item.label
                    ]
                  },
                  item.id
                );
              }) })
            }
          ) })
        ]
      }
    );
  }
);
DropdownMenu.displayName = "DropdownMenu";
var DropdownMenu_default2 = DropdownMenu;

// src/components/Input/Input.tsx
import React22, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

// src/components/Input/Input.module.css
var Input_default = {"wrapper": "wrapper__Input", "label": "label__Input", "relative": "relative__Input", "iconWrap": "iconWrap__Input", "input": "input__Input", "withIcon": "withIcon__Input", "error": "error__Input", "errorIconWrap": "errorIconWrap__Input", "errorIcon": "errorIcon__Input", "errorText": "errorText__Input"};

// src/components/Input/Input.tsx
import { jsx as jsx20, jsxs as jsxs15 } from "react/jsx-runtime";
var Input = forwardRef(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const defaultId = React22.useId();
    const inputId = id || defaultId;
    return /* @__PURE__ */ jsxs15("div", { className: cx(Input_default.wrapper, className), children: [
      label && /* @__PURE__ */ jsx20("label", { htmlFor: inputId, className: Input_default.label, children: label }),
      /* @__PURE__ */ jsxs15("div", { className: Input_default.relative, children: [
        icon && /* @__PURE__ */ jsx20("div", { className: Input_default.iconWrap, children: icon }),
        /* @__PURE__ */ jsx20(
          "input",
          {
            id: inputId,
            ref,
            className: cx(
              Input_default.input,
              icon && Input_default.withIcon,
              error && Input_default.error
            ),
            "aria-invalid": error ? "true" : "false",
            "aria-describedby": error ? `${inputId}-error` : void 0,
            ...props
          }
        ),
        error && /* @__PURE__ */ jsx20("div", { className: Input_default.errorIconWrap, children: /* @__PURE__ */ jsx20(AlertCircle, { className: Input_default.errorIcon, "aria-hidden": "true" }) })
      ] }),
      error && /* @__PURE__ */ jsx20(
        Text,
        {
          as: "p",
          variant: "small",
          className: Input_default.errorText,
          id: `${inputId}-error`,
          children: error
        }
      )
    ] });
  }
);
Input.displayName = "Input";
var Input_default2 = Input;

// src/components/Progress/Progress.tsx
import React23 from "react";
import { motion as motion14 } from "framer-motion";

// src/components/Progress/Progress.module.css
var Progress_default = {"progress": "progress__Progress", "labelRow": "labelRow__Progress", "labelText": "labelText__Progress", "track": "track__Progress", "fill": "fill__Progress", "sm": "sm__Progress", "md": "md__Progress", "lg": "lg__Progress", "primary": "primary__Progress", "secondary": "secondary__Progress", "success": "success__Progress", "warning": "warning__Progress", "error": "error__Progress"};

// src/components/Progress/Progress.tsx
import { jsx as jsx21, jsxs as jsxs16 } from "react/jsx-runtime";
var Progress = React23.forwardRef(
  ({
    value = 0,
    max = 100,
    colorScheme = "primary",
    size = "md",
    showLabel = false,
    className,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max(value / max * 100, 0), 100);
    return /* @__PURE__ */ jsxs16(
      motion14.div,
      {
        className: cx(Progress_default.progress, className),
        ref,
        ...props,
        children: [
          showLabel && /* @__PURE__ */ jsx21("div", { className: Progress_default.labelRow, children: /* @__PURE__ */ jsxs16(Text, { as: "span", variant: "small", className: Progress_default.labelText, children: [
            Math.round(percentage),
            "%"
          ] }) }),
          /* @__PURE__ */ jsx21("div", { className: cx(Progress_default.track, Progress_default[size]), children: /* @__PURE__ */ jsx21(
            motion14.div,
            {
              className: cx(Progress_default.fill, Progress_default[colorScheme]),
              initial: { width: 0 },
              animate: { width: `${percentage}%` },
              transition: { duration: 0.5, ease: "easeOut" }
            }
          ) })
        ]
      }
    );
  }
);
Progress.displayName = "Progress";

// src/components/RadioGroup/RadioGroup.tsx
import React24 from "react";
import { motion as motion15 } from "framer-motion";

// src/components/RadioGroup/RadioGroup.module.css
var RadioGroup_default = {"group": "group__RadioGroup", "vertical": "vertical__RadioGroup", "horizontal": "horizontal__RadioGroup", "option": "option__RadioGroup", "radioWrapper": "radioWrapper__RadioGroup", "radio": "radio__RadioGroup", "checked": "checked__RadioGroup", "unchecked": "unchecked__RadioGroup", "indicator": "indicator__RadioGroup", "srOnly": "srOnly__RadioGroup", "textWrap": "textWrap__RadioGroup", "label": "label__RadioGroup", "description": "description__RadioGroup"};

// src/components/RadioGroup/RadioGroup.tsx
import { jsx as jsx22, jsxs as jsxs17 } from "react/jsx-runtime";
var RadioGroup = React24.forwardRef(
  ({ options, value, onChange, name, className, orientation = "vertical" }, ref) => {
    const defaultName = React24.useId();
    const groupName = name || defaultName;
    return /* @__PURE__ */ jsx22(
      "div",
      {
        ref,
        role: "radiogroup",
        className: cx(
          RadioGroup_default.group,
          orientation === "vertical" ? RadioGroup_default.vertical : RadioGroup_default.horizontal,
          className
        ),
        children: options.map((option) => {
          const checked = value === option.value;
          const id = `${groupName}-${option.value}`;
          return /* @__PURE__ */ jsxs17("div", { className: RadioGroup_default.option, children: [
            /* @__PURE__ */ jsx22("div", { className: RadioGroup_default.radioWrapper, children: /* @__PURE__ */ jsxs17(
              "button",
              {
                type: "button",
                role: "radio",
                "aria-checked": checked,
                id,
                onClick: () => onChange(option.value),
                className: cx(
                  RadioGroup_default.radio,
                  checked ? RadioGroup_default.checked : RadioGroup_default.unchecked
                ),
                children: [
                  /* @__PURE__ */ jsx22("span", { className: RadioGroup_default.srOnly, children: option.label }),
                  checked && /* @__PURE__ */ jsx22(
                    motion15.div,
                    {
                      layoutId: `radio-indicator-${groupName}`,
                      className: RadioGroup_default.indicator,
                      initial: false,
                      transition: pressTransition
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs17("div", { className: RadioGroup_default.textWrap, children: [
              /* @__PURE__ */ jsx22(
                "label",
                {
                  htmlFor: id,
                  className: RadioGroup_default.label,
                  onClick: () => onChange(option.value),
                  children: option.label
                }
              ),
              option.description && /* @__PURE__ */ jsx22(Text, { as: "p", variant: "small", className: RadioGroup_default.description, children: option.description })
            ] })
          ] }, option.value);
        })
      }
    );
  }
);
RadioGroup.displayName = "RadioGroup";
var RadioGroup_default2 = RadioGroup;

// src/components/Skeleton/Skeleton.tsx
import React25 from "react";
import { motion as motion16 } from "framer-motion";

// src/components/Skeleton/Skeleton.module.css
var Skeleton_default = {"skeleton": "skeleton__Skeleton"};

// src/components/Skeleton/Skeleton.tsx
import { jsx as jsx23 } from "react/jsx-runtime";
var Skeleton = React25.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx23(
      motion16.div,
      {
        ref,
        initial: { opacity: 0.5 },
        animate: { opacity: 1 },
        transition: {
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1,
          ease: "easeInOut"
        },
        className: cx(Skeleton_default.skeleton, className),
        ...props
      }
    );
  }
);
Skeleton.displayName = "Skeleton";

// src/components/Slider/Slider.tsx
import React26, { useRef as useRef6, useState as useState8, useEffect as useEffect6, useCallback } from "react";
import { motion as motion17 } from "framer-motion";

// src/components/Slider/Slider.module.css
var Slider_default = {"wrapper": "wrapper__Slider", "labelRow": "labelRow__Slider", "value": "value__Slider", "trackWrapper": "trackWrapper__Slider", "trackBg": "trackBg__Slider", "trackFill": "trackFill__Slider", "thumb": "thumb__Slider"};

// src/components/Slider/Slider.tsx
import { jsx as jsx24, jsxs as jsxs18 } from "react/jsx-runtime";
var Slider = React26.forwardRef(
  ({ min = 0, max = 100, step = 1, value, onChange, className, label }, ref) => {
    const trackRef = useRef6(null);
    const [isDragging, setIsDragging] = useState8(false);
    const percentage = Math.max(
      0,
      Math.min(100, (value - min) / (max - min) * 100)
    );
    const handleUpdate = useCallback(
      (clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const newPercentage = x / rect.width;
        let newValue = min + newPercentage * (max - min);
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
      },
      [min, max, step, onChange]
    );
    const handlePointerDown = (e) => {
      e.preventDefault();
      setIsDragging(true);
      if (trackRef.current) {
        trackRef.current.focus();
      }
      handleUpdate(e.clientX);
    };
    useEffect6(() => {
      const handlePointerMove = (e) => {
        if (isDragging) {
          handleUpdate(e.clientX);
        }
      };
      const handlePointerUp = () => {
        setIsDragging(false);
      };
      if (isDragging) {
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      }
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }, [isDragging, handleUpdate]);
    const handleKeyDown = (e) => {
      let newValue;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        newValue = Math.min(max, value + step);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        newValue = Math.max(min, value - step);
      } else if (e.key === "Home") {
        newValue = min;
      } else if (e.key === "End") {
        newValue = max;
      } else {
        return;
      }
      e.preventDefault();
      onChange(newValue);
    };
    return /* @__PURE__ */ jsxs18("div", { ref, className: cx(Slider_default.wrapper, className), children: [
      label && /* @__PURE__ */ jsxs18("div", { className: Slider_default.labelRow, children: [
        /* @__PURE__ */ jsx24("label", { children: label }),
        /* @__PURE__ */ jsx24(Text, { as: "span", variant: "small", className: Slider_default.value, children: value })
      ] }),
      /* @__PURE__ */ jsxs18("div", { className: Slider_default.trackWrapper, onPointerDown: handlePointerDown, children: [
        /* @__PURE__ */ jsx24("div", { ref: trackRef, className: Slider_default.trackBg, children: /* @__PURE__ */ jsx24(
          motion17.div,
          {
            className: Slider_default.trackFill,
            style: { width: `${percentage}%` },
            layout: true,
            transition: pressTransition
          }
        ) }),
        /* @__PURE__ */ jsx24(
          motion17.div,
          {
            role: "slider",
            "aria-valuemin": min,
            "aria-valuemax": max,
            "aria-valuenow": value,
            "aria-label": label || "Slider",
            tabIndex: 0,
            onKeyDown: handleKeyDown,
            className: Slider_default.thumb,
            style: { left: `calc(${percentage}% - 10px)` }
          }
        )
      ] })
    ] });
  }
);
Slider.displayName = "Slider";
var Slider_default2 = Slider;

// src/components/Sidebar/Sidebar.tsx
import React27 from "react";
import { motion as motion18 } from "framer-motion";

// src/components/Sidebar/Sidebar.module.css
var Sidebar_default = {"aside": "aside__Sidebar", "header": "header__Sidebar", "footer": "footer__Sidebar", "nav": "nav__Sidebar", "navButton": "navButton__Sidebar", "navButtonActive": "navButtonActive__Sidebar", "navButtonInactive": "navButtonInactive__Sidebar", "indicator": "indicator__Sidebar", "icon": "icon__Sidebar", "drawerContent": "drawerContent__Sidebar", "demoOpenButton": "demoOpenButton__Sidebar"};

// src/components/Sidebar/Sidebar.tsx
import { Fragment as Fragment2, jsx as jsx25, jsxs as jsxs19 } from "react/jsx-runtime";
function NavList({
  items,
  layoutId
}) {
  return /* @__PURE__ */ jsx25("nav", { role: "navigation", "aria-label": "Main", className: Sidebar_default.nav, children: items.map((item) => /* @__PURE__ */ jsxs19(
    "button",
    {
      type: "button",
      "aria-current": item.active ? "page" : void 0,
      disabled: item.disabled,
      onClick: item.onClick,
      className: cx(
        Sidebar_default.navButton,
        item.active ? Sidebar_default.navButtonActive : Sidebar_default.navButtonInactive
      ),
      children: [
        item.active && /* @__PURE__ */ jsx25(
          motion18.span,
          {
            layoutId,
            className: Sidebar_default.indicator,
            initial: false,
            transition: pressTransition
          }
        ),
        item.icon && /* @__PURE__ */ jsx25("span", { className: Sidebar_default.icon, children: item.icon }),
        item.label
      ]
    },
    item.id
  )) });
}
var Sidebar = React27.forwardRef(
  ({ items, header, footer, mobileOpen = false, onMobileClose, className }, ref) => {
    return /* @__PURE__ */ jsxs19(Fragment2, { children: [
      /* @__PURE__ */ jsxs19("aside", { ref, className: cx(Sidebar_default.aside, className), children: [
        header && /* @__PURE__ */ jsx25("div", { className: Sidebar_default.header, children: header }),
        /* @__PURE__ */ jsx25(NavList, { items, layoutId: "sidebarIndicator-desktop" }),
        footer && /* @__PURE__ */ jsx25("div", { className: Sidebar_default.footer, children: footer })
      ] }),
      /* @__PURE__ */ jsx25(
        Drawer,
        {
          isOpen: mobileOpen,
          onClose: onMobileClose ?? (() => {
          }),
          title: header,
          position: "left",
          size: "sm",
          children: /* @__PURE__ */ jsxs19("div", { className: Sidebar_default.drawerContent, children: [
            /* @__PURE__ */ jsx25(NavList, { items, layoutId: "sidebarIndicator-mobile" }),
            footer && /* @__PURE__ */ jsx25("div", { className: Sidebar_default.footer, children: footer })
          ] })
        }
      )
    ] });
  }
);
Sidebar.displayName = "Sidebar";

// src/components/Tabs/Tabs.tsx
import React28, { useState as useState9, useRef as useRef7 } from "react";
import { motion as motion19 } from "framer-motion";

// src/components/Tabs/Tabs.module.css
var Tabs_default = {"tabs": "tabs__Tabs", "tabList": "tabList__Tabs", "tab": "tab__Tabs", "active": "active__Tabs", "inactive": "inactive__Tabs", "disabled": "disabled__Tabs", "indicator": "indicator__Tabs", "panels": "panels__Tabs", "panel": "panel__Tabs", "demoCard": "demoCard__Tabs", "demoHeading": "demoHeading__Tabs", "demoText": "demoText__Tabs", "demoPanel": "demoPanel__Tabs"};

// src/components/Tabs/Tabs.tsx
import { jsx as jsx26, jsxs as jsxs20 } from "react/jsx-runtime";
var Tabs = React28.forwardRef(
  ({ items, defaultTab, className, onChange }, ref) => {
    const [activeTab, setActiveTab] = useState9(
      defaultTab || (items.length > 0 ? items[0].id : "")
    );
    const tabRefs = useRef7([]);
    const [prevDefaultTab, setPrevDefaultTab] = useState9(defaultTab);
    if (defaultTab !== prevDefaultTab) {
      setPrevDefaultTab(defaultTab);
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    }
    const handleTabClick = (id, disabled) => {
      if (disabled) return;
      setActiveTab(id);
      if (onChange) onChange(id);
    };
    const handleKeyDown = (e) => {
      var _a;
      const enabledTabs = items.filter((item) => !item.disabled);
      const currentIndex = enabledTabs.findIndex(
        (item) => item.id === activeTab
      );
      let newIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % enabledTabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = enabledTabs.length - 1;
      }
      if (newIndex !== currentIndex) {
        const nextTabId = enabledTabs[newIndex].id;
        setActiveTab(nextTabId);
        if (onChange) onChange(nextTabId);
        const globalIndex = items.findIndex((item) => item.id === nextTabId);
        (_a = tabRefs.current[globalIndex]) == null ? void 0 : _a.focus();
      }
    };
    return /* @__PURE__ */ jsxs20("div", { ref, className: cx(Tabs_default.tabs, className), children: [
      /* @__PURE__ */ jsx26(
        "div",
        {
          role: "tablist",
          "aria-orientation": "horizontal",
          className: Tabs_default.tabList,
          onKeyDown: handleKeyDown,
          children: items.map((item, index) => {
            const isActive = activeTab === item.id;
            return /* @__PURE__ */ jsxs20(
              "button",
              {
                ref: (el) => {
                  tabRefs.current[index] = el;
                },
                role: "tab",
                "aria-selected": isActive,
                "aria-controls": `panel-${item.id}`,
                id: `tab-${item.id}`,
                tabIndex: isActive ? 0 : -1,
                disabled: item.disabled,
                onClick: () => handleTabClick(item.id, item.disabled),
                className: cx(
                  Tabs_default.tab,
                  isActive ? Tabs_default.active : Tabs_default.inactive,
                  item.disabled && Tabs_default.disabled
                ),
                children: [
                  item.label,
                  isActive && /* @__PURE__ */ jsx26(
                    motion19.div,
                    {
                      layoutId: "activeTabIndicator",
                      className: Tabs_default.indicator,
                      initial: false,
                      transition: controlTransition
                    }
                  )
                ]
              },
              item.id
            );
          })
        }
      ),
      /* @__PURE__ */ jsx26("div", { className: Tabs_default.panels, children: items.map((item) => /* @__PURE__ */ jsx26(
        "div",
        {
          role: "tabpanel",
          id: `panel-${item.id}`,
          "aria-labelledby": `tab-${item.id}`,
          hidden: activeTab !== item.id,
          tabIndex: 0,
          className: Tabs_default.panel,
          children: activeTab === item.id && /* @__PURE__ */ jsx26(
            motion19.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: controlTransition,
              children: item.content
            }
          )
        },
        item.id
      )) })
    ] });
  }
);
Tabs.displayName = "Tabs";
var Tabs_default2 = Tabs;

// src/components/Toast/Toast.tsx
import React29, {
  createContext as createContext2,
  useContext as useContext2,
  useState as useState10,
  useCallback as useCallback2
} from "react";
import { createPortal as createPortal2 } from "react-dom";
import { motion as motion20, AnimatePresence as AnimatePresence7 } from "framer-motion";
import { CheckCircle, AlertCircle as AlertCircle2, Info, AlertTriangle, X as X3 } from "lucide-react";

// src/components/Toast/Toast.module.css
var Toast_default = {"toastItem": "toastItem__Toast", "content": "content__Toast", "iconWrap": "iconWrap__Toast", "textWrap": "textWrap__Toast", "title": "title__Toast", "description": "description__Toast", "closeButton": "closeButton__Toast", "progressBar": "progressBar__Toast", "progressSuccess": "progressSuccess__Toast", "progressError": "progressError__Toast", "progressWarning": "progressWarning__Toast", "progressInfo": "progressInfo__Toast", "iconSuccess": "iconSuccess__Toast", "iconError": "iconError__Toast", "iconInfo": "iconInfo__Toast", "iconWarning": "iconWarning__Toast", "viewport": "viewport__Toast", "demoWrap": "demoWrap__Toast", "demoButton": "demoButton__Toast", "demoButtonGreen": "demoButtonGreen__Toast", "demoButtonRed": "demoButtonRed__Toast", "demoButtonDark": "demoButtonDark__Toast", "demoStage": "demoStage__Toast"};

// src/components/Toast/Toast.tsx
import { jsx as jsx27, jsxs as jsxs21 } from "react/jsx-runtime";
var ToastContext = createContext2(void 0);
var useToast = () => {
  const context = useContext2(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
var icons = {
  success: /* @__PURE__ */ jsx27(CheckCircle, { className: Toast_default.iconSuccess, size: 24 }),
  error: /* @__PURE__ */ jsx27(AlertCircle2, { className: Toast_default.iconError, size: 24 }),
  info: /* @__PURE__ */ jsx27(Info, { className: Toast_default.iconInfo, size: 24 }),
  warning: /* @__PURE__ */ jsx27(AlertTriangle, { className: Toast_default.iconWarning, size: 24 })
};
var ToastItem = ({ toast, onRemove }) => {
  React29.useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 3e3);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);
  return /* @__PURE__ */ jsxs21(
    motion20.div,
    {
      layout: true,
      initial: { opacity: 0, y: 50, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: disclosureTransition,
      className: Toast_default.toastItem,
      role: "alert",
      children: [
        /* @__PURE__ */ jsxs21("div", { className: Toast_default.content, children: [
          /* @__PURE__ */ jsx27("div", { className: Toast_default.iconWrap, children: icons[toast.type || "info"] }),
          /* @__PURE__ */ jsxs21("div", { className: Toast_default.textWrap, children: [
            /* @__PURE__ */ jsx27(Text, { as: "p", variant: "small", className: Toast_default.title, children: toast.title }),
            toast.description && /* @__PURE__ */ jsx27(Text, { as: "p", variant: "small", className: Toast_default.description, children: toast.description })
          ] }),
          /* @__PURE__ */ jsx27(
            "button",
            {
              onClick: () => onRemove(toast.id),
              className: Toast_default.closeButton,
              "aria-label": "Close",
              children: /* @__PURE__ */ jsx27(X3, { size: 18 })
            }
          )
        ] }),
        toast.duration !== Infinity && /* @__PURE__ */ jsx27(
          motion20.div,
          {
            initial: { scaleX: 1 },
            animate: { scaleX: 0 },
            transition: {
              duration: (toast.duration || 3e3) / 1e3,
              ease: "linear"
            },
            style: { originX: 0 },
            className: cx(
              Toast_default.progressBar,
              toast.type === "success" ? Toast_default.progressSuccess : toast.type === "error" ? Toast_default.progressError : toast.type === "warning" ? Toast_default.progressWarning : Toast_default.progressInfo
            )
          }
        )
      ]
    }
  );
};
var ToastProvider = ({
  children
}) => {
  const [toasts, setToasts] = useState10([]);
  const toast = useCallback2((message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...message, id }]);
  }, []);
  const removeToast = useCallback2((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return /* @__PURE__ */ jsxs21(ToastContext.Provider, { value: { toast, removeToast }, children: [
    children,
    typeof document !== "undefined" && createPortal2(
      /* @__PURE__ */ jsx27("div", { className: Toast_default.viewport, children: /* @__PURE__ */ jsx27(AnimatePresence7, { children: toasts.map((t) => /* @__PURE__ */ jsx27(ToastItem, { toast: t, onRemove: removeToast }, t.id)) }) }),
      document.body
    )
  ] });
};

// src/components/Toggle/Toggle.tsx
import React30 from "react";
import { motion as motion21 } from "framer-motion";

// src/components/Toggle/Toggle.module.css
var Toggle_default = {"wrapper": "wrapper__Toggle", "track": "track__Toggle", "trackChecked": "trackChecked__Toggle", "srOnly": "srOnly__Toggle", "thumb": "thumb__Toggle", "label": "label__Toggle"};

// src/components/Toggle/Toggle.tsx
import { jsx as jsx28, jsxs as jsxs22 } from "react/jsx-runtime";
var Toggle = React30.forwardRef(
  ({ checked, onChange, label, className, id }, ref) => {
    const defaultId = React30.useId();
    const toggleId = id || defaultId;
    return /* @__PURE__ */ jsxs22("div", { className: cx(Toggle_default.wrapper, className), children: [
      /* @__PURE__ */ jsxs22(
        "button",
        {
          ref,
          type: "button",
          id: toggleId,
          role: "switch",
          "aria-checked": checked,
          onClick: () => onChange(!checked),
          className: cx(Toggle_default.track, checked && Toggle_default.trackChecked),
          children: [
            /* @__PURE__ */ jsx28("span", { className: Toggle_default.srOnly, children: label || "Toggle" }),
            /* @__PURE__ */ jsx28(
              motion21.span,
              {
                layout: true,
                transition: pressTransition,
                className: Toggle_default.thumb,
                style: {
                  x: checked ? 20 : 0
                }
              }
            )
          ]
        }
      ),
      label && /* @__PURE__ */ jsx28("label", { htmlFor: toggleId, className: Toggle_default.label, children: label })
    ] });
  }
);
Toggle.displayName = "Toggle";
var Toggle_default2 = Toggle;

// src/components/Tooltip/Tooltip.tsx
import React31, { useState as useState11, useRef as useRef8, useEffect as useEffect7, useCallback as useCallback3 } from "react";
import { createPortal as createPortal3 } from "react-dom";
import { motion as motion22, AnimatePresence as AnimatePresence8 } from "framer-motion";

// src/components/Tooltip/Tooltip.module.css
var Tooltip_default = {"tooltip": "tooltip__Tooltip", "demoRow": "demoRow__Tooltip", "demoButton": "demoButton__Tooltip", "demoOutlineButton": "demoOutlineButton__Tooltip", "demoIconButton": "demoIconButton__Tooltip"};

// src/components/Tooltip/Tooltip.tsx
import { Fragment as Fragment3, jsx as jsx29, jsxs as jsxs23 } from "react/jsx-runtime";
var Tooltip = ({
  content,
  children,
  position = "top",
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState11(false);
  const [coords, setCoords] = useState11({ x: 0, y: 0 });
  const triggerRef = useRef8(null);
  const tooltipRef = useRef8(null);
  const timeoutRef = useRef8(null);
  const updatePosition = useCallback3(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;
    let x = 0;
    let y = 0;
    switch (position) {
      case "top":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - spacing;
        break;
      case "bottom":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + spacing;
        break;
      case "left":
        x = triggerRect.left - tooltipRect.width - spacing;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case "right":
        x = triggerRect.right + spacing;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }
    const padding = 8;
    x = Math.max(
      padding,
      Math.min(x, window.innerWidth - tooltipRect.width - padding)
    );
    y = Math.max(
      padding,
      Math.min(y, window.innerHeight - tooltipRect.height - padding)
    );
    setCoords({ x, y });
  }, [position]);
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  useEffect7(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, updatePosition]);
  const childProps = {
    ...children.props,
    ref: triggerRef,
    onMouseEnter: (e) => {
      var _a, _b;
      handleMouseEnter();
      (_b = (_a = children.props).onMouseEnter) == null ? void 0 : _b.call(_a, e);
    },
    onMouseLeave: (e) => {
      var _a, _b;
      handleMouseLeave();
      (_b = (_a = children.props).onMouseLeave) == null ? void 0 : _b.call(_a, e);
    },
    onFocus: (e) => {
      var _a, _b;
      setIsVisible(true);
      (_b = (_a = children.props).onFocus) == null ? void 0 : _b.call(_a, e);
    },
    onBlur: (e) => {
      var _a, _b;
      setIsVisible(false);
      (_b = (_a = children.props).onBlur) == null ? void 0 : _b.call(_a, e);
    },
    "aria-describedby": isVisible ? "tooltip-content" : void 0
  };
  return /* @__PURE__ */ jsxs23(Fragment3, { children: [
    React31.cloneElement(children, childProps),
    typeof document !== "undefined" && createPortal3(
      /* @__PURE__ */ jsx29(AnimatePresence8, { children: isVisible && /* @__PURE__ */ jsx29(
        motion22.div,
        {
          ref: tooltipRef,
          id: "tooltip-content",
          role: "tooltip",
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: pressTransition,
          style: {
            position: "fixed",
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            zIndex: 9999
          },
          className: Tooltip_default.tooltip,
          children: content
        }
      ) }),
      document.body
    )
  ] });
};

// src/components/Tag/Tag.tsx
import React32 from "react";

// src/components/Tag/Tag.module.css
var Tag_default = {"tag": "tag__Tag", "md": "md__Tag", "mono": "mono__Tag", "accent": "accent__Tag", "accent2": "accent2__Tag", "sky": "sky__Tag", "clay": "clay__Tag", "neutral": "neutral__Tag", "ink": "ink__Tag", "inverse": "inverse__Tag"};

// src/components/Tag/Tag.tsx
import { jsx as jsx30 } from "react/jsx-runtime";
var Tag = React32.forwardRef(
  ({ children, tone = "accent", mono = false, size = "md", className, ...props }, ref) => {
    return /* @__PURE__ */ jsx30(
      "span",
      {
        ref,
        className: cx(Tag_default.tag, Tag_default[tone], mono && Tag_default.mono, size === "md" && Tag_default.md, className),
        ...props,
        children
      }
    );
  }
);
Tag.displayName = "Tag";

// src/components/ProofPoint/ProofPoint.tsx
import React33 from "react";

// src/components/ProofPoint/ProofPoint.module.css
var ProofPoint_default = {"proofPoint": "proofPoint__ProofPoint", "badge": "badge__ProofPoint", "badgeDark": "badgeDark__ProofPoint", "title": "title__ProofPoint", "titleDark": "titleDark__ProofPoint", "body": "body__ProofPoint", "bodyDark": "bodyDark__ProofPoint"};

// src/components/ProofPoint/ProofPoint.tsx
import { jsx as jsx31, jsxs as jsxs24 } from "react/jsx-runtime";
var ProofPoint = React33.forwardRef(
  ({ title, body, tone = "light", className, ...props }, ref) => {
    return /* @__PURE__ */ jsxs24("div", { ref, className: cx(ProofPoint_default.proofPoint, className), ...props, children: [
      /* @__PURE__ */ jsx31(
        "span",
        {
          className: cx(ProofPoint_default.badge, tone === "dark" && ProofPoint_default.badgeDark),
          "aria-hidden": "true",
          children: "\u2713"
        }
      ),
      /* @__PURE__ */ jsxs24("div", { children: [
        /* @__PURE__ */ jsx31(
          Text,
          {
            as: "p",
            variant: "none",
            className: cx(ProofPoint_default.title, tone === "dark" && ProofPoint_default.titleDark),
            children: title
          }
        ),
        /* @__PURE__ */ jsx31(
          Text,
          {
            as: "p",
            wrap: "pretty",
            className: cx(ProofPoint_default.body, tone === "dark" && ProofPoint_default.bodyDark),
            children: body
          }
        )
      ] })
    ] });
  }
);
ProofPoint.displayName = "ProofPoint";

// src/components/MediaFrame/MediaFrame.tsx
import React34 from "react";

// src/components/MediaFrame/MediaFrame.module.css
var MediaFrame_default = {"outer": "outer__MediaFrame", "gradientFill": "gradientFill__MediaFrame", "sunkenFill": "sunkenFill__MediaFrame", "inner": "inner__MediaFrame", "image": "image__MediaFrame", "placeholder": "placeholder__MediaFrame", "placeholderLabel": "placeholderLabel__MediaFrame"};

// src/components/MediaFrame/MediaFrame.tsx
import { jsx as jsx32 } from "react/jsx-runtime";
var MediaFrame = React34.forwardRef(
  ({
    label = "product screenshot",
    ratio = "16 / 9",
    gradient = true,
    radius,
    src,
    alt,
    video,
    loop = true,
    className,
    style,
    ...props
  }, ref) => {
    const innerRef = React34.useRef(null);
    const [videoInView, setVideoInView] = React34.useState(false);
    React34.useEffect(() => {
      if (!video || videoInView) return;
      const node = innerRef.current;
      if (!node || typeof IntersectionObserver === "undefined") {
        setVideoInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVideoInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, [video, videoInView]);
    return /* @__PURE__ */ jsx32(
      "div",
      {
        ref,
        className: cx(
          MediaFrame_default.outer,
          gradient ? MediaFrame_default.gradientFill : MediaFrame_default.sunkenFill,
          className
        ),
        style: { ...radius ? { borderRadius: radius } : {}, ...style },
        ...props,
        children: /* @__PURE__ */ jsx32("div", { ref: innerRef, className: MediaFrame_default.inner, style: { aspectRatio: ratio }, children: video && videoInView ? /* @__PURE__ */ jsx32(
          "video",
          {
            src: video,
            poster: src,
            className: MediaFrame_default.image,
            autoPlay: true,
            loop,
            muted: true,
            playsInline: true,
            "aria-label": alt || label
          }
        ) : src ? /* @__PURE__ */ jsx32("img", { src, alt: alt || label, className: MediaFrame_default.image }) : /* @__PURE__ */ jsx32("div", { className: MediaFrame_default.placeholder, children: /* @__PURE__ */ jsx32(Text, { as: "span", variant: "none", className: MediaFrame_default.placeholderLabel, children: label }) }) })
      }
    );
  }
);
MediaFrame.displayName = "MediaFrame";
var MediaFrame_default2 = MediaFrame;

// src/components/ArrowLink/ArrowLink.tsx
import React35 from "react";

// src/components/ArrowLink/ArrowLink.module.css
var ArrowLink_default = {"link": "link__ArrowLink", "dark": "dark__ArrowLink", "arrow": "arrow__ArrowLink"};

// src/components/ArrowLink/ArrowLink.tsx
import { jsx as jsx33, jsxs as jsxs25 } from "react/jsx-runtime";
var ArrowLink = React35.forwardRef(
  ({ children, href = "#", tone = "light", className, ...props }, ref) => {
    return /* @__PURE__ */ jsxs25(
      "a",
      {
        ref,
        href,
        className: cx(ArrowLink_default.link, tone === "dark" && ArrowLink_default.dark, className),
        ...props,
        children: [
          /* @__PURE__ */ jsx33("span", { children }),
          /* @__PURE__ */ jsx33("span", { className: ArrowLink_default.arrow, "aria-hidden": "true", children: "\u2192" })
        ]
      }
    );
  }
);
ArrowLink.displayName = "ArrowLink";
var ArrowLink_default2 = ArrowLink;

// src/components/Field/Field.tsx
import React36 from "react";

// src/components/Field/Field.module.css
var Field_default = {"field": "field__Field", "label": "label__Field", "required": "required__Field", "error": "error__Field"};

// src/components/Field/Field.tsx
import { jsx as jsx34, jsxs as jsxs26 } from "react/jsx-runtime";
var Field = React36.forwardRef(
  ({ label, hint, error, required = false, children, className, ...props }, ref) => {
    return /* @__PURE__ */ jsxs26("label", { ref, className: cx(Field_default.field, className), ...props, children: [
      label && /* @__PURE__ */ jsxs26(Text, { as: "span", className: Field_default.label, children: [
        label,
        required && /* @__PURE__ */ jsx34("span", { className: Field_default.required, children: "*" })
      ] }),
      children,
      error ? /* @__PURE__ */ jsx34(Text, { as: "span", variant: "small", className: Field_default.error, children: error }) : hint ? /* @__PURE__ */ jsx34(Text, { as: "span", variant: "small", children: hint }) : null
    ] });
  }
);
Field.displayName = "Field";
var Field_default2 = Field;

// src/components/Textarea/Textarea.tsx
import React37 from "react";

// src/components/Textarea/Textarea.module.css
var Textarea_default = {"wrapper": "wrapper__Textarea", "label": "label__Textarea", "textarea": "textarea__Textarea", "error": "error__Textarea", "errorText": "errorText__Textarea"};

// src/components/Textarea/Textarea.tsx
import { jsx as jsx35, jsxs as jsxs27 } from "react/jsx-runtime";
var Textarea = React37.forwardRef(
  ({ className, label, error, id, rows = 5, ...props }, ref) => {
    const defaultId = React37.useId();
    const textareaId = id || defaultId;
    return /* @__PURE__ */ jsxs27("div", { className: cx(Textarea_default.wrapper, className), children: [
      label && /* @__PURE__ */ jsx35("label", { htmlFor: textareaId, className: Textarea_default.label, children: label }),
      /* @__PURE__ */ jsx35(
        "textarea",
        {
          id: textareaId,
          ref,
          rows,
          className: cx(Textarea_default.textarea, error && Textarea_default.error),
          "aria-invalid": error ? "true" : "false",
          "aria-describedby": error ? `${textareaId}-error` : void 0,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx35(
        Text,
        {
          as: "p",
          variant: "small",
          className: Textarea_default.errorText,
          id: `${textareaId}-error`,
          children: error
        }
      )
    ] });
  }
);
Textarea.displayName = "Textarea";
var Textarea_default2 = Textarea;

// src/components/SectionHeader/SectionHeader.tsx
import React38 from "react";

// src/components/SectionHeader/SectionHeader.module.css
var SectionHeader_default = {"header": "header__SectionHeader", "center": "center__SectionHeader", "left": "left__SectionHeader", "title": "title__SectionHeader", "titleDark": "titleDark__SectionHeader", "subtitle": "subtitle__SectionHeader", "subtitleDark": "subtitleDark__SectionHeader"};

// src/components/SectionHeader/SectionHeader.tsx
import { jsx as jsx36, jsxs as jsxs28 } from "react/jsx-runtime";
var SectionHeader = React38.forwardRef(
  ({
    title,
    subtitle,
    align = "left",
    tone = "light",
    className,
    style,
    ...props
  }, ref) => {
    const inverse = tone === "dark";
    return /* @__PURE__ */ jsxs28(
      "div",
      {
        ref,
        className: cx(
          SectionHeader_default.header,
          align === "center" ? SectionHeader_default.center : SectionHeader_default.left,
          className
        ),
        style,
        ...props,
        children: [
          title && /* @__PURE__ */ jsx36(
            Title_default2,
            {
              as: "h2",
              variant: "section",
              className: cx(SectionHeader_default.title, inverse && SectionHeader_default.titleDark),
              children: title
            }
          ),
          subtitle && /* @__PURE__ */ jsx36(
            Text_default2,
            {
              variant: "lead",
              className: cx(SectionHeader_default.subtitle, inverse && SectionHeader_default.subtitleDark),
              children: subtitle
            }
          )
        ]
      }
    );
  }
);
SectionHeader.displayName = "SectionHeader";
var SectionHeader_default2 = SectionHeader;

// src/components/ServiceCard/ServiceCard.tsx
import React40 from "react";

// src/components/ServiceCard/ServiceCardMedia.tsx
import React39 from "react";

// src/components/ServiceCard/ServiceCardMedia.module.css
var ServiceCardMedia_default = {"frame": "frame__ServiceCard", "layer": "layer__ServiceCard", "hidden": "hidden__ServiceCard", "overlay": "overlay__ServiceCard", "visible": "visible__ServiceCard", "media": "media__ServiceCard", "placeholder": "placeholder__ServiceCard", "placeholderVideo": "placeholderVideo__ServiceCard", "placeholderLabel": "placeholderLabel__ServiceCard"};

// src/components/ServiceCard/ServiceCardMedia.tsx
import { jsx as jsx37, jsxs as jsxs29 } from "react/jsx-runtime";
function ServiceCardMedia({
  image,
  video,
  alt = "",
  imageLabel = "product screenshot",
  videoLabel = "video preview",
  ratio = "4 / 3",
  hovered
}) {
  const videoRef = React39.useRef(null);
  React39.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (hovered) {
      el.currentTime = 0;
      void el.play();
    } else {
      el.pause();
    }
  }, [hovered]);
  return /* @__PURE__ */ jsxs29("div", { className: ServiceCardMedia_default.frame, style: { aspectRatio: ratio }, children: [
    /* @__PURE__ */ jsx37(
      "div",
      {
        "data-testid": "service-card-media-image",
        "data-visible": !hovered,
        className: cx(ServiceCardMedia_default.layer, hovered && ServiceCardMedia_default.hidden),
        children: image ? /* @__PURE__ */ jsx37("img", { src: image, alt, className: ServiceCardMedia_default.media }) : /* @__PURE__ */ jsx37("div", { className: ServiceCardMedia_default.placeholder, children: /* @__PURE__ */ jsx37(Text, { as: "span", variant: "none", className: ServiceCardMedia_default.placeholderLabel, children: imageLabel }) })
      }
    ),
    /* @__PURE__ */ jsx37(
      "div",
      {
        "data-testid": "service-card-media-video",
        "data-visible": hovered,
        className: cx(ServiceCardMedia_default.layer, ServiceCardMedia_default.overlay, hovered && ServiceCardMedia_default.visible),
        children: video ? /* @__PURE__ */ jsx37(
          "video",
          {
            ref: videoRef,
            src: video,
            muted: true,
            loop: true,
            playsInline: true,
            preload: "none",
            "aria-hidden": "true",
            className: ServiceCardMedia_default.media
          }
        ) : /* @__PURE__ */ jsx37(
          "div",
          {
            "aria-hidden": "true",
            className: cx(ServiceCardMedia_default.placeholder, ServiceCardMedia_default.placeholderVideo),
            children: /* @__PURE__ */ jsxs29(Text, { as: "span", variant: "none", className: ServiceCardMedia_default.placeholderLabel, children: [
              "\u25B6 ",
              videoLabel
            ] })
          }
        )
      }
    )
  ] });
}

// src/components/ServiceCard/ServiceCard.module.css
var ServiceCard_default = {"card": "card__ServiceCard", "art": "art__ServiceCard", "illustration": "illustration__ServiceCard", "mediaSlot": "mediaSlot__ServiceCard", "headerRow": "headerRow__ServiceCard", "iconTile": "iconTile__ServiceCard", "iconWrap": "iconWrap__ServiceCard", "title": "title__ServiceCard", "body": "body__ServiceCard", "linkRow": "linkRow__ServiceCard"};

// src/components/ServiceCard/ServiceCard.tsx
import { jsx as jsx38, jsxs as jsxs30 } from "react/jsx-runtime";
var ServiceCard = React40.forwardRef(
  ({
    title,
    body,
    icon,
    art,
    media,
    linkLabel = "Learn more",
    href = "#",
    accent = false,
    ctaVariant = "link",
    cta = true,
    className,
    style
  }, ref) => {
    const [hovered, setHovered] = React40.useState(false);
    const artNode = React40.isValidElement(art) && art.type === GradientBackground ? React40.cloneElement(art, {
      animated: hovered,
      children: /* @__PURE__ */ jsx38("div", { className: ServiceCard_default.illustration, children: art.props.children })
    }) : art && /* @__PURE__ */ jsx38("div", { className: ServiceCard_default.illustration, children: art });
    return /* @__PURE__ */ jsxs30(
      Card,
      {
        ref,
        tone: accent ? "accent" : "default",
        padding: 30,
        radius: "var(--plu-radius-xl)",
        interactive: true,
        className: cx(ServiceCard_default.card, className),
        style: { border: "none", boxShadow: "var(--plu-shadow-raised)", ...style },
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        children: [
          media ? /* @__PURE__ */ jsx38("div", { className: ServiceCard_default.mediaSlot, children: /* @__PURE__ */ jsx38(ServiceCardMedia, { ...media, hovered }) }) : art && /* @__PURE__ */ jsx38("div", { className: ServiceCard_default.art, children: artNode }),
          /* @__PURE__ */ jsxs30("div", { className: ServiceCard_default.headerRow, children: [
            (icon || !(art || media)) && /* @__PURE__ */ jsx38(
              "div",
              {
                className: icon ? ServiceCard_default.iconWrap : ServiceCard_default.iconTile,
                "data-accent": !icon && accent ? "true" : void 0,
                children: icon
              }
            ),
            /* @__PURE__ */ jsx38(Title, { as: "h3", variant: "card", className: ServiceCard_default.title, children: title })
          ] }),
          /* @__PURE__ */ jsx38(Text, { as: "p", variant: "body", wrap: "pretty", className: ServiceCard_default.body, children: body }),
          cta && /* @__PURE__ */ jsx38("div", { className: ServiceCard_default.linkRow, children: ctaVariant === "button" ? /* @__PURE__ */ jsx38(Button_default2, { href, variant: "ghost", fullWidth: true, children: linkLabel }) : /* @__PURE__ */ jsx38(ArrowLink, { href, children: linkLabel }) })
        ]
      }
    );
  }
);
ServiceCard.displayName = "ServiceCard";
var ServiceCard_default2 = ServiceCard;

// src/components/StepCard/StepCard.tsx
import React41 from "react";

// src/components/StepCard/StepCard.module.css
var StepCard_default = {"card": "card__StepCard", "index": "index__StepCard", "indexCentered": "indexCentered__StepCard", "indexDark": "indexDark__StepCard", "art": "art__StepCard", "artDark": "artDark__StepCard", "body": "body__StepCard", "bodyDark": "bodyDark__StepCard", "tags": "tags__StepCard", "tag": "tag__StepCard"};

// src/components/StepCard/StepCard.tsx
import { jsx as jsx39, jsxs as jsxs31 } from "react/jsx-runtime";
var StepCard = React41.forwardRef(
  ({ index, title, body, art, tags = [], tone = "light", className, style }, ref) => {
    const inverse = tone === "dark";
    return /* @__PURE__ */ jsxs31(
      Card,
      {
        ref,
        tone: inverse ? "inverse" : "default",
        padding: 30,
        radius: "var(--plu-radius-xl)",
        className: cx(StepCard_default.card, className),
        style: inverse ? style : { border: "none", boxShadow: "var(--plu-shadow-raised)", ...style },
        children: [
          /* @__PURE__ */ jsxs31(
            Text,
            {
              as: "div",
              variant: "none",
              className: cx(
                StepCard_default.index,
                inverse && StepCard_default.indexDark,
                art && StepCard_default.indexCentered
              ),
              children: [
                String(index).padStart(2, "0"),
                " \u2014 ",
                title
              ]
            }
          ),
          art && /* @__PURE__ */ jsx39("div", { className: cx(StepCard_default.art, inverse && StepCard_default.artDark), children: art }),
          /* @__PURE__ */ jsx39(
            Text,
            {
              as: "p",
              variant: "small",
              wrap: "pretty",
              className: cx(StepCard_default.body, inverse && StepCard_default.bodyDark),
              children: body
            }
          ),
          tags.length > 0 && /* @__PURE__ */ jsx39("div", { className: StepCard_default.tags, children: tags.map((tag) => /* @__PURE__ */ jsx39(
            Tag,
            {
              tone: inverse ? "inverse" : "accent",
              className: StepCard_default.tag,
              children: tag
            },
            tag
          )) })
        ]
      }
    );
  }
);
StepCard.displayName = "StepCard";
var StepCard_default2 = StepCard;

// src/components/NavBar/NavBar.tsx
import React42, { useEffect as useEffect8, useRef as useRef9, useState as useState12 } from "react";
import { Menu } from "lucide-react";

// src/components/NavBar/NavBar.module.css
var NavBar_default = {"header": "header__NavBar", "inverse": "inverse__NavBar", "logoLink": "logoLink__NavBar", "navWrapper": "navWrapper__NavBar", "nav": "nav__NavBar", "navFadeStart": "navFadeStart__NavBar", "navFadeEnd": "navFadeEnd__NavBar", "navCenter": "navCenter__NavBar", "navLink": "navLink__NavBar", "navLinkInactive": "navLinkInactive__NavBar", "navLinkActive": "navLinkActive__NavBar", "actions": "actions__NavBar", "secondaryDesktopOnly": "secondaryDesktopOnly__NavBar", "menuTrigger": "menuTrigger__NavBar", "drawerContent": "drawerContent__NavBar", "drawerNav": "drawerNav__NavBar", "drawerNavLink": "drawerNavLink__NavBar", "floating": "floating__NavBar", "pinned": "pinned__NavBar"};

// src/components/NavBar/NavBar.tsx
import { Fragment as Fragment4, jsx as jsx40, jsxs as jsxs32 } from "react/jsx-runtime";
var NavBar = React42.forwardRef(
  ({
    logo,
    items,
    active,
    tone = "light",
    itemsAlign = "start",
    ctaLabel,
    secondaryLabel,
    ctaTarget,
    secondaryTarget,
    onNavigate,
    floating = false,
    className,
    style
  }, ref) => {
    const inverse = tone === "dark";
    const [pinned, setPinned] = useState12(false);
    const [mobileOpen, setMobileOpen] = useState12(false);
    const navRef = useRef9(null);
    const [navOverflowingStart, setNavOverflowingStart] = useState12(false);
    const [navOverflowingEnd, setNavOverflowingEnd] = useState12(false);
    const handleNavigate = (target) => {
      onNavigate == null ? void 0 : onNavigate(target);
      setMobileOpen(false);
    };
    useEffect8(() => {
      if (!floating) return;
      const handleScroll = () => {
        setPinned((prev) => prev ? window.scrollY > 8 : window.scrollY > 20);
      };
      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [floating]);
    useEffect8(() => {
      const node = navRef.current;
      if (!node) return;
      const updateOverflow = () => {
        setNavOverflowingStart(node.scrollLeft > 1);
        setNavOverflowingEnd(
          node.scrollWidth - node.clientWidth - node.scrollLeft > 1
        );
      };
      updateOverflow();
      node.addEventListener("scroll", updateOverflow, { passive: true });
      const resizeObserver = new ResizeObserver(updateOverflow);
      resizeObserver.observe(node);
      return () => {
        node.removeEventListener("scroll", updateOverflow);
        resizeObserver.disconnect();
      };
    }, [items]);
    return /* @__PURE__ */ jsxs32(Fragment4, { children: [
      /* @__PURE__ */ jsxs32(
        "header",
        {
          ref,
          className: cx(
            NavBar_default.header,
            inverse && NavBar_default.inverse,
            floating && NavBar_default.floating,
            floating && pinned && NavBar_default.pinned,
            className
          ),
          style,
          children: [
            /* @__PURE__ */ jsx40(
              "a",
              {
                href: "#",
                className: NavBar_default.logoLink,
                onClick: (e) => {
                  e.preventDefault();
                  onNavigate == null ? void 0 : onNavigate("home");
                },
                children: logo
              }
            ),
            /* @__PURE__ */ jsx40("div", { className: NavBar_default.navWrapper, children: /* @__PURE__ */ jsx40(
              "nav",
              {
                ref: navRef,
                className: cx(
                  NavBar_default.nav,
                  itemsAlign === "center" && NavBar_default.navCenter,
                  navOverflowingStart && NavBar_default.navFadeStart,
                  navOverflowingEnd && NavBar_default.navFadeEnd
                ),
                children: items.map((item) => /* @__PURE__ */ jsx40(
                  "a",
                  {
                    href: "#",
                    className: cx(
                      NavBar_default.navLink,
                      item === active ? NavBar_default.navLinkActive : NavBar_default.navLinkInactive
                    ),
                    onClick: (e) => {
                      e.preventDefault();
                      onNavigate == null ? void 0 : onNavigate(item);
                    },
                    children: item
                  },
                  item
                ))
              }
            ) }),
            /* @__PURE__ */ jsxs32("div", { className: NavBar_default.actions, children: [
              secondaryLabel && /* @__PURE__ */ jsx40(
                Button_default2,
                {
                  variant: inverse ? "quiet" : "secondary",
                  className: NavBar_default.secondaryDesktopOnly,
                  onClick: () => secondaryTarget && (onNavigate == null ? void 0 : onNavigate(secondaryTarget)),
                  children: secondaryLabel
                }
              ),
              /* @__PURE__ */ jsx40(
                Button_default2,
                {
                  variant: inverse ? "accent" : "primary",
                  onClick: () => onNavigate == null ? void 0 : onNavigate(ctaTarget ?? "contact"),
                  children: ctaLabel
                }
              ),
              /* @__PURE__ */ jsx40(
                "button",
                {
                  type: "button",
                  className: NavBar_default.menuTrigger,
                  "aria-label": "Open menu",
                  onClick: () => setMobileOpen(true),
                  children: /* @__PURE__ */ jsx40(Menu, { size: 22 })
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx40(
        Drawer,
        {
          isOpen: mobileOpen,
          onClose: () => setMobileOpen(false),
          title: logo,
          position: "left",
          size: "sm",
          children: /* @__PURE__ */ jsxs32("div", { className: NavBar_default.drawerContent, children: [
            /* @__PURE__ */ jsx40("nav", { className: NavBar_default.drawerNav, children: items.map((item) => /* @__PURE__ */ jsx40(
              "a",
              {
                href: "#",
                className: cx(
                  NavBar_default.drawerNavLink,
                  item === active ? NavBar_default.navLinkActive : NavBar_default.navLinkInactive
                ),
                onClick: (e) => {
                  e.preventDefault();
                  handleNavigate(item);
                },
                children: item
              },
              item
            )) }),
            secondaryLabel && /* @__PURE__ */ jsx40(
              Button_default2,
              {
                variant: "secondary",
                size: "sm",
                fullWidth: true,
                onClick: () => secondaryTarget ? handleNavigate(secondaryTarget) : setMobileOpen(false),
                children: secondaryLabel
              }
            )
          ] })
        }
      )
    ] });
  }
);
NavBar.displayName = "NavBar";
var NavBar_default2 = NavBar;

// src/components/Footer/Footer.tsx
import React43 from "react";

// src/components/Footer/Footer.module.css
var Footer_default = {"footer": "footer__Footer", "grid": "grid__Footer", "description": "description__Footer", "columnTitle": "columnTitle__Footer", "linkList": "linkList__Footer", "link": "link__Footer", "bottomBar": "bottomBar__Footer"};

// src/components/Footer/Footer.tsx
import { jsx as jsx41, jsxs as jsxs33 } from "react/jsx-runtime";
var Footer = React43.forwardRef(
  ({ logo, description, columns, className, style }, ref) => {
    return /* @__PURE__ */ jsx41("footer", { ref, className: cx(Footer_default.footer, className), style, children: /* @__PURE__ */ jsx41(Container, { size: "max", children: /* @__PURE__ */ jsxs33("div", { className: Footer_default.grid, children: [
      /* @__PURE__ */ jsxs33("div", { children: [
        logo,
        /* @__PURE__ */ jsx41(Text, { as: "p", variant: "small", className: Footer_default.description, children: description })
      ] }),
      columns.map((column) => /* @__PURE__ */ jsxs33("div", { children: [
        /* @__PURE__ */ jsx41(Text, { as: "div", variant: "none", className: Footer_default.columnTitle, children: column.title }),
        /* @__PURE__ */ jsx41("div", { className: Footer_default.linkList, children: column.links.map((link) => /* @__PURE__ */ jsx41("a", { href: "#", className: Footer_default.link, children: link }, link)) })
      ] }, column.title))
    ] }) }) });
  }
);
Footer.displayName = "Footer";
var Footer_default2 = Footer;
export {
  Accordion_default2 as Accordion,
  Alert,
  AnimatedBackground_default2 as AnimatedBackground,
  ArrowLink_default2 as ArrowLink,
  Avatar,
  Badge,
  Breadcrumbs,
  Button_default2 as Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox_default2 as Checkbox,
  Container_default2 as Container,
  Dialog_default2 as Dialog,
  Drawer,
  DropdownMenu_default2 as DropdownMenu,
  Field_default2 as Field,
  Footer_default2 as Footer,
  Form_default2 as Form,
  GradientBackground_default2 as GradientBackground,
  IconButton_default2 as IconButton,
  Input_default2 as Input,
  Link_default2 as Link,
  Logo_default2 as Logo,
  MediaFrame_default2 as MediaFrame,
  NavBar_default2 as NavBar,
  Progress,
  ProofPoint,
  RadioGroup_default2 as RadioGroup,
  SectionHeader_default2 as SectionHeader,
  Select_default2 as Select,
  ServiceCard_default2 as ServiceCard,
  Sidebar,
  Skeleton,
  Slider_default2 as Slider,
  StepCard_default2 as StepCard,
  Tabs_default2 as Tabs,
  Tag,
  Text_default2 as Text,
  Textarea_default2 as Textarea,
  Title_default2 as Title,
  ToastProvider,
  Toggle_default2 as Toggle,
  Tooltip,
  useFormContext,
  useToast
};
