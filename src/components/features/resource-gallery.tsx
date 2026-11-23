"use client";
import { useRef, useState } from "react";
import Image from "next/image";
export function ResourceGallery({ id, name }: { id: string; name: string }) {
  const [detail, setDetail] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const picture = (
    <Image
      unoptimized
      src={"/instruments/" + id + ".svg"}
      width={480}
      height={240}
      alt={"Technical illustration of " + name}
    />
  );
  return (
    <section className="resource-gallery" aria-label="Equipment gallery">
      <div className="gallery-stage" data-detail={detail}>
        {picture}
      </div>
      <div className="gallery-bar">
        {["Overview", "Detail"].map((label, i) => (
          <button
            key={label}
            aria-pressed={detail === !!i}
            className="button button-outline"
            onClick={() => setDetail(!!i)}
          >
            {label}
          </button>
        ))}
        <button
          className="text-link"
          onClick={() => modal.current?.showModal()}
        >
          Enlarge drawing
        </button>
      </div>
      <dialog className="art-dialog" ref={modal} aria-label={name + " drawing"}>
        {picture}
        <form method="dialog">
          <button className="button button-outline">Close drawing</button>
        </form>
      </dialog>
    </section>
  );
}
