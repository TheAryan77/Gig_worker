// app/components/Navbar.tsx (or src/components/Navbar.tsx)

"use client";

// import div from "next/div";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const Router = useRouter();
  const pathname = usePathname();
  
  const hideSignUp = pathname === "/choice" || pathname === "/signup" || pathname.startsWith("/freelancer") || pathname.startsWith("/client");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Try to get user's name from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || userData.fullName || currentUser.email?.split('@')[0] || "User");
          } else {
            setUserName(currentUser.email?.split('@')[0] || "User");
          }
        } catch (error) {
          setUserName(currentUser.email?.split('@')[0] || "User");
        }
      } else {
        setUser(null);
        setUserName("");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Router.push("/");
      setShowDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 text-2xl font-bold text-orange-500">
            <div className="font-bold underline cursor-pointer" onClick={() => Router.push("/")}>
              Trust<span className="text-black">Hire</span>
            </div>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            
  
            <ConnectWalletButton showBalance={true} showNetwork={false} />
            {!hideSignUp && !user && (
              <button onClick={()=>{
                  Router.push("/choice")
              }} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-white hover:text-orange-500 hover:border hover:border-orange-500 cursor-pointer transition">
                Sign Up
              </button>
            )}
            {user && (
              <div 
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer transition flex items-center gap-2">
                  <div className="w-8 h-8 bg-white text-orange-500 rounded-full flex items-center justify-center font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{userName}</span>
                </div>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 text-neutral-700 hover:text-orange-600 transition flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
    </nav>
  );
}