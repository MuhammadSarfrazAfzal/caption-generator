import React, { useState, useRef, useEffect } from 'react';
import { Move, Minus, Plus, AlignCenter, Maximize2, Type, RotateCcw, Check } from 'lucide-react';

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
      // Don't calculate proximity while dragging or resizing
      if (isDragging || resizingCorner) return;
      if (!captionRef.current) return;

      const rect = captionRef.current.getBoundingClientRect();
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Within 50px of the box, trigger isNear
      setIsNear(dist <= 50);
    };

    const handleWindowMouseDown = (e) => {
      // If clicking inside the caption or its toolbar, select it
      if (captionRef.current && captionRef.current.contains(e.target)) {
        setIsSelected(true);
      } else {
        // If clicking outside (e.g. video background or elsewhere), deselect
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

        // Prevent handles from getting cut off by clamping within container edges
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
          // Corner Scaling: directly scales font size and keeps box in sync!
          let scaleDelta = 0;
          if (resizingCorner === 'se') scaleDelta = (dx + dy) * 0.28;
          else if (resizingCorner === 'ne') scaleDelta = (dx - dy) * 0.28;
          else if (resizingCorner === 'sw') scaleDelta = (-dx + dy) * 0.28;
          else if (resizingCorner === 'nw') scaleDelta = (-dx - dy) * 0.28;

          const newFontSize = Math.max(16, Math.min(100, Math.round(startFontSize + scaleDelta)));
          const updates = { fontSize: newFontSize };
          
          // Proportional width scale if a custom boxWidth was set
          if (style.boxWidth && startBoxWidth) {
            const scaleRatio = newFontSize / startFontSize;
            updates.boxWidth = Math.max(100, Math.min(Math.round(containerRect.width * 0.94), Math.round(startBoxWidth * scaleRatio)));
          }

          onUpdateStyle(updates);
        } else if (resizingCorner === 'e' || resizingCorner === 'w') {
          // Horizontal Edge: Directly resizes caption box width!
          const deltaX = resizingCorner === 'e' ? dx : -dx;
          const maxAllowedWidth = Math.round(containerRect.width * 0.94);
          const newWidth = Math.max(100, Math.min(maxAllowedWidth, Math.round(startBoxWidth + deltaX * 2)));
          onUpdateStyle({ boxWidth: newWidth });
        } else if (resizingCorner === 's' || resizingCorner === 'n') {
          // Vertical Edge: Adjusts vertical box padding
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

  // Mouse down for moving
  const handleMouseDownMove = (e) => {
    if (e.target.closest('.no-drag') || e.target.closest('.resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true); // Clicking on box selects it

    if (!containerRef?.current || !captionRef.current) return;

    const captionRect = captionRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - captionRect.left,
      y: e.clientY - captionRect.top,
    });
  };

  // Mouse down for corner and edge resizing
  const handleResizeStart = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true); // Resizing keeps it selected

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
    ? `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 3}px ${style.shadowBlur || 8}px ${style.shadowColor || 'rgba(0,0,0,0.8)'}`
    : 'none';

  const textStroke = (style.strokeWidth || 0) > 0
    ? `${style.strokeWidth}px ${style.strokeColor || '#000000'}`
    : 'none';

  // Box is visible if clicked (selected), hovered, cursor is near (within 50px), dragging, or resizing!
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
      {/* Floating Quick Action Toolbar */}
      {showOverlay && onUpdateStyle && (
        <div 
          className="no-drag absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d0f17fa] backdrop-blur-md border border-cyan-400 text-white shadow-[0_8px_25px_rgba(0,0,0,0.8)] z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Active selection dot / coordinates */}
          <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono pr-1.5 border-r border-zinc-700">
            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 shadow-[0_0_8px_#00f2fe]' : 'bg-cyan-500/40'}`} />
            <span>{position.x}%, {position.y}%</span>
          </div>

          {/* Quick Font Size Buttons */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-zinc-700">
            <span className="text-[10px] text-zinc-400 font-semibold">Size:</span>
            <button
              onClick={() => onUpdateStyle({ fontSize: Math.max(16, currentFontSize - 2) })}
              className="w-5 h-5 rounded bg-[#1e2230] hover:bg-[#2b3044] active:scale-95 flex items-center justify-center text-zinc-200 cursor-pointer"
              title="Decrease text size (-2px)"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono font-bold text-cyan-300 px-0.5">{currentFontSize}px</span>
            <button
              onClick={() => onUpdateStyle({ fontSize: Math.min(100, currentFontSize + 2) })}
              className="w-5 h-5 rounded bg-[#1e2230] hover:bg-[#2b3044] active:scale-95 flex items-center justify-center text-zinc-200 cursor-pointer"
              title="Increase text size (+2px)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Preset Sizes */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-zinc-700">
            {[
              { label: 'S', size: 26 },
              { label: 'M', size: 34 },
              { label: 'L', size: 44 },
              { label: 'XL', size: 56 }
            ].map(p => (
              <button
                key={p.label}
                onClick={() => onUpdateStyle({ fontSize: p.size })}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  currentFontSize === p.size 
                    ? 'bg-cyan-400 text-black shadow-sm font-black' 
                    : 'bg-[#181b28] hover:bg-[#252a3e] text-zinc-300'
                }`}
                title={`Set font size to ${p.size}px`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Box Width Mode (Custom or Auto) */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-zinc-700">
            {style.boxWidth ? (
              <button
                onClick={() => onUpdateStyle({ boxWidth: null })}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer"
                title="Reset box width to Auto fit text"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Auto Width</span>
              </button>
            ) : (
              <span className="text-[10px] text-zinc-400 px-1 font-mono">Fit Text</span>
            )}
          </div>

          {/* Quick Color Dots */}
          <div className="flex items-center gap-1 pl-0.5">
            {['#FFE600', '#FFFFFF', '#00F2FE', '#FF2E93', '#22C55E'].map((c) => (
              <button
                key={c}
                onClick={() => onUpdateStyle({ color: c })}
                style={{ backgroundColor: c }}
                className="w-3.5 h-3.5 rounded-full border border-black/50 hover:scale-125 transition-transform cursor-pointer"
                title={`Set color ${c}`}
              />
            ))}
          </div>

          {/* Center Horizontally */}
          <button
            onClick={() => onPositionChange?.({ x: 50, y: position.y })}
            className="p-1 hover:bg-[#1e2230] rounded text-zinc-400 hover:text-cyan-300 ml-0.5 cursor-pointer"
            title="Center Caption Horizontally (50%)"
          >
            <AlignCenter className="w-3 h-3" />
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
        {/* Active Selection Outline with Drag-to-Resize Handles & Expanded Hit Targets */}
        {showOverlay && (
          <div className={`absolute -inset-1.5 border-2 border-dashed rounded-lg pointer-events-none z-20 transition-all ${
            isSelected 
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.6)] ring-1 ring-cyan-300/40' 
              : 'border-cyan-400/80 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
          }`}>
            {/* 4 Corner Drag-to-Resize Scale Handles with 26px generous hit area */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="resize-handle pointer-events-auto absolute -top-2.5 -left-2.5 w-4 h-4 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-nwse-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag to scale caption size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="resize-handle pointer-events-auto absolute -top-2.5 -right-2.5 w-4 h-4 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-nesw-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag to scale caption size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              className="resize-handle pointer-events-auto absolute -bottom-2.5 -left-2.5 w-4 h-4 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-nesw-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag to scale caption size"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              className="resize-handle pointer-events-auto absolute -bottom-2.5 -right-2.5 w-4 h-4 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-nwse-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag to scale caption size"
            />

            {/* 2 Horizontal Edge Handles (Drag to resize Box Width!) */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              className="resize-handle pointer-events-auto absolute top-1/2 -left-2.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-ew-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag horizontally to resize box width"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              className="resize-handle pointer-events-auto absolute top-1/2 -right-2.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-ew-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag horizontally to resize box width"
            />

            {/* 2 Vertical Edge Handles (Drag to adjust Box Padding / Height) */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              className="resize-handle pointer-events-auto absolute -top-2.5 left-1/2 -translate-x-1/2 h-2.5 w-6 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-ns-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag vertically to adjust vertical padding"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 's')}
              className="resize-handle pointer-events-auto absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-2.5 w-6 rounded-full bg-cyan-400 hover:bg-white hover:scale-125 ring-2 ring-black cursor-ns-resize transition-transform before:absolute before:-inset-2.5 before:content-[''] shadow-md"
              title="Drag vertically to adjust vertical padding"
            />
          </div>
        )}

        {/* Text Content */}
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
                  transform: isCurrent ? 'scale(1.12)' : 'scale(1)',
                  display: 'inline-block',
                  transition: 'color 0.08s ease, transform 0.08s ease',
                  marginRight: '0.28em',
                  textShadow: isCurrent 
                    ? `0 0 14px ${style.highlightColor || '#22C55E'}, ${textShadow}`
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


