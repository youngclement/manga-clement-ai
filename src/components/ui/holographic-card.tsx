"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
export interface HolographicCardProps {
  id?: string;
  width?: number;
  height?: number;
  imageSrc: string;
  hoverImageSrc?: string;
  hoverImageEase?: string;
  topText?: React.ReactNode;
  bottomText?: React.ReactNode;
  mirrorBottomText?: boolean;
  isRTL?: boolean;
  textOverlayPadding?: string;
  topTextVertical?: boolean;
  topTextWeight?: number | string;
  topTextFontSize?: string | number;
  topTextLetterSpacing?: string | number;
  topTextColor?: string;
  topTextHoverColor?: string;
  topTextClassName?: string;
  bottomTextVertical?: boolean;
  bottomTextWeight?: number | string;
  bottomTextFontSize?: string | number;
  bottomTextLetterSpacing?: string | number;
  bottomTextColor?: string;
  bottomTextHoverColor?: string;
  bottomTextClassName?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  imageOpacity?: number;
  maxImageWidthPct?: number;
  patternColor?: string;
  patternOpacity?: number;
  patternSize?: number;
  patternDotSize?: number;
  enableHologram?: boolean;
  hologramOpacity?: number;
  holographicGradient?: string;
  enableTilt?: boolean;
  enableDrag?: boolean;
  dragConstraints?: React.RefObject<Element>;
  className?: string;
  style?: React.CSSProperties;
}
export const HolographicCard: React.FC<HolographicCardProps> = ({
  id = "namer-ui-holographic-card",
  width = 320,
  height = 480,
  imageSrc,
  hoverImageSrc,
  hoverImageEase = "0.3s",
  topText,
  bottomText,
  mirrorBottomText = true,
  isRTL = false,
  textOverlayPadding = "1.375rem 1.325rem",
  topTextVertical = true,
  topTextWeight = 700,
  topTextFontSize = "1.5rem",
  topTextLetterSpacing = "0.1em",
  topTextColor = "#fff",
  topTextHoverColor = "#FBE75F",
  topTextClassName = "",
  bottomTextVertical = true,
  bottomTextWeight = 700,
  bottomTextFontSize = "1.5rem",
  bottomTextLetterSpacing = "0.1em",
  bottomTextColor = "#fff",
  bottomTextHoverColor = "#FBE75F",
  bottomTextClassName = "",
  borderRadius = 24,
  borderWidth = 1,
  borderColor = "rgba(255,255,255,0.1)",
  backgroundColor = "#000",
  imageOpacity = 0.9,
  maxImageWidthPct = 1,
  patternColor = "#000",
  patternOpacity = 0.15,
  patternSize = 3,
  patternDotSize = 1,
  enableHologram = true,
  hologramOpacity = 0.4,
  holographicGradient = "linear-gradient(135deg, transparent 35%, rgba(255,0,128,0.4) 45%, rgba(0,255,255,0.4) 55%, transparent 65%)",
  enableTilt = true,
  enableDrag = false,
  dragConstraints,
  className = "",
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(
    mouseY,
    [-0.5, 0.5],
    enableTilt ? [12, -12] : [0, 0],
  );
  const rotateY = useTransform(
    mouseX,
    [-0.5, 0.5],
    enableTilt ? [-12, 12] : [0, 0],
  );
  const bgX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !enableTilt) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleDragStart = () => {
    if (typeof document !== "undefined") document.body.style.cursor = "grabbing";
  };

  const handleDragEnd = () => {
    if (typeof document !== "undefined") document.body.style.cursor = "default";
  };
  const topTextHoverColorFinal = topTextHoverColor || topTextColor;
  const bottomTextHoverColorFinal = bottomTextHoverColor || bottomTextColor;
  const bottomJustify = isRTL !== mirrorBottomText ? "flex-start" : "flex-end";
  const wrapperClass = `holo-card-wrapper-${id}`;
  const cardBodyClass = `holo-card-body-${id}`;
  const patternClass = `holo-pattern-${id}`;

  return (
    <>
      <style>{`
        .${wrapperClass} {
          position: relative;
          width: ${width}px;
          height: ${height}px;
          perspective: 1200px;
          font-family: inherit;
          user-select: none;
          cursor: ${enableDrag ? "grab" : "default"};
        }
        .${cardBodyClass} {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background-color: ${backgroundColor};
          border-radius: ${borderRadius}px;
          border: ${borderWidth}px solid ${borderColor};
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);
        }
        .${patternClass} {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: ${patternOpacity};
          background-image: radial-gradient(circle, ${patternColor} ${patternDotSize}px, transparent ${patternDotSize}px);
          background-size: ${patternSize}px ${patternSize}px;
        }
      `}</style>
      <motion.div
        drag={enableDrag}
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        whileHover={enableDrag ? { scale: 1.02, cursor: "grab" } : undefined}
        whileTap={enableDrag ? { cursor: "grabbing" } : undefined}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`${wrapperClass} ${className}`}
        style={style}
      >
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovered(true)}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
          }}
          className="relative"
        >
          <div className={cardBodyClass}>
            <div className={patternClass} />

            <div
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
              style={{ opacity: imageOpacity }}
            >
              <img
                src={imageSrc}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{
                  width: `${maxImageWidthPct * 100}%`,
                  height: "auto",
                  maxHeight: "100%",
                }}
              />
            </div>

            {hoverImageSrc && (
              <div
                className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                style={{
                  opacity: isHovered ? imageOpacity : 0,
                  transition: `opacity ${hoverImageEase} ease`,
                }}
              >
                <img
                  src={hoverImageSrc}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={{
                    width: `${maxImageWidthPct * 100}%`,
                    height: "auto",
                    maxHeight: "100%",
                  }}
                />
              </div>
            )}

            {enableHologram && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-20 mix-blend-color-dodge"
                style={{
                  background: holographicGradient,
                  backgroundSize: "200% 200%",
                  backgroundPositionX: bgX,
                  backgroundPositionY: bgY,
                  opacity: hologramOpacity,
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0 z-30">
              {topText && (
                <div
                  className={topTextClassName}
                  style={{
                    position: "absolute",
                    top: 0,
                    [isRTL ? "right" : "left"]: 0,
                    padding: textOverlayPadding,
                    color: isHovered ? topTextHoverColorFinal : topTextColor,
                    fontWeight: topTextWeight,
                    fontSize: topTextFontSize,
                    letterSpacing: topTextLetterSpacing,
                    writingMode: topTextVertical
                      ? "vertical-rl"
                      : "horizontal-tb",
                    textOrientation: topTextVertical ? "mixed" : undefined,
                    textShadow: isHovered
                      ? `0 0 15px ${topTextHoverColorFinal}`
                      : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {topText}
                </div>
              )}

              {bottomText && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: textOverlayPadding,
                    display: "flex",
                    justifyContent: bottomJustify,
                    transform: mirrorBottomText ? "scale(-1, -1)" : "none",
                  }}
                >
                  <div
                    className={bottomTextClassName}
                    style={{
                      color: isHovered
                        ? bottomTextHoverColorFinal
                        : bottomTextColor,
                      fontWeight: bottomTextWeight,
                      fontSize: bottomTextFontSize,
                      letterSpacing: bottomTextLetterSpacing,
                      writingMode: bottomTextVertical
                        ? "vertical-rl"
                        : "horizontal-tb",
                      textOrientation: bottomTextVertical ? "mixed" : undefined,
                      textShadow: isHovered
                        ? `0 0 15px ${bottomTextHoverColorFinal}`
                        : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {bottomText}
                  </div>
                </div>
              )}
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              borderRadius,
              background: useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.2) 0%, transparent 60%)`,
              mixBlendMode: "overlay",
            }}
          />
        </motion.div>
      </motion.div>
    </>
  );
};
