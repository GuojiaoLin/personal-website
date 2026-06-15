import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 懒加载页面组件以优化性能
const Home = lazy(() => import('./pages/Home'));
const Photography = lazy(() => import('./pages/Photography'));
const Blog = lazy(() => import('./pages/Blog'));
const Projects = lazy(() => import('./pages/Projects'));
const About = lazy(() => import('./pages/About'));
const Conversation = lazy(() => import('./pages/Conversation'));
const Admin = lazy(() => import('./pages/Admin'));
const ProjectSmartHome = lazy(() => import('./pages/ProjectSmartHome'));
const ProjectWeb3 = lazy(() => import('./pages/ProjectWeb3'));

const App = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-[6px] border-[#FFFF00]/20 rounded-full"></div>
          <div className="absolute inset-0 border-[6px] border-[#FFFF00] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-slate-500 font-medium tracking-widest">正在进入林国娇的世界...</p>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/about" element={<About />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/project/momo-ai" element={<ProjectSmartHome />} />
        <Route path="/project/smart-home" element={<ProjectSmartHome />} />
        <Route path="/project/mmcsa" element={<ProjectWeb3 />} />
        <Route path="/project/web3" element={<Navigate to="/project/mmcsa" replace />} />
      </Routes>
    </Suspense>
  );
};


export default App;
