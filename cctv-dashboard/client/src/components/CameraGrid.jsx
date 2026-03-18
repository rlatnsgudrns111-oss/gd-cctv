// client/src/components/CameraGrid.jsx - 카메라 그리드 레이아웃 (5열 × 4행)

import React from 'react';
import CameraCard from './CameraCard';

function CameraGrid({ cameras, onCameraClick }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          onClick={onCameraClick}
        />
      ))}
    </div>
  );
}

export default CameraGrid;
