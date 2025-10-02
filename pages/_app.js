// import '../styles/global.css';

// export default function App({ Component, pageProps }) {
//   return <Component {...pageProps} />;
// }


// C:\sanket\email-campaign-next\pages\_app.js
import '../styles/global.css'; // ✅ Correct placement

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
