import Image from "next/image";
import Appbar from "./components/Appbar";
import Hero from "./components/Hero";
import CompareDemo from "./components/CodePreview";
import CardSection from "./components/CardSection";
import Check from "./components/check";
import { TimelineDemo } from "./components/Timelinedemo";
import {DraggableCardDemo} from "./components/DraggableCard";
import TextHoverEffectDemo from "./components/Footer"
import Services  from "./components/Services";
export default function Home() {
  return (
    <div>
      <Hero/>
      <DraggableCardDemo/>
      <TimelineDemo/>
      <Check/>
      <Services/>
<TextHoverEffectDemo/>
    </div>
  );
}
