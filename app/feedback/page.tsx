"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconStar, IconStarFilled, IconMessageCircle, IconSparkles, IconUser } from "@tabler/icons-react";

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  category: string;
  rating: number;
  createdAt: Timestamp;
  status: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "general",
  });
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Real-time feedback listener
  useEffect(() => {
    const feedbackQuery = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData: Feedback[] = [];
      snapshot.forEach((doc) => {
        feedbackData.push({ id: doc.id, ...doc.data() } as Feedback);
      });
      setFeedbacks(feedbackData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        userEmail: user.email,
        title: formData.title,
        message: formData.message,
        category: formData.category,
        rating: rating,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      setSubmitted(true);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full mb-4">
            <IconSparkles className="w-5 h-5" />
            <span className="text-sm font-medium">We Value Your Opinion</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Share Your <span className="text-orange-500">Feedback</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Help us improve TrustHire by sharing your thoughts, suggestions, and experiences with our platform.
          </p>
        </motion.div>

        {/* Success Message */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl text-center"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Thank You!</h3>
            <p className="text-green-700">Your feedback has been submitted successfully.</p>
          </motion.div>
        )}

        {/* Feedback Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2 border-orange-100 shadow-xl shadow-orange-100/50">
            <CardHeader className="space-y-1 pb-6 border-b border-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <IconMessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-neutral-900">Feedback Form</CardTitle>
                  <CardDescription className="text-neutral-600">
                    Tell us what you think about TrustHire
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Section */}
                <div className="space-y-3">
                  <Label htmlFor="rating" className="text-base font-semibold text-neutral-900">
                    Overall Rating <span className="text-orange-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        {(hoverRating || rating) >= star ? (
                          <IconStarFilled className="w-10 h-10 text-orange-500" />
                        ) : (
                          <IconStar className="w-10 h-10 text-neutral-300" />
                        )}
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-3 text-lg font-semibold text-orange-500">
                        {rating} / 5
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-base font-semibold text-neutral-900">
                    Feedback Category
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: "general", label: "General", emoji: "💬" },
                      { value: "feature", label: "Feature Request", emoji: "✨" },
                      { value: "bug", label: "Bug Report", emoji: "🐛" },
                      { value: "ui", label: "UI/UX", emoji: "🎨" },
                    ].map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.value })}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          formData.category === category.value
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-neutral-200 hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.emoji}</div>
                        <div className="text-sm font-medium text-neutral-900">{category.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Input */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-semibold text-neutral-900">
                    Title <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Brief summary of your feedback"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="h-12 border-2 border-neutral-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Message Textarea */}
                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base font-semibold text-neutral-900">
                    Your Message <span className="text-orange-500">*</span>
                  </Label>
                  <textarea
                    id="message"
                    placeholder="Share your detailed feedback, suggestions, or concerns..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-colors resize-none"
                  />
                  <p className="text-sm text-neutral-500">
                    {formData.message.length} / 1000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || !formData.title || !formData.message || rating === 0}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 text-neutral-600 bg-white px-6 py-3 rounded-full border-2 border-neutral-100 shadow-sm">
            <IconSparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm">Your feedback helps us build a better platform for everyone</span>
          </div>
        </motion.div>

        {/* Feedback Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="border-2 border-orange-100 shadow-xl shadow-orange-100/50">
            <CardHeader className="border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <IconMessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-neutral-900">Recent Feedback</CardTitle>
                  <CardDescription className="text-neutral-600">
                    See what others are saying about TrustHire
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {feedbacks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <IconMessageCircle className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-neutral-500">No feedback yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50 border-b-2 border-orange-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">User</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Title</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Category</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Rating</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Message</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {feedbacks.map((feedback, index) => (
                        <motion.tr
                          key={feedback.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-orange-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                                <IconUser className="w-5 h-5 text-white" />
                              </div>
                              <div className="max-w-[150px]">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                  {feedback.userEmail.split('@')[0]}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">
                                  {feedback.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-neutral-900 max-w-[200px] truncate">
                              {feedback.title}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              feedback.category === 'general' ? 'bg-blue-100 text-blue-700' :
                              feedback.category === 'feature' ? 'bg-purple-100 text-purple-700' :
                              feedback.category === 'bug' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {feedback.category === 'general' ? '💬 General' :
                               feedback.category === 'feature' ? '✨ Feature' :
                               feedback.category === 'bug' ? '🐛 Bug' :
                               '🎨 UI/UX'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <IconStarFilled
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < feedback.rating ? 'text-orange-500' : 'text-neutral-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-semibold text-neutral-700">
                                {feedback.rating}/5
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-neutral-700 max-w-[300px] line-clamp-2">
                              {feedback.message}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-neutral-600">
                              {feedback.createdAt?.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {feedback.createdAt?.toDate().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
