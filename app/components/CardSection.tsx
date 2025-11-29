import { CanvasRevealEffectDemo } from "./CanvasRevealEffectDemo";

// Full-width, full-viewport card section with orange background.
// If Tailwind's orange palette isn't showing, ensure Tailwind is configured
// and the file path is included in tailwind.config content globs.
const CardSection = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <h2></h2>
      <CanvasRevealEffectDemo />
    </div>
  );
};

export default CardSection;