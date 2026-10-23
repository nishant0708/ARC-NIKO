import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { apolloClient } from '@/models/apollo';
import { ThemeProvider } from '@/controllers/useTheme';
import { DrillProvider } from '@/controllers/useDrill';
import { AppShell } from '@/views/layout/AppShell';
import { ExecutiveScreen } from '@/views/screens/ExecutiveScreen';
import { ClientManagersScreen } from '@/views/screens/ClientManagersScreen';
import { PipelineScreen } from '@/views/screens/PipelineScreen';
import { Cm360Screen } from '@/views/screens/Cm360Screen';
import { ExceptionsScreen } from '@/views/screens/ExceptionsScreen';

function RedirectHome() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/executive', search }} replace />;
}

export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <BrowserRouter>
          <DrillProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/executive" element={<ExecutiveScreen />} />
                <Route path="/client-managers" element={<ClientManagersScreen />} />
                <Route path="/pipeline" element={<PipelineScreen />} />
                <Route path="/cm360" element={<Cm360Screen />} />
                <Route path="/exceptions" element={<ExceptionsScreen />} />
                <Route path="*" element={<RedirectHome />} />
              </Route>
            </Routes>
          </DrillProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  );
}
