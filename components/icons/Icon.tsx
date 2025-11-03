import React from 'react';

// This is a mapping of icon names to their SVG path data.
// Using a library like lucide-react is a great alternative for production apps,
// but for this self-contained project, a manual map is clear and dependency-free.
// SVGs are sourced from or inspired by Feather Icons (https://feathericons.com/).
const ICONS: { [key: string]: React.ReactNode } = {
  home: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'check-square': <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  calendar: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></>,
  'graduation-cap': <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 4 3 10 0v-5"/></>,
  'bar-chart-3': <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  'edit-3': <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  'trash-2': <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  'list-plus': <><path d="M11 12H3M16 6H3M16 18H3M18 9v6M21 12h-6" /></>,
  'user-plus': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></>,
  'list-checks': <><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></>,
  'download-cloud': <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></>,
  'upload-cloud': <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 17-4-4-4 4"/></>,
  'file-spreadsheet': <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h1"/><path d="M15 13h1"/><path d="M8 17h1"/><path d="M15 17h1"/><path d="M12 10v10"/><path d="M8 13v1"/><path d="M8 17v1"/><path d="M15 13v1"/><path d="M15 17v1"/></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  'arrow-left': <path d="m12 19-7-7 7-7M19 12H5" />,
  'arrow-right': <path d="m5 12 7-7 7 7M5 12h14" />,
  cake: <><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2"/><path d="M20 16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2"/><path d="M12 4V2"/><path d="M12 8V6"/><path d="m8 4 1.5 1.5"/><path d="m14.5 5.5 1.5-1.5"/></>,
  google: <>
    <path d="M21.4,12.2c0-0.8-0.1-1.5-0.2-2.2H12v4.2h5.3c-0.2,1.4-1,2.5-2.4,3.3v2.7h3.5C20.4,18.1,21.4,15.4,21.4,12.2z" fill="#4285F4" />
    <path d="M12,22c2.8,0,5.1-0.9,6.8-2.5l-3.5-2.7c-0.9,0.6-2.1,1-3.3,1c-2.5,0-4.7-1.7-5.5-4H2.9v2.8C4.6,19.9,8,22,12,22z" fill="#34A853" />
    <path d="M6.5,13.8c-0.2-0.6-0.3-1.2-0.3-1.8s0.1-1.2,0.3-1.8V7.4H2.9C2.3,8.6,2,10.3,2,12s0.3,3.4,0.9,4.6L6.5,13.8z" fill="#FBBC05" />
    <path d="M12,6.2c1.5,0,2.9,0.5,3.9,1.5l3.1-3.1C17.1,2.8,14.8,2,12,2C8,2,4.6,4.1,2.9,7.4l3.6,2.8C7.3,7.9,9.5,6.2,12,6.2z" fill="#EA4335" />
  </>,
  'check-circle-2': <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></>,
  'x-circle': <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
  'pie-chart': <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
  'book-marked': <path d="M4 19.5V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15.5l-7-4-7 4Z" />,
};

type IconProps = {
  name: string;
} & React.SVGProps<SVGSVGElement>;

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const iconContent = ICONS[name] || <circle cx="12" cy="12" r="10" />; // Default to a circle if icon not found
  const isGoogleIcon = name === 'google';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isGoogleIcon ? undefined : "none"}
      stroke={isGoogleIcon ? undefined : "currentColor"}
      strokeWidth={isGoogleIcon ? undefined : "2"}
      strokeLinecap={isGoogleIcon ? undefined : "round"}
      strokeLinejoin={isGoogleIcon ? undefined : "round"}
      {...props}
    >
      {iconContent}
    </svg>
  );
};

export default Icon;