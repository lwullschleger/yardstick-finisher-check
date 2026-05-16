import { PortraitOnly } from './components/shared/PortraitOnly';
import { CountdownScreen } from './components/Countdown/CountdownScreen';
import { FinishedScreen } from './components/Finished/FinishedScreen';
import { HelpScreen } from './components/Help/HelpScreen';
import { RaceScreen } from './components/Race/RaceScreen';
import { SetupScreen } from './components/Setup/SetupScreen';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { useRaceStore } from './store/raceStore';

export function App() {
  const phase = useRaceStore((s) => s.phase);

  return (
    <PortraitOnly>
      <div className="min-h-screen flex flex-col safe-pt safe-pb">
        {phase === 'welcome' && <WelcomeScreen />}
        {phase === 'setup' && <SetupScreen />}
        {phase === 'help' && <HelpScreen />}
        {phase === 'countdown' && <CountdownScreen />}
        {phase === 'race' && <RaceScreen />}
        {phase === 'finished' && <FinishedScreen />}
      </div>
    </PortraitOnly>
  );
}
