import React from 'react';
import { APP_CONFIG } from '../../config';

export default function Footer() {
  return (
    <footer className="mt-8 py-6 border-t border-slate-200 text-center shrink-0">
      <p className="text-sm text-slate-500">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">{APP_CONFIG.PROJECT_NAME}</span>. All rights reserved.
      </p>
    </footer>
  );
}
