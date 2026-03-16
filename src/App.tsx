import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GlobalStyle } from './globalStyles';
import { initFamilyForm } from './familyForm';
import { FamilyFormRenderer } from './components/FamilyFormRenderer';

const VIDEO_URL = 'https://media.mortadev.com/Flowerbed-Web.webm';
const DEFAULT_VOLUME = 0.1;

const AppShell = styled.div`
  min-height: 100vh;
  position: relative;
  isolation: isolate;
`;

const BackgroundVideo = styled.video`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -3;
  pointer-events: none;
`;

const BackgroundOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(7, 9, 12, 0.64), rgba(7, 9, 12, 0.76)),
    radial-gradient(circle at top right, rgba(0, 0, 0, 0.12), transparent 28%),
    radial-gradient(circle at bottom left, rgba(0, 0, 0, 0.18), transparent 30%);
`;

const MediaControls = styled.div`
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 5px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 12, 16, 0.52);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);

  input[type='range'] {
    width: 110px;
    accent-color: #d1b15c;
    cursor: pointer;
  }
`;

const MuteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
    width: 25px;
    height: 25px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #f5f0dd;
  font: inherit;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(209, 177, 92, 0.4);
    transform: translateY(-1px);
  }
`;

function App() {
  const didInitRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    initFamilyForm();
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mobileQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');

    const updateMobileState = (event?: MediaQueryListEvent) => {
      setIsMobileDevice(event ? event.matches : mobileQuery.matches);
    };

    updateMobileState();

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', updateMobileState);
      return () => mobileQuery.removeEventListener('change', updateMobileState);
    }

    mobileQuery.addListener(updateMobileState);
    return () => mobileQuery.removeListener(updateMobileState);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const effectiveMuted = isMobileDevice ? true : isMuted;
    const effectiveVolume = isMobileDevice ? 0 : volume;

    video.volume = effectiveVolume;
    video.muted = effectiveMuted;

    const playAttempt = async () => {
      try {
        await video.play();
      } catch {
        // Ignore autoplay failures silently to avoid affecting form behaviour.
      }
    };

    void playAttempt();
  }, [isMobileDevice, isMuted, volume]);

  return (
    <>
      <GlobalStyle />
      <AppShell className="family3-body">
        <BackgroundVideo
          ref={videoRef}
          aria-hidden="true"
          autoPlay
          loop
          muted={isMobileDevice ? true : isMuted}
          playsInline
          preload="auto"
          src={VIDEO_URL}
        />
        <BackgroundOverlay />

        {!isMobileDevice && (
          <MediaControls aria-label="Background video controls">
            <MuteButton
              aria-label={isMuted ? 'Unmute background video' : 'Mute background video'}
              onClick={() => setIsMuted((current) => !current)}
              type="button"
            >
              {isMuted ? '🔇' : '🔊'}
            </MuteButton>
            <input
              aria-label="Background video volume"
              max="1"
              min="0"
              onChange={(event) => setVolume(Number(event.target.value))}
              step="0.01"
              type="range"
              value={volume}
            />
          </MediaControls>
        )}

        <FamilyFormRenderer />
      </AppShell>
    </>
  );
}

export default App;
