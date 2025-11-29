import React from "react";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

export function DraggableCardDemo() {
  const items = [
    {
      title: "Plumber",
      image:
"https://scoutnetworkblog.com/wp-content/uploads/2018/11/Plumber-Sink-201709-003.jpg",
      className: "absolute  top-10 left-[20%] rotate-[-5deg]",
    },
    
    {
      title: "Labour",
      image:
"https://b4182786.smushcdn.com/4182786/wp-content/uploads/2022/12/services.jpg?lossy=2&strip=1&webp=1",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
    },
    {
        title: "Coder",
        image:
        "https://images.prismic.io/turing/652ec6fefbd9a45bcec81a1f_Coder_a63a8aeefd.webp?auto=format,compress",
        className: "absolute top-24 left-[45%] rotate-[-7deg]",
    },
    {
      title: "Home Cleaner",
      image:
"https://deax38zvkau9d.cloudfront.net/prod/assets/images/uploads/services/1653287385who-needs-house-cleaning-services.jpg",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    {
      title: "Electrician",
      image:
"https://gacservices.com/wp-content/uploads/2018/01/electrician-working-on-electrical-panel-circuit-breaker-box.jpg",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    
    {
      title: "Freelancer",
      image:
"https://www.4cornerresources.com/wp-content/uploads/2022/11/Freelancer-working-at-coffee-shop-scaled.jpeg",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
  ];
  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
      <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-orange-400 md:text-4xl dark:text-neutral-800">
        Get any work done,
        <br />
         I mean "any"!!
      </p>
      {items.map((item) => (
        <DraggableCardBody className={item.className}>
          <img
            src={item.image}
            alt={item.title}
            className="pointer-events-none relative z-10 h-80 w-80 object-cover"
          />
          <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  );
}
