import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="bg-background" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>QUIZ Generator Portal</title>
        <ScrollViewStyleReset />
      </head>
      <body style={{ height: '100%', margin: 0 }}>{children}</body>
    </html>
  );
}
