"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import photos from "@/lib/gallery.json";

export function Gallery({ items = photos }: { items?: typeof photos }) {
  const photos = items;
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = photos[selected];
  const move = (step: number) => setSelected((value) => (value + step + photos.length) % photos.length);
  return <>
    <div className="photo-grid">{photos.map((photo, index) => <button key={photo.src} className="gallery-tile" aria-label={`Open BSS event photo ${index + 1}, ${photo.name}`} onClick={() => { setSelected(index); dialog.current?.showModal(); }}><Image src={photo.src} alt={`BSS event photograph ${index + 1}`} width={photo.width} height={photo.height} sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw" /><span>View photo <span aria-hidden="true">↗</span></span></button>)}</div>
    <dialog ref={dialog} className="photo-dialog" aria-label="BSS photo viewer" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => { if (event.key === "ArrowRight") move(1); if (event.key === "ArrowLeft") move(-1); }}>
      <div className="photo-dialog-inner"><div className="photo-toolbar"><p aria-live="polite">{selected + 1} / {photos.length}</p><button type="button" className="button button-outline" onClick={() => dialog.current?.close()} autoFocus>Close ×</button></div><div className="photo-full"><Image src={photo.src} alt={`BSS event photograph ${selected + 1}, ${photo.name}`} fill sizes="90vw" /></div><div className="photo-toolbar"><button className="button button-outline" onClick={() => move(-1)}>← Previous</button><a href={photo.original} target="_blank" rel="noopener noreferrer" className="text-link">Original photo ↗</a><button className="button button-outline" onClick={() => move(1)}>Next →</button></div></div>
    </dialog>
  </>;
}
