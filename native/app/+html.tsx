import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark:dark" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>QUIZ Generator Portal</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent flash of unstyled content */
            :root {
              --background: 210 20% 98%;
              --foreground: 222.2 84% 4.9%;
            }
            .dark {
              --background: 221 39% 11%;
              --foreground: 210 40% 98%;
            }
            body { 
              height: 100%; 
              margin: 0;
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
              /* Prevent blank screens during transitions */
              transition: background-color 0.2s ease;
            }
            #root {
              height: 100%;
              background-color: hsl(var(--background));
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
