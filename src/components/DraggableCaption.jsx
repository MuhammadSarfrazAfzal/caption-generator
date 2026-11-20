import React, { useState, useRef, useEffect } from 'react';
import { 
  Move, 
  Minus, 
  Plus, 
  AlignCenter, 
  RotateCcw, 
  Check, 
  Sparkles,
  Maximize2
} from 'lucide-react';

export function DraggableCaption({
  caption,
  currentTime,
  style = {},
  onUpdateStyle,
  position = { x: 50, y: 84 },
  onPositionChange,
  displayMode = 'line', // 'line' or 'karaoke'
  containerRef
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false); // Stays visible once clicked!
  const [isNear, setIsNear] = useState(false); // Visible when cursor is near the box
  
  // Active resize state
  const [resizingCorner, setResizingCorner] = useState(null); // 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's'
  const resizeStartRef = useRef({ 
    mouseX: 0, 
    mouseY: 0, 
    startFontSize: 34, 
    startBoxWidth: 250, 
    startPaddingX: 18, 
    startPaddingY: 8 
  });

  const captionRef = useRef(null);

  // Proximity detection: detect when cursor is near the caption box (within 50px)
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDragging || resizingCorner) return;
      if (!captionRef.current) return;

      const rect = captionRef.current.getBoundingClientRect();
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.sqrt(dx * dx + dy * dy);

      setIsNear(dist <= 50);
    };

    const handleWindowMouseDown = (e) => {
      if (captionRef.current && captionRef.current.contains(e.target)) {
        setIsSelected(true);
      } else {
        setIsSelected(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mousedown', handleWindowMouseDown);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mousedown', handleWindowMouseDown);
    };
  }, [isDragging, resizingCorner]);

  // Global mousemove and mouseup listeners for dragging and interactive corner/edge resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef?.current || !captionRef.current) return;

      // 1. Move Position Dragging
      if (isDragging) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const captionRect = captionRef.current.getBoundingClientRect();

        const mouseX = e.clientX - containerRect.left - dragOffset.x + captionRect.width / 2;
        const mouseY = e.clientY - containerRect.top - dragOffset.y + captionRect.height / 2;

        const halfPctX = Math.min(40, ((captionRect.width / 2) / containerRect.width) * 100);
        const halfPctY = Math.min(40, ((captionRect.height / 2) / containerRect.height) * 100);

        const pctX = Math.max(halfPctX, Math.min(100 - halfPctX, (mouseX / containerRect.width) * 100));
        const pctY = Math.max(halfPctY, Math.min(100 - halfPctY, (mouseY / containerRect.height) * 100));

        if (typeof onPositionChange === 'function') {
          onPositionChange({
            x: Number(pctX.toFixed(1)),
            y: Number(pctY.toFixed(1))
          });
        }
        return;
      }

      // 2. Interactive Corner & Edge Resizing
      if (resizingCorner && onUpdateStyle) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const { mouseX, mouseY, startFontSize, startBoxWidth, startPaddingY } = resizeStartRef.current;
        const dx = e.clientX - mouseX;
        const dy = e.clientY - mouseY;

        if (['se', 'ne', 'sw', 'nw'].includes(resizingCorner)) {
          let scaleDelta = 0;
          if (resizingCorner === 'se') scaleDelta = (dx + dy) * 0.28;
          else if (resizingCorner === 'ne') scaleDelta = (dx - dy) * 0.28;
          else if (resizingCorner === 'sw') scaleDelta = (-dx + dy) * 0.28;
          else if (resizingCorner === 'nw') scaleDelta = (-dx - dy) * 0.28;

          const newFontSize = Math.max(16, Math.min(100, Math.round(startFontSize + scaleDelta)));
          const updates = { fontSize: newFontSize };
          
          if (style.boxWidth && startBoxWidth) {
            const scaleRatio = newFontSize / startFontSize;
            updates.boxWidth = Math.max(100, Math.min(Math.round(containerRect.width * 0.94), Math.round(startBoxWidth * scaleRatio)));
          }

          onUpdateStyle(updates);
        } else if (resizingCorner === 'e' || resizingCorner === 'w') {
          const deltaX = resizingCorner === 'e' ? dx : -dx;
          const maxAllowedWidth = Math.round(containerRect.width * 0.94);
          const newWidth = Math.max(100, Math.min(maxAllowedWidth, Math.round(startBoxWidth + deltaX * 2)));
          onUpdateStyle({ boxWidth: newWidth });
        } else if (resizingCorner === 's' || resizingCorner === 'n') {
          const deltaY = resizingCorner === 's' ? dy : -dy;
          const newPaddingY = Math.max(2, Math.min(60, Math.round(startPaddingY + deltaY * 0.5)));
          onUpdateStyle({ boxPaddingY: newPaddingY });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
      if (resizingCorner) setResizingCorner(null);
    };

    if (isDragging || resizingCorner) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, resizingCorner, onPositionChange, onUpdateStyle, containerRef, style.boxWidth]);

  if (!caption || !caption.text) {
    return null;
  }

  const handleMouseDownMove = (e) => {
    if (e.target.closest('.no-drag') || e.target.closest('.resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);

    if (!containerRef?.current || !captionRef.current) return;

    const captionRect = captionRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - captionRect.left,
      y: e.clientY - captionRect.top,
    });
  };

  const handleResizeStart = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);

    const captionRect = captionRef.current ? captionRef.current.getBoundingClientRect() : null;
    const currentRenderedWidth = captionRect ? Math.round(captionRect.width) : 250;

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startFontSize: style.fontSize || 34,
      startBoxWidth: style.boxWidth || currentRenderedWidth,
      startPaddingX: style.boxPaddingX ?? 18,
      startPaddingY: style.boxPaddingY ?? 8,
    };
    setResizingCorner(corner);
  };

  const textTransform = style.textTransform || 'none';
  const rawText = String(caption.text || '');
  const displayText = textTransform === 'uppercase' ? rawText.toUpperCase() : rawText;

  const textShadow = (style.shadowBlur || 0) > 0
    ? `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 3}px ${style.shadowBlur || 8}px ${style.shadowColor || 'rgba(0,0,0,0.85)'}`
    : 'none';

  const textStroke = (style.strokeWidth || 0) > 0
    ? `${style.strokeWidth}px ${style.strokeColor || '#000000'}`
    : 'none';

  const showOverlay = isSelected || isHovered || isNear || isDragging || Boolean(resizingCorner);
  const words = Array.isArray(caption.words) ? caption.words : [];
  const currentFontSize = style.fontSize || 34;

  return (
    <div
      ref={captionRef}
      onMouseDown={handleMouseDownMove}
      onClick={() => setIsSelected(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !resizingCorner && setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : resizingCorner ? 'nwse-resize' : 'grab',
        zIndex: 25,
        maxWidth: '94%',
      }}
      className="group select-none inline-block"
    >
      {/* World-Class Floating Frosted Glass Action Capsule */}
      {showOverlay && onUpdateStyle && (
        <div 
          className="no-drag absolute -top-13 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/90 backdrop-blur-2xl border border-white/20 text-white shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Coordinates Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono pr-2 border-r border-white/15">
            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#bbf421] shadow-[0_0_8px_#bbf421]' : 'bg-zinc-500'}`} />
            <span>{position.x}%, {position.y}%</span>
          </div>

          {/* Precision Size Stepper */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/15">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Size</span>
            <button
              onClick={() => onUpdateStyle({ fontSize: Math.max(16, currentFontSize - 2) })}
              className="w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-zinc-200 cursor-pointer transition-colors"
              title="Decrease text size (-2px)"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[12px] font-mono font-bold text-white px-0.5">{currentFontSize}px</span>
            <button
              onClick={() => onUpdateStyle({ fontSize: Math.min(100, currentFontSize + 2) })}
              className="w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-zinc-200 cursor-pointer transition-colors"
              title="Increase text size (+2px)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Preset Size Pills (S, M, L, XL) */}
          <div className="flex items-center gap-1 pr-2 border-r border-white/15">
            {[
              { label: 'S', size: 26 },
              { label: 'M', size: 34 },
              { label: 'L', size: 44 },
              { label: 'XL', size: 56 }
            ].map(p => (
              <button
                key={p.label}
                onClick={() => onUpdateStyle({ fontSize: p.size })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  currentFontSize === p.size 
                    ? 'bg-[#bbf421] text-zinc-950 font-black shadow-xs scale-105' 
                    : 'bg-white/10 hover:bg-white/20 text-zinc-300'
                }`}
                title={`Set font size to ${p.size}px`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Auto Width Reset if custom width */}
          {style.boxWidth && (
            <div className="flex items-center pr-2 border-r border-white/15">
              <button
                onClick={() => onUpdateStyle({ boxWidth: null })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 cursor-pointer"
                title="Reset box width to Auto Fit"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Auto Width</span>
              </button>
            </div>
          )}

          {/* Quick Color Swatches */}
          <div className="flex items-center gap-1.5 pl-0.5">
            {['#FFE600', '#FFFFFF', '#00F2FE', '#FF2E93', '#22C55E'].map((c) => (
              <button
                key={c}
                onClick={() => onUpdateStyle({ color: c })}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  style.color?.toUpperCase() === c ? 'scale-125 ring-2 ring-[#bbf421] border-black' : 'border-black/40 hover:scale-115'
                }`}
                title={`Set color ${c}`}
              />
            ))}
          </div>

          {/* Horizontal Center Alignment */}
          <button
            onClick={() => onPositionChange?.({ x: 50, y: position.y })}
            className="p-1 hover:bg-white/15 rounded-md text-zinc-400 hover:text-white ml-0.5 cursor-pointer transition-colors"
            title="Center Horizontally (50%)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Styled Caption Text Element */}
      <div
        style={{
          fontFamily: style.fontFamily || "'Montserrat', sans-serif",
          fontSize: `${currentFontSize}px`,
          fontWeight: style.fontWeight || '800',
          letterSpacing: style.letterSpacing || 'normal',
          lineHeight: 1.25,
          color: style.color || '#FFE600',
          textShadow: textShadow,
          WebkitTextStroke: textStroke,
          textAlign: 'center',
          backgroundColor: style.hasBackgroundBox
            ? hexToRgba(style.boxColor || '#000000', style.boxOpacity ?? 0.8)
            : 'transparent',
          padding: style.hasBackgroundBox
            ? `${style.boxPaddingY ?? 8}px ${style.boxPaddingX ?? 18}px`
            : `${style.boxPaddingY ?? 4}px ${style.boxPaddingX ?? 12}px`,
          borderRadius: `${style.boxRadius || 8}px`,
          width: style.boxWidth ? `${style.boxWidth}px` : 'auto',
          maxWidth: '100%',
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          display: 'inline-block',
          whiteSpace: 'pre-wrap',
          userSelect: 'none',
          position: 'relative',
        }}
        className="caption-content"
      >
        {/* Sleek Dynamic Glass Selection Frame */}
        {showOverlay && (
          <div className={`absolute -inset-2 border-[1.5px] rounded-xl pointer-events-none z-20 transition-all ${
            isSelected 
              ? 'border-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_8px_30px_rgba(0,0,0,0.4)]' 
              : 'border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]'
          }`}>
            {/* 4 Sleek Beveled Corner Knobs */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="resize-handle pointer-events-auto absolute -top-2 -left-2 w-3.5 h-3.5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-nwse-resize transition-all hover:scale-135 before:absolute before:-inset-3 before:content-['']"
              title="Drag corner to scale size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="resize-handle pointer-events-auto absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-nesw-resize transition-all hover:scale-135 before:absolute before:-inset-3 before:content-['']"
              title="Drag corner to scale size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              className="resize-handle pointer-events-auto absolute -bottom-2 -left-2 w-3.5 h-3.5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-nesw-resize transition-all hover:scale-135 before:absolute before:-inset-3 before:content-['']"
              title="Drag corner to scale size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              className="resize-handle pointer-events-auto absolute -bottom-2 -right-2 w-3.5 h-3.5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-nwse-resize transition-all hover:scale-135 before:absolute before:-inset-3 before:content-['']"
              title="Drag corner to scale size"
            />

            {/* Left & Right Horizontal Pill Grips */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              className="resize-handle pointer-events-auto absolute top-1/2 -left-2 -translate-y-1/2 w-1.5 h-5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-ew-resize transition-all hover:scale-125 before:absolute before:-inset-3 before:content-['']"
              title="Drag horizontally to resize box width"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              className="resize-handle pointer-events-auto absolute top-1/2 -right-2 -translate-y-1/2 w-1.5 h-5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-ew-resize transition-all hover:scale-125 before:absolute before:-inset-3 before:content-['']"
              title="Drag horizontally to resize box width"
            />

            {/* Top & Bottom Vertical Pill Grips */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              className="resize-handle pointer-events-auto absolute -top-2 left-1/2 -translate-x-1/2 h-1.5 w-5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-ns-resize transition-all hover:scale-125 before:absolute before:-inset-3 before:content-['']"
              title="Drag vertically to adjust padding"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 's')}
              className="resize-handle pointer-events-auto absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-5 rounded-full bg-white hover:bg-[#bbf421] ring-2 ring-zinc-950 shadow-md cursor-ns-resize transition-all hover:scale-125 before:absolute before:-inset-3 before:content-['']"
              title="Drag vertically to adjust padding"
            />
          </div>
        )}

        {/* Text Content with Butter-Smooth GPU Karaoke Glow */}
        {displayMode === 'karaoke' && words.length > 0 ? (
          words.map((w, idx) => {
            if (!w) return null;
            const wStart = typeof w.start === 'number' ? w.start : parseFloat(w.start) || 0;
            const wEnd = typeof w.end === 'number' ? w.end : parseFloat(w.end) || 0;
            const isCurrent = currentTime >= wStart && currentTime <= wEnd;
            const rawWord = String(w.word || '');
            const wordStr = textTransform === 'uppercase' ? rawWord.toUpperCase() : rawWord;

            return (
              <span
                key={idx}
                style={{
                  color: isCurrent ? (style.highlightColor || '#22C55E') : (style.color || '#FFE600'),
                  transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                  display: 'inline-block',
                  transition: 'color 0.1s ease, transform 0.1s ease, text-shadow 0.1s ease',
                  marginRight: '0.28em',
                  textShadow: isCurrent 
                    ? `0 0 16px ${style.highlightColor || '#22C55E'}, ${textShadow}`
                    : textShadow
                }}
              >
                {wordStr}
              </span>
            );
          })
        ) : (
          <span>{displayText}</span>
        )}
      </div>
    </div>
  );
}

function hexToRgba(hex = '#000000', alpha = 1) {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha ?? 1})`;
}
