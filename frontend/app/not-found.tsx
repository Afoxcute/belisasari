"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Custom404() {
  const router = useRouter();
  return (
    <div className="w-screen mt-20 flex flex-col items-center justify-center">
      <Image src="/belisasari.png" width={120} height={120} alt="Belisasari" className="rounded-full mb-4" />
      <p className="sen mt-4">
        Since you found me, you should probably be lost.
      </p>
      <p className="sen ">
        Click&nbsp;
        <span
          className="underline text-text-main font-semibold cursor-pointer hover:scale-105 transform transition"
          onClick={() => {
            router.push("/");
          }}
        >
          here
        </span>
        &nbsp;to go back home.
      </p>
    </div>
  );
}
