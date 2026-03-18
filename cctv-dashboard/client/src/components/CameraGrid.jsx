// client/src/components/CameraGrid.jsx - 카메라 그리드 레이아웃 (드래그 앤 드롭 순서 변경)

import React, { useState, useRef } from 'react';
import CameraCard from './CameraCard';

function CameraGrid({ cameras, onCameraClick, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = (e, index) => {
    dragNode.current = e.target;
    setDragIndex(index);
    // 드래그 이미지 투명도
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4';
    }, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = '1';

    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = [...cameras];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(overIndex, 0, moved);

      if (onReorder) onReorder(reordered);
    }

    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  };

  const handleDragLeave = () => {
    setOverIndex(null);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {cameras.map((camera, index) => (
        <div
          key={camera.id}
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          className={`transition-all duration-200 rounded-xl ${
            overIndex === index && dragIndex !== index
              ? 'ring-2 ring-blue-400 scale-[1.02]'
              : ''
          }`}
          style={{
            cursor: onReorder ? 'grab' : 'pointer',
          }}
        >
          <CameraCard
            camera={camera}
            onClick={onCameraClick}
          />
        </div>
      ))}
    </div>
  );
}

export default CameraGrid;
