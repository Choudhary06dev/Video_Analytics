import React from 'react';
import logo from '../../assets/logo.png';
import { APP_CONFIG } from '../../config';

export default function Logo({ className = "w-10 h-10", showText = true, isSidebarOpen = true, forceFullText = false }) {
  // If forceFullText is true, use full PROJECT_NAME, otherwise use "Video Analytics"
  const text = forceFullText ? APP_CONFIG.PROJECT_NAME : "Video Analytics";
  
  // Split the text to apply different colors if it starts with "Video"
  const firstWord = text.startsWith("Video") ? "Video" : "";
  const restOfText = text.startsWith("Video") ? text.substring(5) : text;

  return (
    <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} font-extrabold ${className}`}>
      <img src={logo} alt="Logo" className="h-full w-auto object-contain shrink-0" />
      {showText && isSidebarOpen && (
        <span className={`transition-all duration-300 leading-tight text-[1.1rem] whitespace-nowrap font-extrabold opacity-100`}>
          {firstWord && <span className="text-text-dark">{firstWord}</span>}
          <span className="text-accent">{restOfText}</span>
        </span>
      )}
    </div>
  );
}
