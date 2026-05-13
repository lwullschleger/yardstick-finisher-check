import { SlideToConfirm } from '../shared/SlideToConfirm';

interface Props {
  onFinish: () => void;
}

export function FinishedSlider({ onFinish }: Props) {
  return <SlideToConfirm label="Slide to Finish" variant="primary" onConfirm={onFinish} />;
}
