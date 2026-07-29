import React, { useState } from 'react';

export interface FunnelLayer {
  id: string;
  name: string;
  value: number;
  count: number;
  color: string;
}

interface Funnel3DProps {
  data: FunnelLayer[];
  height?: number;
  width?: number;
  onClick?: (layer: FunnelLayer) => void;
  metric: 'count' | 'value';
}

export function Funnel3D({ data, height = 400, width = 600, onClick, metric }: Funnel3DProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  if (!data || data.length === 0) return null;

  const total = data[0]?.[metric] || 1; // Top layer represents 100%

  // To make it look like a funnel, the width of each stage depends on its proportion to the top stage.
  // However, in a SPANCOP funnel, sometimes we want a linear visual taper regardless of exact numbers,
  // or a mix of both. Let's make the visual width taper linearly, and just use the data for labels, 
  // because if a stage has 0, it would look broken if strictly proportional.
  
  const layersCount = data.length;
  const topRadiusX = width * 0.40;
  const bottomRadiusX = width * 0.15;
  const ellipseRatio = 0.15; // slightly rounder ellipses

  const layerHeight = height / layersCount;

  const renderLayers = () => {
    const layerDefs = [];

    for (let i = layersCount - 1; i >= 0; i--) {
      const layer = data[i];
      const color = layer.color;
      
      const yTop = i * layerHeight + (layerHeight * 0.2);
      const yBot = (i + 1) * layerHeight;

      const rxTop = topRadiusX - ((topRadiusX - bottomRadiusX) * (i / layersCount));
      const rxBot = topRadiusX - ((topRadiusX - bottomRadiusX) * ((i + 1) / layersCount));
      
      const ryTop = rxTop * ellipseRatio;
      const ryBot = rxBot * ellipseRatio;
      
      const cx = width / 2;

      const bodyPath = `
        M ${cx - rxTop},${yTop}
        A ${rxTop} ${ryTop} 0 0 0 ${cx + rxTop},${yTop}
        L ${cx + rxBot},${yBot}
        A ${rxBot} ${ryBot} 0 0 1 ${cx - rxBot},${yBot}
        Z
      `;

      const topEllipsePath = `
        M ${cx - rxTop},${yTop}
        A ${rxTop} ${ryTop} 0 1 1 ${cx + rxTop},${yTop}
        A ${rxTop} ${ryTop} 0 1 1 ${cx - rxTop},${yTop}
        Z
      `;
      
      const valToShow = metric === 'value' 
        ? (layer[metric] / 1000000).toLocaleString() + ' م.ت' 
        : layer[metric].toLocaleString();

      const rate = total > 0 ? Math.round((layer[metric] / total) * 100) : 0;

      layerDefs.push({
        i, layer, color, yTop, yBot, cx, rxTop, ryTop, rxBot, ryBot,
        bodyPath, topEllipsePath, valToShow, rate,
        isHovered: hoveredIdx === i
      });
    }

    // Sort so hovered element is drawn last
    const sortedDefs = [...layerDefs].sort((a, b) => {
      if (a.isHovered) return 1;
      if (b.isHovered) return -1;
      return 0; // maintain original (bottom-to-top) order
    });

    const shapes = sortedDefs.map(def => (
      <g 
        key={`shape-${def.layer.id}`} 
        onMouseEnter={() => setHoveredIdx(def.i)}
        onMouseLeave={() => setHoveredIdx(null)}
        onClick={() => onClick?.(def.layer)}
        className="cursor-pointer transition-all duration-300"
        style={{ 
          transformOrigin: `${def.cx}px ${def.yTop + layerHeight/2}px`,
          transform: def.isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        <path d={def.bodyPath} fill={def.color} className="brightness-90 transition-all duration-300" />
        <path d={def.topEllipsePath} fill={def.color} className="brightness-110 transition-all duration-300" />
      </g>
    ));

    const texts = sortedDefs.map(def => (
      <g 
        key={`text-${def.layer.id}`}
        className="pointer-events-none transition-all duration-300"
        style={{ 
          transformOrigin: `${def.cx}px ${def.yTop + layerHeight/2}px`,
          transform: def.isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        <text x={def.cx} y={def.yTop + layerHeight / 2 - 2} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" className="drop-shadow-md">
          {def.layer.name} ({def.rate}%)
        </text>
        <text x={def.cx} y={def.yTop + layerHeight / 2 + 14} textAnchor="middle" fill="#ffffff" fontSize="11" className="drop-shadow-md opacity-90">
          {def.valToShow}
        </text>
      </g>
    ));

    return (
      <>
        <g>{shapes}</g>
        <g>{texts}</g>
      </>
    );
  };

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {renderLayers()}
    </svg>
  );
}
