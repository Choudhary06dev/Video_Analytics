import React from 'react';
import { APP_CONFIG } from '../../config';

export default function Footer() {
  return (
    <footer className="mt-8 py-6 border-t border-border text-center shrink-0">
      <p className="text-sm text-text-gray">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-text-dark">{APP_CONFIG.PROJECT_NAME}</span>. All rights reserved.
      </p>
    </footer>
  );
}
