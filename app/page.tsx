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
import {AnimatedTestimonialsDemo} from "./components/FeedbackComponent"
import { FollowerPointerCard } from "@/components/ui/following-pointer";

export default function Home() {
  return (
    <div>
      <FollowerPointerCard title="Find your??">
        <Hero/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="Our Services">
        <DraggableCardDemo/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="Proof of Work!">
        <Check/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="How it works?">
        <TimelineDemo/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="What Users Say?">
        <AnimatedTestimonialsDemo/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="Global Connection">
        <Services/>
      </FollowerPointerCard>
      
      <FollowerPointerCard title="TrustHire">
        <TextHoverEffectDemo/>
      </FollowerPointerCard>
    </div>
  );
}
