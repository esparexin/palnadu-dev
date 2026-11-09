import Script from 'next/script';

interface GtmScriptsProps {
  gtmId: string;
}

export function GtmScripts({ gtmId }: GtmScriptsProps) {
  if (!gtmId) return null;

  return (
    <>
      {/* 1. Google Consent Mode v2 Default Configuration (synchronous inline before tags) */}
      <script
        id="google-consent-mode-init"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            try {
              var saved = localStorage.getItem('palnadu_consent_v2');
              if (saved) {
                gtag('consent', 'default', JSON.parse(saved));
              } else {
                gtag('consent', 'default', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied',
                  'ad_user_data': 'denied',
                  'ad_personalization': 'denied',
                  'wait_for_update': 500
                });
              }
            } catch (e) {
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
            }
          `,
        }}
      />

      {/* 2. Google Tag Manager Container Loader */}
      <Script id="gtm-container-loader" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  );
}

export function GtmNoscript({ gtmId }: GtmScriptsProps) {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
