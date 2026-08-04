import './globals.css';

export const metadata = {
  title: 'Coursing — Marketing, laid course by course',
  description:
    'AI marketing automation for hardscaping companies. Weekly product updates and monthly promotions, written and sent for you.',
};

// Without this, mobile browsers (Safari especially) assume a desktop-width
// page and scale the whole thing down to fit the screen — producing tiny
// text and a squished, "wonky" layout on phones even though the site looks
// completely normal on desktop. This tells the browser to render at the
// device's actual width instead.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
