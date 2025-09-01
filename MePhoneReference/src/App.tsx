import { Phone } from './components/Phone';

export default function App() {
  return (
    <div className="size-full flex items-center justify-center bg-gray-100" style={{ padding: 'clamp(0.5rem, 2vw, 2rem)' }}>
      <div style={{ width: '100%', maxWidth: 'clamp(20rem, 40vw, 40rem)' }}>
        <Phone />
      </div>
    </div>
  );
}