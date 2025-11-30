"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  IconCreditCard,
  IconQrcode,
  IconBuilding,
  IconCheck,
  IconLock,
  IconCurrencyRupee,
  IconX,
} from "@tabler/icons-react";

interface RazorpayPaymentProps {
  amount: number; // Amount in INR
  projectTitle: string;
  freelancerName: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onCancel: () => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  amount,
  projectTitle,
  freelancerName,
  onSuccess,
  onCancel,
  processing,
  setProcessing,
}: RazorpayPaymentProps) {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError("Failed to load payment gateway");
    document.body.appendChild(script);

    return () => {
      // Don't remove the script as it might be needed elsewhere
    };
  }, []);

  // Auto-trigger payment when component mounts and Razorpay is loaded
  useEffect(() => {
    if (razorpayLoaded && !processing) {
      handlePayment();
    }
  }, [razorpayLoaded]);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError("Payment gateway is loading...");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create order on backend first - REQUIRED for UPI to work
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: "INR",
          projectTitle: projectTitle,
          freelancerName: freelancerName,
        }),
      });

      let orderId = null;
      let orderAmount = amount * 100;
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        orderId = orderData.order?.id;
        orderAmount = orderData.order?.amount || amount * 100;
        console.log("Order created:", orderId);
      } else {
        const errorData = await orderResponse.json();
        console.error("Order creation failed:", errorData);
        // Continue without order - UPI might not work but cards will
      }

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RlRpj56bL4sS2e",
        amount: orderAmount,
        currency: "INR",
        name: "TrustHire",
        description: `Payment for ${projectTitle}`,
        handler: function (response: any) {
          console.log("Payment success:", response);
          onSuccess(
            response.razorpay_payment_id, 
            response.razorpay_order_id || orderId || `order_${Date.now()}`
          );
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: "Pay using UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "collect", "intent"],
                  },
                ],
              },
              other: {
                name: "Other payment methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.utib", "block.other"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        notes: {
          project: projectTitle,
          freelancer: freelancerName,
        },
        theme: {
          color: "#F97316",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed");
            setProcessing(false);
            onCancel();
          },
          escape: true,
          backdropclose: false,
        },
      };

      // Only add order_id if we have one - required for UPI QR
      if (orderId) {
        options.order_id = orderId;
      }

      console.log("Opening Razorpay with options:", { ...options, key: "***", order_id: orderId ? "present" : "missing" });
      
      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        setError(response.error.description || "Payment failed. Please try again.");
        setProcessing(false);
      });
      
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      setError("Failed to initialize payment. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <IconLock className="w-8 h-8" />
            <h2 className="text-xl font-bold">Secure Payment</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-orange-100 text-sm">
          Pay securely via Razorpay
        </p>
      </div>

      <div className="p-6">
        {/* Payment Summary */}
        <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-neutral-600 dark:text-neutral-400">Project</span>
            <span className="text-neutral-900 dark:text-white font-medium text-right max-w-[200px] truncate">
              {projectTitle}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-neutral-600 dark:text-neutral-400">Freelancer</span>
            <span className="text-neutral-900 dark:text-white font-medium">{freelancerName}</span>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                Total Amount
              </span>
              <div className="flex items-center gap-1 text-orange-500 font-bold text-2xl">
                <IconCurrencyRupee className="w-6 h-6" />
                {amount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {processing ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Opening Razorpay checkout...
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Please complete payment in the popup window
            </p>
          </div>
        ) : (
          <>
            {/* Payment Methods Info */}
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
                Available Payment Methods
              </p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-700">
                  <IconQrcode className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">UPI / QR</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  <IconCreditCard className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Cards</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  <IconBuilding className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">NetBanking</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                💡 GPay, PhonePe, Paytm & QR code available in checkout
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 text-neutral-500 text-sm">
              <IconLock className="w-4 h-4" />
              <span>256-bit SSL Secured by Razorpay</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!razorpayLoaded}
              className="w-full py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {!razorpayLoaded ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <IconCurrencyRupee className="w-5 h-5" />
                  Pay ₹{amount.toLocaleString("en-IN")}
                </>
              )}
            </button>
          </>
        )}

        <p className="text-center text-xs text-neutral-500 mt-4">
          Powered by Razorpay • UPI, Cards, NetBanking accepted
        </p>
      </div>
    </div>
  );
}
