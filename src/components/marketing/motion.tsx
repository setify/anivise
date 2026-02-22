"use client";

import { type ReactNode, useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useReducedMotion,
  animate,
  type Variants,
} from "framer-motion";
import { useEffect } from "react";

interface FadeInProps {
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
  children: ReactNode;
}

const directionOffset = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
} as const;

export function FadeIn({
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  children,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      initial={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  staggerDelay?: number;
  className?: string;
  children: ReactNode;
}

const staggerContainerVariants = (
  staggerDelay: number,
  reducedMotion: boolean
): Variants => ({
  hidden: { opacity: reducedMotion ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: reducedMotion ? 0 : staggerDelay,
    },
  },
});

export function StaggerContainer({
  staggerDelay = 0.1,
  className,
  children,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants(
        staggerDelay,
        prefersReducedMotion ?? false
      )}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  className?: string;
  children: ReactNode;
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

const staggerItemReducedVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

export function StaggerItem({ className, children }: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        prefersReducedMotion ? staggerItemReducedVariants : staggerItemVariants
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function FloatingElement({
  amplitude = 10,
  duration = 3,
  delay = 0,
  className,
  children,
}: FloatingElementProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={
        prefersReducedMotion
          ? {}
          : {
              y: [0, -amplitude, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? {}
          : {
              y: {
                duration,
                delay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxSectionProps {
  speed?: number;
  className?: string;
  children: ReactNode;
}

export function ParallaxSection({
  speed = 0.5,
  className,
  children,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      motionValue.set(end);
      return;
    }

    const controls = animate(motionValue, end, {
      duration,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [isInView, end, duration, motionValue, prefersReducedMotion]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest}${suffix}`;
      }
    });

    return () => unsubscribe();
  }, [rounded, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

interface ScaleOnHoverProps {
  scale?: number;
  className?: string;
  children: ReactNode;
}

export function ScaleOnHover({
  scale = 1.05,
  className,
  children,
}: ScaleOnHoverProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { scale }}
      whileTap={prefersReducedMotion ? {} : { scale: scale * 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
