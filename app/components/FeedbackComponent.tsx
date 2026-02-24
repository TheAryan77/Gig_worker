import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "TrustHire is a decentralized freelancing platform built to bridge the gap between clients and skilled professionals through a secure, transparent, and blockchain-powered ecosystem. This project was created with the vision of making remote collaboration safer, more efficient, and accessible to everyone.",
      name: "Aryan Mahendru",
      designation: "Developer of TrustHire",
      src: "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/author2.png?raw=true",
    },
    {
      quote:
        "The escrow system completely changed how we work with freelancers. Payments are transparent, milestones are clear, and disputes are practically non-existent. This platform brings real trust into remote collaboration.",
      name: "Anmol Anand",
      designation: "Student at ABES",
      src: "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/anmol.png?raw=true",
    },
    {
      quote:
        "I often need helpers for my godown work, but payment and attendance used to be messy. With this platform, tasks are tracked properly and payment happens as agreed. It saves time and avoids misunderstandings.",
      name: "Nikhil Mahendru",
      designation: "Founder at Mahendru Pustak Bhandar",
      src: "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/nikhil.png?raw=true",
    },
    {
      quote:
        "Earlier, we had to wait days or even weeks for payments. With this platform, the work is recorded, and money comes on time after each stage. There is no confusion, no arguments — just fair work and fair pay.",
      name: "Ram Lal",
      designation: "Labour at Construction Sites",
      src: "https://media.istockphoto.com/id/2127751798/photo/senior-worker-in-construction-building-site.jpg?s=612x612&w=0&k=20&c=zuNUVlKcmbKRIGRWWpfslGg12xs4aFeQ2EyPEuqmapc=",
    },
    {

      quote:
        "For the first time, I don’t worry about clients disappearing after delivery. The milestone-based payments and automated releases make freelancing stress-free and professional.",
      name: "Rahul",
      designation: "Founder at ScaleUp Systems",
      src: "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/rahul.png?raw=true",
    },
    {
      quote:
        "The AI-assisted verification is a game changer. Even without deep technical knowledge, I can confidently approve work knowing the quality checks are already done.",
      name: "Harish Suthar",
      designation: "Full Stack Developer (Freelancer)",
      src:
        "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/harish.png?raw=true"
    },
    {
      quote:
        "I often found difficulty while founding freelancers for my websites. Now, I can easily find and hire skilled freelancers for my projects. This platform is a game-changer!",
      name: "Satyam Mehta",
      designation: "Founder at Euphoric",
      src:
        "https://github.com/TheAryan77/Shivanshu-s-Project-/blob/main/Satyam.jpeg?raw=true"
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}
