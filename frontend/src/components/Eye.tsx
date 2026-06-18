import React, { useEffect, useRef } from 'react';

export function Eye({ 
  mousePosRef, 
  fakeMouseActiveRef, 
  fakeMousePosRef,
  userHasControlRef,
  className = "w-[12%] aspect-square max-w-[180px] min-w-[60px]"
}: { 
  mousePosRef: React.MutableRefObject<{ x: number, y: number }>,
  fakeMouseActiveRef: React.MutableRefObject<boolean>,
  fakeMousePosRef: React.MutableRefObject<{ x: number, y: number }>,
  userHasControlRef: React.MutableRefObject<boolean>,
  className?: string
}) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const animatePupil = () => {
      if (eyeRef.current && pupilRef.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        let activePos;
        if (fakeMouseActiveRef.current) {
          activePos = fakeMousePosRef.current;
        } else if (userHasControlRef.current) {
          activePos = mousePosRef.current;
        } else {
          // Keep it centered on the last fake position (which ends at center) or screen center
          activePos = fakeMousePosRef.current;
        }
        
        const angle = Math.atan2(activePos.y - eyeCenterY, activePos.x - eyeCenterX);
        const distance = Math.hypot(activePos.x - eyeCenterX, activePos.y - eyeCenterY);

        const maxMovement = (rect.width - (rect.width * 0.45)) / 2; 
        const moveDistance = Math.min(distance * 0.25, maxMovement);

        const pupilX = Math.cos(angle) * moveDistance;
        const pupilY = Math.sin(angle) * moveDistance;
        
        pupilRef.current.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      }
      animationFrameId = requestAnimationFrame(animatePupil);
    };

    animationFrameId = requestAnimationFrame(animatePupil);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div 
      ref={eyeRef}
      className={`${className} bg-white rounded-full flex items-center justify-center relative`}
    >
      <div 
        ref={pupilRef}
        className="w-[45%] aspect-square bg-black rounded-full transform-gpu transition-transform duration-75 ease-out"
      />
    </div>
  );
}
