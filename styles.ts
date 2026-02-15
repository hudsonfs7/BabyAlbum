
/**
 * Centralized Visual Standards for the Application
 * Focus: High tenderness, baby room, clouds, cotton, and physical album feel.
 */

export const VISUAL_STANDARDS = {
  // Typography
  h1: "text-3xl font-bold tracking-tight font-display drop-shadow-sm",
  h2: "text-2xl font-semibold font-display drop-shadow-sm",
  h3: "text-xl font-medium font-display",
  p: "text-base leading-relaxed font-medium",
  caption: "text-sm italic font-medium opacity-60",
  
  // Layout
  container: "max-w-md mx-auto min-h-screen pb-20 relative",
  card: "rounded-[2.5rem] p-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border-[4px] theme-transition bg-white/95 backdrop-blur-sm relative",
  modal: "fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/70 backdrop-blur-xl",
  
  // Elements - Cloud & Cotton inspired
  button: "px-10 py-5 rounded-[2.5rem] font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(0,0,0,0.1)] border-b-4 border-black/5",
  input: "w-full px-8 py-4 rounded-[2.5rem] border-4 focus:outline-none focus:ring-8 transition-all bg-white/80 shadow-inner",
  
  // Navigation
  navItem: "flex flex-col items-center justify-center gap-0.5 transition-all active:scale-110",
  
  // Themes
  themes: {
    BOY: {
      primary: "bg-blue-300",
      secondary: "bg-blue-50",
      accent: "text-blue-500",
      bg: "bg-[#e0f2fe]", // Soft sky blue
      text: "text-blue-900",
      border: "border-blue-100",
      focusRing: "focus:ring-blue-100/50",
      buttonText: "text-white",
      pattern: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z' fill='%23bae6fd' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
    },
    GIRL: {
      primary: "bg-pink-300",
      secondary: "bg-pink-50",
      accent: "text-pink-500",
      bg: "bg-[#fdf2f8]", // Soft petal pink
      text: "text-pink-900",
      border: "border-pink-100",
      focusRing: "focus:ring-pink-100/50",
      buttonText: "text-white",
      pattern: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z' fill='%23fbcfe8' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
    }
  }
};
