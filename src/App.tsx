import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GlobalStyle } from './globalStyles';
import { initFamilyForm } from './familyForm';
import { FamilyFormRenderer } from './components/FamilyFormRenderer';

const AppShell = styled.div`
  min-height: 100vh;
`;

function App() {
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    initFamilyForm();
  }, []);

  return (
    <>
      <GlobalStyle />
      <AppShell className="family3-body">
        <FamilyFormRenderer />
      </AppShell>
    </>
  );
}

export default App;
