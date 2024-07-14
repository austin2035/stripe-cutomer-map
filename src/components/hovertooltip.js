import React, { useState, useEffect } from "react";

export default function HoverTooltip({ children }) {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handler = e => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handler);

    return () => {
      document.removeEventListener('mousemove', handler);
    };
  }, []);

  return (
    <>
      <div className="tooltip" style={{ left: position.x, top: position.y }}>
        {children}
      </div>
    </>
  )
}
