export interface ExploreActivity {
  id: string; // Dynamic task id, e.g. 'exp_phy_c3_t1_Video'
  type: 'Video' | 'Simulation' | 'Quiz';
  typeLabel: string;
  statusKey: string; // Local storage status key, e.g. 'status_exp_phy_c3_t1_Video'
}

export interface ExploreTopic {
  id: string; // e.g. 'phy_c3_t1'
  title: string;
  activities: ExploreActivity[];
}

export interface ExploreChapter {
  id: string; // e.g. 'c1', 'c2', 'c3', 'c4'
  chapterNum: number;
  title: string;
  description: string;
  topics: ExploreTopic[];
}

export interface ExploreSubject {
  name: string; // Physics, Chemistry, etc.
  code: string; // phy, chm, mat, bio
  chapters: ExploreChapter[];
}

export const EXPLORE_SUBJECTS: ExploreSubject[] = [
  {
    name: 'Physics',
    code: 'phy',
    chapters: [
      {
        id: 'c1',
        chapterNum: 1,
        title: 'Motion',
        description: 'Understand speed, velocity, acceleration, and equations of linear kinematics.',
        topics: [
          {
            id: 'phy_c1_t1',
            title: 'Concept of Distance and Displacement',
            activities: [
              { id: 'exp_phy_c1_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c1_t1_Video' },
              { id: 'exp_phy_c1_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c1_t1_Quiz' }
            ]
          },
          {
            id: 'phy_c1_t2',
            title: 'Velocity and Uniform Acceleration',
            activities: [
              { id: 'exp_phy_c1_t2_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c1_t2_Video' },
              { id: 'exp_phy_c1_t2_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_phy_c1_t2_Simulation' },
              { id: 'exp_phy_c1_t2_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c1_t2_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c2',
        chapterNum: 2,
        title: 'Forces',
        description: 'Learn Newton\'s laws of motion, types of friction, and contact vs non-contact forces.',
        topics: [
          {
            id: 'phy_c2_t1',
            title: 'Newton\'s First Law & Inertia',
            activities: [
              { id: 'exp_phy_c2_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c2_t1_Video' },
              { id: 'exp_phy_c2_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c2_t1_Quiz' }
            ]
          },
          {
            id: 'phy_c2_t2',
            title: 'Friction and Air Resistance',
            activities: [
              { id: 'exp_phy_c2_t2_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c2_t2_Video' },
              { id: 'exp_phy_c2_t2_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_phy_c2_t2_Simulation' },
              { id: 'exp_phy_c2_t2_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c2_t2_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c3',
        chapterNum: 3,
        title: 'Buoyancy',
        description: 'Delve into fluids pressure, upthrust force, floating, sinking, and Archimedes\' principle.',
        topics: [
          {
            id: 'phy_c3_t1',
            title: 'Introduction to Buoyancy',
            activities: [
              { id: 'exp_phy_c3_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c3_t1_Video' },
              { id: 'exp_phy_c3_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c3_t1_Quiz' }
            ]
          },
          {
            id: 'phy_c3_t2',
            title: 'Archimedes\' Principle',
            activities: [
              { id: 'exp_phy_c3_t2_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c3_t2_Video' },
              { id: 'exp_phy_c3_t2_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_phy_c3_t2_Simulation' },
              { id: 'exp_phy_c3_t2_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c3_t2_Quiz' }
            ]
          },
          {
            id: 'phy_c3_t3',
            title: 'Floating and Sinking',
            activities: [
              { id: 'exp_phy_c3_t3_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c3_t3_Video' },
              { id: 'exp_phy_c3_t3_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_phy_c3_t3_Simulation' },
              { id: 'exp_phy_c3_t3_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c3_t3_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c4',
        chapterNum: 4,
        title: 'Energy',
        description: 'Explore kinetic energy, potential energy, mechanical work, and conservative forces.',
        topics: [
          {
            id: 'phy_c4_t1',
            title: 'Work-Energy Theorem',
            activities: [
              { id: 'exp_phy_c4_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_phy_c4_t1_Video' },
              { id: 'exp_phy_c4_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_phy_c4_t1_Quiz' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Chemistry',
    code: 'chm',
    chapters: [
      {
        id: 'c1',
        chapterNum: 1,
        title: 'Atomic Structure',
        description: 'Discover the nucleus, electron orbitals, quantum numbers, and chemical isotopes.',
        topics: [
          {
            id: 'chm_c1_t1',
            title: 'Subatomic Particles',
            activities: [
              { id: 'exp_chm_c1_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_chm_c1_t1_Video' },
              { id: 'exp_chm_c1_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_chm_c1_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c2',
        chapterNum: 2,
        title: 'Periodic Table',
        description: 'Analyze periodic trends: ionization energy, atomic radius, and electron affinity.',
        topics: [
          {
            id: 'chm_c2_t1',
            title: 'Group Trends and Periods',
            activities: [
              { id: 'exp_chm_c2_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_chm_c2_t1_Video' },
              { id: 'exp_chm_c2_t1_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_chm_c2_t1_Simulation' },
              { id: 'exp_chm_c2_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_chm_c2_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c3',
        chapterNum: 3,
        title: 'Chemical Reactions',
        description: 'Equation balancing, stoichiometry limits, and combustion vs redox pathways.',
        topics: [
          {
            id: 'chm_c3_t1',
            title: 'Types of Chemical Reactions',
            activities: [
              { id: 'exp_chm_c3_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_chm_c3_t1_Video' },
              { id: 'exp_chm_c3_t1_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_chm_c3_t1_Simulation' },
              { id: 'exp_chm_c3_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_chm_c3_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c4',
        chapterNum: 4,
        title: 'Acids & Bases',
        description: 'Differentiate pH scales, Bronsted-Lowry pairs, and acid-base titrations.',
        topics: [
          {
            id: 'chm_c4_t1',
            title: 'The pH Scale & Strong Acids',
            activities: [
              { id: 'exp_chm_c4_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_chm_c4_t1_Video' },
              { id: 'exp_chm_c4_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_chm_c4_t1_Quiz' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Mathematics',
    code: 'mat',
    chapters: [
      {
        id: 'c1',
        chapterNum: 1,
        title: 'Algebra',
        description: 'Solve polynomial inequalities, quadratic roots, and systems of linear equations.',
        topics: [
          {
            id: 'mat_c1_t1',
            title: 'Quadratic Equations & Complex Roots',
            activities: [
              { id: 'exp_mat_c1_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_mat_c1_t1_Video' },
              { id: 'exp_mat_c1_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_mat_c1_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c2',
        chapterNum: 2,
        title: 'Trigonometry',
        description: 'Explore Unit circles, fundamental trigonometric identities, and algebraic expansions.',
        topics: [
          {
            id: 'mat_c2_t1',
            title: 'The Unit Circle',
            activities: [
              { id: 'exp_mat_c2_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_mat_c2_t1_Video' },
              { id: 'exp_mat_c2_t1_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_mat_c2_t1_Simulation' },
              { id: 'exp_mat_c2_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_mat_c2_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c3',
        chapterNum: 3,
        title: 'Calculus',
        description: 'Evaluate limits, analytical derivatives, chain rule, and integrals calculation.',
        topics: [
          {
            id: 'mat_c3_t1',
            title: 'Limits & Differentiation',
            activities: [
              { id: 'exp_mat_c3_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_mat_c3_t1_Video' },
              { id: 'exp_mat_c3_t1_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_mat_c3_t1_Simulation' },
              { id: 'exp_mat_c3_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_mat_c3_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c4',
        chapterNum: 4,
        title: 'Probability',
        description: 'Learn combinations theory, conditional probability, and independent outcomes.',
        topics: [
          {
            id: 'mat_c4_t1',
            title: 'Conditional Probability Formulas',
            activities: [
              { id: 'exp_mat_c4_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_mat_c4_t1_Video' },
              { id: 'exp_mat_c4_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_mat_c4_t1_Quiz' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Biology',
    code: 'bio',
    chapters: [
      {
        id: 'c1',
        chapterNum: 1,
        title: 'Cell Structure',
        description: 'Analyze cell membranes, nucleus organelles, ribosomes and cell wall structures.',
        topics: [
          {
            id: 'bio_c1_t1',
            title: 'Organelles of Eukaryotes',
            activities: [
              { id: 'exp_bio_c1_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_bio_c1_t1_Video' },
              { id: 'exp_bio_c1_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_bio_c1_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c2',
        chapterNum: 2,
        title: 'Human Body Systems',
        description: 'Circulatory, digestive, oxygen pathways, nervous system, and systemic homeostasis.',
        topics: [
          {
            id: 'bio_c2_t1',
            title: 'Digestive System Structure',
            activities: [
              { id: 'exp_bio_c2_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_bio_c2_t1_Video' },
              { id: 'exp_bio_c2_t1_Simulation', type: 'Simulation', typeLabel: 'Simulation', statusKey: 'status_exp_bio_c2_t1_Simulation' },
              { id: 'exp_bio_c2_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_bio_c2_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c3',
        chapterNum: 3,
        title: 'Genetics',
        description: 'Meiosis cell division, DNA double-helix, inheritance squares, and alleles analysis.',
        topics: [
          {
            id: 'bio_c3_t1',
            title: 'Mendellian Inheritance Basics',
            activities: [
              { id: 'exp_bio_c3_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_bio_c3_t1_Video' },
              { id: 'exp_bio_c3_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_bio_c3_t1_Quiz' }
            ]
          }
        ]
      },
      {
        id: 'c4',
        chapterNum: 4,
        title: 'Plant Biology',
        description: 'Examine photosynthesis pathways, cell wall structures, chloroplasts, and stomata.',
        topics: [
          {
            id: 'bio_c4_t1',
            title: 'Photosynthesis Light Reactions',
            activities: [
              { id: 'exp_bio_c4_t1_Video', type: 'Video', typeLabel: 'Watch Video', statusKey: 'status_exp_bio_c4_t1_Video' },
              { id: 'exp_bio_c4_t1_Quiz', type: 'Quiz', typeLabel: 'Quiz', statusKey: 'status_exp_bio_c4_t1_Quiz' }
            ]
          }
        ]
      }
    ]
  }
];
