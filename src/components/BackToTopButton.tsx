import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 480);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    setIsPressed(true);
    window.setTimeout(() => setIsPressed(false), 220);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`fixed bottom-6 right-6 z-50 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#FFFF00] text-black transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:bg-[#FFFF00] active:-translate-y-2 active:scale-110 active:bg-[#FFFF00] focus:-translate-y-1 focus:scale-105 focus:bg-[#FFFF00] focus:outline-none ${
        isPressed
          ? '-translate-y-2 scale-110 opacity-100'
          : isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-100 opacity-0'
      }`}
      aria-label="回到页面顶部"
      title="回到页面顶部"
      onClick={scrollToTop}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
};
