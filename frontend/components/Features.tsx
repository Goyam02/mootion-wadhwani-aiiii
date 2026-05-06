import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Video, ScanLine, BrainCircuit, Globe, Zap } from 'lucide-react';

const features = [
  {
    id: 0,
    title: "OCR Lab",
    subtitle: "Vision Intelligence",
    description: "High-precision text extraction pipeline.",
    icon: ScanLine,
    videoPlaceholder: "bg-gradient-to-br from-gray-900 to-gray-800"
  },
  {
    id: 1,
    title: "Video Forge",
    subtitle: "AI Content Gen",
    description: "Next-gen automated content creation.",
    icon: Video,
    videoPlaceholder: "bg-gradient-to-br from-gray-900 to-brand-black"
  },
  {
    id: 2,
    title: "Quiz Arena",
    subtitle: "Gamified Learning",
    description: "Real-time multiplayer interaction layer.",
    icon: BrainCircuit,
    videoPlaceholder: "bg-gradient-to-br from-gray-900 to-gray-800"
  },
  {
    id: 3,
    title: "Neural Grid",
    subtitle: "Infrastructure",
    description: "Decentralized processing nodes.",
    icon: Globe,
    videoPlaceholder: "bg-gradient-to-br from-gray-900 to-gray-800"
  },
  {
    id: 4,
    title: "Fast Pipe",
    subtitle: "Delivery System",
    description: "Ultra-low latency streaming.",
    icon: Zap,
    videoPlaceholder: "bg-gradient-to-br from-gray-900 to-gray-800"
  }
];

const Features: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="features" className="py-24 px-6 relative z-20 bg-[#0A0A0A]/90 backdrop-blur-xl rounded-t-[3rem] md:rounded-t-[5rem] -mt-20 border-t border-white/5 flex flex-col overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Heading - Aligned Left */}
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-16 md:mb-24 text-left"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Our <span className="text-brand-neon">Core Engine.</span>
          </h2>
          <p className="text-gray-400 max-w-xl text-lg">
            Hover over the modules to see them in action.
          </p>
        </motion.div>
        
        {/* Fan Layout Container */}
        {/* Centered relative to the max-width container */}
        <div className="relative w-full h-[320px] md:h-[420px] flex justify-center items-center">
            {features.map((feature, index) => {
                 const isHovered = hoveredIndex === index;
                 // Calculate static layout based on index relative to center (index 2)
                 const offsetFromCenter = index - 2; // -2, -1, 0, 1, 2
                 
                 // Desktop spacing logic
                 // Reduced spacing to match smaller card width
                 // 100px for desktop (was 140), 70px for mobile
                 const xBase = offsetFromCenter * (typeof window !== 'undefined' && window.innerWidth < 768 ? 70 : 100); 
                 
                 // Arch effect: center is higher (y=0), edges are lower (y > 0)
                 const yBase = Math.abs(offsetFromCenter) * 12; 
                 // Rotation fan effect
                 const rotateBase = offsetFromCenter * 5; 
                 // Base scale: center larger
                 const scaleBase = 1 - Math.abs(offsetFromCenter) * 0.05;
                 // Z-index stacking: center on top
                 const zBase = 10 - Math.abs(offsetFromCenter);

                 return (
                   <motion.div
                     key={feature.id}
                     onMouseEnter={() => setHoveredIndex(index)}
                     onMouseLeave={() => setHoveredIndex(null)}
                     initial={false}
                     animate={{
                        x: xBase, // Horizontal position is static in this layout
                        y: isHovered ? -60 : yBase, // Pop UP on hover (less aggression)
                        scale: isHovered ? 1.15 : scaleBase,
                        rotate: isHovered ? 0 : rotateBase, // Straighten on hover
                        zIndex: isHovered ? 50 : zBase,
                     }}
                     transition={{ 
                         type: "spring", 
                         stiffness: 400, 
                         damping: 25,
                         mass: 0.8
                     }}
                     // Reduced sizes: w-[180px] md:w-[220px] (was 260/320)
                     className="absolute w-[180px] md:w-[220px] aspect-[3/4] rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl cursor-pointer overflow-hidden group origin-bottom"
                     style={{
                         boxShadow: isHovered 
                            ? '0 25px 50px -12px rgba(204, 255, 0, 0.15)' 
                            : '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
                     }}
                   >
                     {/* Video/Image Container */}
                     <div className="w-full h-full relative">
                         {/* Placeholder Background */}
                         <div className={`absolute inset-0 ${feature.videoPlaceholder} transition-opacity duration-500 ${isHovered ? 'opacity-20' : 'opacity-100'}`} />
                         
                         {/* Default State: Icon & Title */}
                         <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-all duration-300 ${isHovered ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                            <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center mb-3 border border-white/10 backdrop-blur-sm">
                                <feature.icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{feature.subtitle}</p>
                         </div>

                         {/* Hover State: Video Placeholder */}
                         <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                             {/* USER: REPLACE THIS WITH <video src="..." autoPlay loop muted className="w-full h-full object-cover" /> */}
                             <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                                 <div className="absolute inset-0 bg-grid-white opacity-20" />
                                 <div className="flex flex-col items-center gap-2 z-10">
                                     <Play className="text-brand-neon fill-brand-neon animate-pulse" size={32} />
                                     <span className="text-[8px] font-mono text-brand-neon uppercase tracking-widest">Preview</span>
                                 </div>
                             </div>
                             
                             {/* Overlay Info on Hover */}
                             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                                 <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                                 <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{feature.description}</p>
                             </div>
                         </div>
                     </div>
                   </motion.div>
                 );
            })}
        </div>
      </div>
    </section>
  );
};

export default Features;