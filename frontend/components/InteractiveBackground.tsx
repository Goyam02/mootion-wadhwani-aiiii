import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const InteractiveBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        // Map directly to client coordinates for 1:1 feel initially
        // We'll adjust the centering in the transform
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  // Spring configs
  // Ultra responsive for the main light
  const springConfigMain = { damping: 15, stiffness: 150, mass: 0.1 }; 
  // Floating feel for ambient
  const springConfigSlow = { damping: 100, stiffness: 30, mass: 3 };

  const x1 = useSpring(mouseX, springConfigMain);
  const y1 = useSpring(mouseY, springConfigMain);

  const x2 = useSpring(mouseX, springConfigSlow);
  const y2 = useSpring(mouseY, springConfigSlow);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-brand-black">
        {/* Static Grid */}
        <div className="absolute inset-0 bg-grid-white opacity-40" />

        {/* Main "Flashlight" Blob - Follows cursor tightly */}
        {/* We use negative margins to center the blob on the cursor */}
        <motion.div 
            style={{ x: x1, y: y1 }}
            className="absolute top-0 left-0 w-[800px] h-[800px] -ml-[400px] -mt-[400px] bg-brand-neon rounded-full opacity-[0.15] blur-[120px] mix-blend-screen will-change-transform"
        />
        
        {/* Secondary Ambient Blob - Lags behind for depth */}
        <motion.div 
            style={{ x: x2, y: y2 }}
            className="absolute top-0 left-0 w-[1000px] h-[1000px] -ml-[500px] -mt-[500px] bg-brand-neon rounded-full opacity-[0.05] blur-[150px] mix-blend-screen will-change-transform"
        />

        {/* Static Ambient Light - Bottom Right */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-brand-neon rounded-full opacity-[0.08] blur-[150px]" />
    </div>
  );
};

export default InteractiveBackground;