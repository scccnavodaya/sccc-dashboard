"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function AdminHomePage() {
  return (
    <div className="px-2 py-2">
      <div className="mx-auto w-full max-w-sm rounded-2xl border bg-white p-3 text-center shadow-sm">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-400 shadow-inner">
          {/* Fit fully, no cropping beyond its circle frame */}
          <Image
            src="/logo.jpeg"
            alt="Coaching Logo"
            width={160}
            height={160}
            className="h-full w-full object-contain"
            priority
            draggable={false}
          />
        </div>

        <motion.h1
          className="mt-2 text-[14px] font-bold leading-tight text-emerald-800"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          Success Career Coaching Centre
        </motion.h1>

        <p className="mt-1 text-[11px] leading-snug text-zinc-600">
          Moirang Phiwangbam Leikai, Bishnupur District, Manipur
        </p>

        <div className="mt-3 border-t border-zinc-100 pt-2">
          <p className="text-[10.5px] leading-tight text-zinc-500">
            Designed &amp; Developed by{" "}
            <span className="font-medium text-emerald-700">Karam Suresh</span>
          </p>
        </div>
      </div>
    </div>
  );
}
