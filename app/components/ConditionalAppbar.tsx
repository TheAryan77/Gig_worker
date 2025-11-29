"use client";

import { usePathname } from "next/navigation";
import Appbar from "./Appbar";

export default function ConditionalAppbar() {
  const pathname = usePathname();
  
  // Hide appbar on freelancer, client, worker, and project routes
  const hideAppbar = pathname.startsWith("/freelancer") || 
                     pathname.startsWith("/client") || 
                     pathname.startsWith("/project") ||
                     pathname.startsWith("/worker");
  
  if (hideAppbar) {
    return null;
  }
  
  return <Appbar />;
}
