// "use client";

// import { useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import {
//   Field,
//   FieldDescription,
//   FieldGroup,
//   FieldLabel,
// } from "@/components/ui/field"
// import { Input } from "@/components/ui/input"

// export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const role = searchParams.get("role") || "client";
//   const freelancerType = searchParams.get("type"); // "coder" or null
//   const workerCategory = searchParams.get("category"); // worker category

//   // Determine the actual role for display and storage
//   const isWorker = role === "worker";
//   const isCoder = role === "freelancer" && freelancerType === "coder";

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({
//       ...formData,
//       [e.target.id]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     // Validation
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }

//     if (formData.password.length < 8) {
//       setError("Password must be at least 8 characters long");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Create user with Firebase Auth
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         formData.email,
//         formData.password
//       );

//       const user = userCredential.user;

//       // Update user profile with display name
//       await updateProfile(user, {
//         displayName: formData.name,
//       });

//       // Determine actual role for storage
//       let storedRole = role;
//       if (isWorker) {
//         storedRole = "worker";
//       } else if (isCoder) {
//         storedRole = "freelancer";
//       }

//       // Store user data in Firestore
//       const userData: Record<string, unknown> = {
//         uid: user.uid,
//         name: formData.name,
//         email: formData.email,
//         role: storedRole,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       };

//       // Add worker-specific data
//       if (isWorker && workerCategory) {
//         userData.workerCategory = workerCategory;
//         userData.userType = "worker";
//       }

//       // Add freelancer (coder) specific data
//       if (isCoder) {
//         userData.userType = "coder";
//       }

//       await setDoc(doc(db, "users", user.uid), userData);

//       // Redirect based on role
//       if (isWorker) {
//         router.push("/worker/profile-setup");
//       } else if (isCoder || role === "freelancer") {
//         router.push("/freelancer/profile-setup");
//       } else {
//         router.push("/client/dashboard");
//       }
//     } catch (err: unknown) {
//       const error = err as { code?: string; message?: string };
//       console.error("Signup error:", error);
      
//       // Handle specific Firebase errors
//       switch (error.code) {
//         case "auth/email-already-in-use":
//           setError("This email is already registered. Please sign in instead.");
//           break;
//         case "auth/invalid-email":
//           setError("Please enter a valid email address.");
//           break;
//         case "auth/weak-password":
//           setError("Password is too weak. Please use a stronger password.");
//           break;
//         default:
//           setError(error.message || "An error occurred during signup. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get display text based on role
//   const getRoleDisplay = () => {
//     if (isWorker && workerCategory) {
//       // Capitalize first letter of each word
//       const categoryName = workerCategory
//         .split("-")
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//         .join(" ");
//       return `Worker - ${categoryName}`;
//     }
//     if (isCoder) {
//       return "Freelancer (Coder)";
//     }
//     if (role === "freelancer") {
//       return "Freelancer";
//     }
//     return "Client";
//   };

//   return (
//     <Card className="text-orange-500" {...props}>
//       <CardHeader>
//         <CardTitle>Create an account</CardTitle>
//         <CardDescription>
//           Signing up as a {getRoleDisplay()}
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit}>
//           <FieldGroup>
//             {error && (
//               <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
//                 {error}
//               </div>
//             )}
//             <Field>
//               <FieldLabel htmlFor="name">Full Name</FieldLabel>
//               <Input 
//                 id="name" 
//                 type="text" 
//                 placeholder="Aryan Mahendru" 
//                 value={formData.name}
//                 onChange={handleChange}
//                 disabled={loading}
//                 required 
//               />
//             </Field>
//             <Field>
//               <FieldLabel htmlFor="email">Email</FieldLabel>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="aryanmahendru7@gmail.com"
//                 value={formData.email}
//                 onChange={handleChange}
//                 disabled={loading}
//                 required
//               />
//             </Field>
//             <Field>
//               <FieldLabel htmlFor="password">Password</FieldLabel>
//               <Input 
//                 id="password" 
//                 type="password" 
//                 value={formData.password}
//                 onChange={handleChange}
//                 disabled={loading}
//                 required 
//               />
//               <FieldDescription>
//                 Must be at least 8 characters long.
//               </FieldDescription>
//             </Field>
//             <Field>
//               <FieldLabel htmlFor="confirmPassword">
//                 Confirm Password
//               </FieldLabel>
//               <Input 
//                 id="confirmPassword" 
//                 type="password" 
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 disabled={loading}
//                 required 
//               />
//               <FieldDescription>Please confirm your password.</FieldDescription>
//             </Field>
//             <FieldGroup>
//               <Field>
//                 <Button 
//                   className="bg-orange-500 w-full disabled:opacity-50" 
//                   type="submit"
//                   disabled={loading}
//                 >
//                   {loading ? "Creating Account..." : "Create Account"}
//                 </Button>
//                 <FieldDescription className="px-6 text-center">
//                   Already have an account? <a href="/login" className="text-orange-500 hover:underline">Sign in</a>
//                 </FieldDescription>
//               </Field>
//             </FieldGroup>
//           </FieldGroup>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }
