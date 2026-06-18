const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const eyeContent = `import React, { useEffect, useRef } from 'react';\n\n` + content.match(/function Eye\(.*?\n\}/s)[0];
fs.writeFileSync('src/components/Eye.tsx', eyeContent.replace(/export function Eye/g, 'function Eye').replace('function Eye', 'export function Eye'));

const faqContent = `import React, { useState } from 'react';\nimport { motion } from 'motion/react';\n\n` + content.match(/function FAQItem\(.*?\n\}/s)[0];
fs.writeFileSync('src/components/FAQItem.tsx', faqContent.replace(/export function FAQItem/g, 'function FAQItem').replace('function FAQItem', 'export function FAQItem'));

let landingContent = `import React, { useState, useEffect, useRef } from 'react';\nimport { motion } from 'motion/react';\nimport { ArrowRight, Instagram, Github } from 'lucide-react';\nimport { useNavigate } from 'react-router-dom';\nimport { Eye } from '../components/Eye';\nimport { FAQItem } from '../components/FAQItem';\n\n` + content.match(/function LandingPage\(\) \{.*?\n\}(?=\n\nfunction OnboardingPage|\n\nexport default function App)/s)[0];
landingContent = landingContent.replace(/export function LandingPage/g, 'function LandingPage').replace('function LandingPage', 'export function LandingPage');
fs.writeFileSync('src/pages/LandingPage.tsx', landingContent);

const appContent = `import React from 'react';\nimport { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport { LandingPage } from './pages/LandingPage';\nimport { OnboardingPage } from './pages/OnboardingPage';\nimport { StudentLoginPage } from './pages/StudentLoginPage';\nimport { StudentSignupPage } from './pages/StudentSignupPage';\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<LandingPage />} />\n        <Route path="/onboarding" element={<OnboardingPage />} />\n        <Route path="/login/student" element={<StudentLoginPage />} />\n        <Route path="/signup/student" element={<StudentSignupPage />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}\n`;
fs.writeFileSync('src/App.tsx', appContent);
