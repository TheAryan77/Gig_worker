import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function AnimatedTestimonialsDemo() {
  const testimonials = [
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
    }
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}
