import { AuthProvider } from './contexts/AuthContext';
import { AuthFlow } from './components/AuthFlow';

function App() {
  return (
    <AuthProvider>
      <AuthFlow />
    </AuthProvider>
  );
}

export default App;
