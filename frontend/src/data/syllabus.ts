export interface Topic {
  id: string;
  number: string;
  title: string;
}

export interface Chapter {
  id: string;
  number: string;
  name: string;
  statusLabel: string;
  activitiesCount: number;
  topics: Topic[];
}

export const chaptersData: Chapter[] = [
  { 
    id: 'chapter-1', 
    number: 'Ch-01',
    name: 'Force and Pressure', 
    statusLabel: 'Interactive content live', 
    activitiesCount: 15,
    topics: [
      { id: 't-1-1', number: '01', title: 'Introduction to Forces' },
      { id: 't-1-2', number: '02', title: 'Contact vs. Non-Contact Forces' },
      { id: 't-1-3', number: '03', title: 'Gravitational Force Fields' },
      { id: 't-1-4', number: '04', title: 'Electrostatic Attraction' },
      { id: 't-1-5', number: '05', title: 'Magnetic Polar Forces' },
      { id: 't-1-6', number: '06', title: 'The Concept of Pressure' },
      { id: 't-1-7', number: '07', title: 'Pressure in Liquids' },
      { id: 't-1-8', number: '08', title: 'Atmospheric Pressure Dynamics' },
      { id: 't-1-9', number: '09', title: 'Barometric Measurements' },
      { id: 't-1-10', number: '10', title: 'Balanced & Unbalanced Vectors' },
      { id: 't-1-11', number: '11', title: 'Hydraulic Lift Principles' },
      { id: 't-1-12', number: '12', title: 'Buoyant Forces & Archimedes' },
      { id: 't-1-13', number: '13', title: 'Fluid Viscoelasticity' },
      { id: 't-1-14', number: '14', title: 'Surface Tension Mechanics' },
      { id: 't-1-15', number: '15', title: 'Practical Pressure Systems' }
    ]
  },
  { 
    id: 'chapter-2', 
    number: 'Ch-02',
    name: 'Friction and Resistance', 
    statusLabel: 'Custom variables enabled', 
    activitiesCount: 15,
    topics: [
      { id: 't-2-1', number: '01', title: 'Nature of Microscopic Friction' },
      { id: 't-2-2', number: '02', title: 'Factors Affecting Friction' },
      { id: 't-2-3', number: '03', title: 'Static vs. Kinetic Coefficient' },
      { id: 't-2-4', number: '04', title: 'Sliding and Rolling Friction' },
      { id: 't-2-5', number: '05', title: 'Fluid Friction & Drag Forces' },
      { id: 't-2-6', number: '06', title: 'Friction as a Positive Agent' },
      { id: 't-2-7', number: '07', title: 'Wear, Tear & Thermal Decay' },
      { id: 't-2-8', number: '08', title: 'Acoustic Sound of Friction' },
      { id: 't-2-9', number: '09', title: 'Lubricants and Viscous Layers' },
      { id: 't-2-10', number: '10', title: 'Ball Bearings & Rotors' },
      { id: 't-2-11', number: '11', title: 'Increasing Grip and Safety' },
      { id: 't-2-12', number: '12', title: 'Heat Dissipation Calculations font' },
      { id: 't-2-13', number: '13', title: 'Interlocking Surface Fibres' },
      { id: 't-2-14', number: '14', title: 'Angle of Repose in Granuels' },
      { id: 't-2-15', number: '15', title: 'Automotive Brake Systems' }
    ]
  },
  { 
    id: 'chapter-3', 
    number: 'Ch-03',
    name: 'Sound and Acoustics', 
    statusLabel: 'Vibration simulation ready', 
    activitiesCount: 15,
    topics: [
      { id: 't-3-1', number: '01', title: 'Vibratory Sources of Sound' },
      { id: 't-3-2', number: '02', title: 'Media Waves and Propagation' },
      { id: 't-3-3', number: '03', title: 'Propagation in Vacuum Void' },
      { id: 't-3-4', number: '04', title: 'Anatomy of the Human Ear' },
      { id: 't-3-5', number: '05', title: 'Amplitude & Sound Energy' },
      { id: 't-3-6', number: '06', title: 'Time Period and Frequency' },
      { id: 't-3-7', number: '07', title: 'Pitch, Loudness & Decibels' },
      { id: 't-3-8', number: '08', title: 'Audible Spectral Range' },
      { id: 't-3-9', number: '09', title: 'Noise Pollution Thresholds' },
      { id: 't-3-10', number: '10', title: 'Acoustic Control & Dampeners' },
      { id: 't-3-11', number: '11', title: 'Echoes and Wave Reflection' },
      { id: 't-3-12', number: '12', title: 'Medium Densities & Speeds' },
      { id: 't-3-13', number: '13', title: 'Ultrasound Scan Principles' },
      { id: 't-3-14', number: '14', title: 'Resonant Tuning Forks' },
      { id: 't-3-15', number: '15', title: 'Supersonic Shock Waves' }
    ]
  },
  { 
    id: 'chapter-4', 
    number: 'Ch-04',
    name: 'Chemical Effects of Current', 
    statusLabel: 'Circuit loops loaded', 
    activitiesCount: 15,
    topics: [
      { id: 't-4-1', number: '01', title: 'Liquid Electrical Conductivity' },
      { id: 't-4-2', number: '02', title: 'LED Testers for Weak Current' },
      { id: 't-4-3', number: '03', title: 'Chemical Dissociation in Water' },
      { id: 't-4-4', number: '04', title: 'Electrolytic Decomposition' },
      { id: 't-4-5', number: '05', title: 'Anodes and Cathodes Setup' },
      { id: 't-4-6', number: '06', title: 'Faraday Electrodes Exchange' },
      { id: 't-4-7', number: '07', title: 'Electroplating of Copper/Chrome' },
      { id: 't-4-8', number: '08', title: 'Industrial Plating Standards' },
      { id: 't-4-9', number: '09', title: 'Ions and Free Charge Carriers' },
      { id: 't-4-10', number: '10', title: 'Corrosion Prevention Layers' },
      { id: 't-4-11', number: '11', title: 'Conduction of Acidic Solutions' },
      { id: 't-4-12', number: '12', title: 'Liquid vs. Metallic Vectors' },
      { id: 't-4-13', number: '13', title: 'Active Chemical Cells' },
      { id: 't-4-14', number: '14', title: 'Galvanic Charge Transfer' },
      { id: 't-4-15', number: '15', title: 'Electrodialysis Safeguards' }
    ]
  },
  { 
    id: 'chapter-5', 
    number: 'Ch-05',
    name: 'Light Reflection and Optics', 
    statusLabel: 'Optics raytracing live', 
    activitiesCount: 15,
    topics: [
      { id: 't-5-1', number: '01', title: 'Specular & Diffuse Reflection' },
      { id: 't-5-2', number: '02', title: 'Laws of Incident Rays' },
      { id: 't-5-3', number: '03', title: 'Lateral Inversion in Mirrors' },
      { id: 't-5-4', number: '04', title: 'Multiple Images & Kaleidoscopes' },
      { id: 't-5-5', number: '05', title: 'Anatomy of the Human Eye' },
      { id: 't-5-6', number: '06', title: 'Light Entry & Pupil Control' },
      { id: 't-5-7', number: '07', title: 'Retinal Cone and Rod Cells' },
      { id: 't-5-8', number: '08', title: 'Persistence of Vision Theory' },
      { id: 't-5-9', number: '09', title: 'Spectacular Rainbow Dispersion' },
      { id: 't-5-10', number: '10', title: 'Concave vs. Convex Mirrors' },
      { id: 't-5-11', number: '11', title: 'Myopic and Hyperopic Defect' },
      { id: 't-5-12', number: '12', title: 'Focal Length Computations' },
      { id: 't-5-13', number: '13', title: 'Correction with Eyewear' },
      { id: 't-5-14', number: '14', title: 'Cataract Optical Cloudiness' },
      { id: 't-5-15', number: '15', title: 'Tactile Braille Code Fonts' }
    ]
  },
  { 
    id: 'chapter-6', 
    number: 'Ch-06',
    name: 'Atmospheric Phenomena', 
    statusLabel: 'Lightning model enabled', 
    activitiesCount: 15,
    topics: [
      { id: 't-6-1', number: '01', title: 'Static Charging by Friction' },
      { id: 't-6-2', number: '02', title: 'Positive and Negative Charges' },
      { id: 't-6-3', number: '03', title: 'The Gold Leaf Electroscope' },
      { id: 't-6-4', number: '04', title: 'Charge Induction Mechanisms' },
      { id: 't-6-5', number: '05', title: 'Atmospheric Discharge Fields' },
      { id: 't-6-6', number: '06', title: 'Lightning Bolt Formation' },
      { id: 't-6-7', number: '07', title: 'Lightning Conductors & Poles' },
      { id: 't-6-8', number: '08', title: 'Safety During Summer Storms' },
      { id: 't-6-9', number: '09', title: 'Ionization of Gas Molecules' },
      { id: 't-6-10', number: '10', title: 'Tectonic Stress Build-up' },
      { id: 't-6-11', number: '11', title: 'Epicenter and Focus Points' },
      { id: 't-6-12', number: '12', title: 'Seismic Shock Waves' },
      { id: 't-6-13', number: '13', title: 'Richter Scale Calibration' },
      { id: 't-6-14', number: '14', title: 'Seismograph Needle Recording' },
      { id: 't-6-15', number: '15', title: 'Earthquake Action Safezones' }
    ]
  },
  { 
    id: 'chapter-7', 
    number: 'Ch-07',
    name: 'Stars and Solar System', 
    statusLabel: 'Cosmic modeller live', 
    activitiesCount: 15,
    topics: [
      { id: 't-7-1', number: '01', title: 'Lunar Phases and Shadows' },
      { id: 't-7-2', number: '02', title: 'Surface Topology of Moon' },
      { id: 't-7-3', number: '03', title: 'Ursa Major and Constellations' },
      { id: 't-7-4', number: '04', title: 'The Pole Star Orientation' },
      { id: 't-7-5', number: '05', title: 'Solar Mass and Gravity Core' },
      { id: 't-7-6', number: '06', title: 'Terrestrial Inner Planets' },
      { id: 't-7-7', number: '07', title: 'Gas Giants and Ring Systems' },
      { id: 't-7-8', number: '08', title: 'The Rocky Asteroid Belt' },
      { id: 't-7-9', number: '09', title: 'Eccentric Cometary Paths' },
      { id: 't-7-10', number: '10', title: 'Meteors & Atmospheric Friction' },
      { id: 't-7-11', number: '11', title: 'Orbits of Artificial Satellites' },
      { id: 't-7-12', number: '12', title: 'Light Year Distance Scale' },
      { id: 't-7-13', number: '13', title: 'Elliptical & Spiral Galaxies' },
      { id: 't-7-14', number: '14', title: 'Solar Radiation Pressures' },
      { id: 't-7-15', number: '15', title: 'Space Voyagers & Telemetry' }
    ]
  },
  { 
    id: 'chapter-8', 
    number: 'Ch-08',
    name: 'Electromagnetism & Loops', 
    statusLabel: 'Magnetic field active', 
    activitiesCount: 15,
    topics: [
      { id: 't-8-1', number: '01', title: 'Current Carrying Fields' },
      { id: 't-8-2', number: '02', title: 'The Right-Hand Grip Rule' },
      { id: 't-8-3', number: '03', title: 'Constructing Electromagnets' },
      { id: 't-8-4', number: '04', title: 'Ferromagnetic Soft Cores' },
      { id: 't-8-5', number: '05', title: 'Solenoid Flux Densities' },
      { id: 't-8-6', number: '06', title: 'Structure of the Electric Bell' },
      { id: 't-8-7', number: '07', title: 'Atmospheric Spark Suppressors' },
      { id: 't-8-8', number: '08', title: 'Magnetic Levitation Sleds' },
      { id: 't-8-9', number: '09', title: 'Faradays Induction Discoveries' },
      { id: 't-8-10', number: '10', title: 'Relative Motion Voltage' },
      { id: 't-8-11', number: '11', title: 'Earths Geomagnetic Suffix' },
      { id: 't-8-12', number: '12', title: 'Alternating Induction Loops' },
      { id: 't-8-13', number: '13', title: 'Dynamic Microphones' },
      { id: 't-8-14', number: '14', title: 'Copper Coil Turn Counts' },
      { id: 't-8-15', number: '15', title: 'Industrial Metal Cranes' }
    ]
  },
  { 
    id: 'chapter-9', 
    number: 'Ch-09',
    name: 'Heat & Thermal Expansion', 
    statusLabel: 'Thermal flow loaded', 
    activitiesCount: 15,
    topics: [
      { id: 't-9-1', number: '01', title: 'Atomic Amplitude and Heat' },
      { id: 't-9-2', number: '02', title: 'Metallic Contact Conduction' },
      { id: 't-9-3', number: '03', title: 'Buoyant Convection Currents' },
      { id: 't-9-4', number: '04', title: 'Infra-Red Thermal Radiation' },
      { id: 't-9-5', number: '05', title: 'Coastal Breezes Cycle' },
      { id: 't-9-6', number: '06', title: 'Insulation & Heat Enclosures' },
      { id: 't-9-7', number: '07', title: 'Linear Expansion of Alloys' },
      { id: 't-9-8', number: '08', title: 'Anomalous Water Densities' },
      { id: 't-9-9', number: '09', title: 'Thermal Energy Specific Heat' },
      { id: 't-9-10', number: '10', title: 'Mercury & Alcohol Glass Tubes' },
      { id: 't-9-11', number: '11', title: 'Latent Fusion Phase Changes' },
      { id: 't-9-12', number: '12', title: 'Atmospheric Greenhouse Warmth' },
      { id: 't-9-13', number: '13', title: 'Absorbency of Dark Mattes' },
      { id: 't-9-14', number: '14', title: 'Calorimeter Heat Exchange' },
      { id: 't-9-15', number: '15', title: 'Bimetallic Strip Thermostats' }
    ]
  },
  { 
    id: 'chapter-10', 
    number: 'Ch-10',
    name: 'Waves and Fluid Mechanics', 
    statusLabel: 'Fluid models active', 
    activitiesCount: 15,
    topics: [
      { id: 't-10-1', number: '01', title: 'Fluid Shearing & Viscosity' },
      { id: 't-10-2', number: '02', title: 'Buoyant Submersion Force' },
      { id: 't-10-3', number: '03', title: 'Density of Saline Waters' },
      { id: 't-10-4', number: '04', title: 'Downward Liquid Pressure columns' },
      { id: 't-10-5', number: '05', title: 'Pascals Equal Distribution' },
      { id: 't-10-6', number: '06', title: 'Longitudinal vs. Transverse' },
      { id: 't-10-7', number: '07', title: 'Crests, Troughs and Nodes' },
      { id: 't-10-8', number: '08', title: 'Velocity of Water Ripples' },
      { id: 't-10-9', number: '09', title: 'Hydraulic Piston Systems' },
      { id: 't-10-10', number: '10', title: 'Terminal Velocity of Drops' },
      { id: 't-10-11', number: '11', title: 'Surface Energy Coefficients' },
      { id: 't-10-12', number: '12', title: 'Capillary Action in Tubes' },
      { id: 't-10-13', number: '13', title: 'Streamline vs. Turbulent Flow' },
      { id: 't-10-14', number: '14', title: 'Speed of Sound in Water' },
      { id: 't-10-15', number: '15', title: 'Floating Submarine Ballasts' }
    ]
  }
];
