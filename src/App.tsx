import { PortraitOnly } from './components/shared/PortraitOnly';
import { CountdownScreen } from './components/Countdown/CountdownScreen';
import { FinishedScreen } from './components/Finished/FinishedScreen';
import { RaceScreen } from './components/Race/RaceScreen';
import { SetupScreen } from './components/Setup/SetupScreen';
import { useRaceStore } from './store/raceStore';

export function App() {
  const phase = useRaceStore((s) => s.phase);

  return (
    <PortraitOnly>
      <div className="min-h-screen flex flex-col safe-pt safe-pb">
        {phase === 'setup' && <SetupScreen />}
        {phase === 'countdown' && <CountdownScreen />}
        {phase === 'race' && <RaceScreen />}
        {phase === 'finished' && <FinishedScreen />}
      </div>
    </PortraitOnly>
  );
}
