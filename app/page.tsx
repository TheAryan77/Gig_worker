import Image from "next/image";
import Appbar from "./components/Appbar";
import Hero from "./components/Hero";
import CompareDemo from "./components/CodePreview";
import CardSection from "./components/CardSection";
import Check from "./components/check";
import { TimelineDemo } from "./components/Timelinedemo";
import CodeBlockDemo from "./components/Codeblock";
import {DraggableCardDemo} from "./components/DraggableCard";
import TextHoverEffectDemo from "./components/Footer"
import Check2 from "./components/Check2";
import Services  from "./components/Services";
export default function Home() {
  return (
    <div>
      <Hero/>
      <DraggableCardDemo/>
      <Check/>
      <TimelineDemo/>
      <Services/>
{/* <Check2/> */}
<TextHoverEffectDemo/>
    </div>
  );
}
