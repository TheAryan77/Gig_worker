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
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI",
      description: "Pay using any UPI app",
      icon: IconQrcode,
      popular: true,
    },
    {
      id: "card",
      name: "Card",
      description: "Debit/Credit Card",
      icon: IconCreditCard,
      popular: false,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "All major banks",
      icon: IconBuilding,
      popular: false,
    },
  ];

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // In production, you would create an order on your backend first
      // For demo, we'll use Razorpay's test mode
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_demo", // Your Razorpay Key ID
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "TrustHire",
        description: `Payment for ${projectTitle}`,
        image: "/logo.png",
        handler: function (response: any) {
          // Payment successful
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id || "demo_order");
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          project: projectTitle,
          worker: freelancerName,
        },
        theme: {
          color: "#22C55E", // Green theme for workers
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
        method: {
          upi: selectedMethod === "upi",
          card: selectedMethod === "card",
          netbanking: selectedMethod === "netbanking",
          wallet: false,
          paylater: false,
        },
      };

      if (razorpayLoaded && window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response.error);
          setProcessing(false);
        });
        razorpay.open();
      } else {
        // Fallback: Simulate payment for demo
        await simulatePayment();
      }
    } catch (error) {
      console.error("Payment error:", error);
      setProcessing(false);
    }
  };

  // Simulate payment for demo purposes
  const simulatePayment = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSuccess(mockPaymentId, mockOrderId);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
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
        <p className="text-green-100 text-sm">
          Pay securely using UPI, Cards, or Net Banking
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
            <span className="text-neutral-600 dark:text-neutral-400">Worker</span>
            <span className="text-neutral-900 dark:text-white font-medium">{freelancerName}</span>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                Total Amount
              </span>
              <div className="flex items-center gap-1 text-green-500 font-bold text-2xl">
                <IconCurrencyRupee className="w-6 h-6" />
                {amount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Select Payment Method
          </p>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as any)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  selectedMethod === method.id
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedMethod === method.id
                      ? "bg-green-500 text-white"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {method.name}
                    </span>
                    {method.popular && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <IconCheck className="w-5 h-5 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* UPI Quick Pay Option */}
        {selectedMethod === "upi" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6"
          >
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
                Quick UPI Options
              </p>
              <div className="flex gap-3 flex-wrap">
                {["gpay", "phonepe", "paytm", "bhim"].map((app) => (
                  <div
                    key={app}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">
                      {app === "gpay" ? "Google Pay" : app === "phonepe" ? "PhonePe" : app}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-2">
                  Or enter UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-neutral-500 text-sm">
          <IconLock className="w-4 h-4" />
          <span>256-bit SSL Secured Payment</span>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <IconCurrencyRupee className="w-5 h-5" />
              Pay ₹{amount.toLocaleString("en-IN")}
            </>
          )}
        </button>

        <p className="text-center text-xs text-neutral-500 mt-4">
          By proceeding, you agree to TrustHire&apos;s payment terms and conditions
        </p>
      </div>
    </div>
  );
}
