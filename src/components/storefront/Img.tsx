"use client";

import { useEffect, useState } from "react";

/**
 * Drop-in <img> that never shows a broken icon:
 *  - swaps to `fallback` on load error (and on an empty/missing src)
 *  - if the fallback also fails, fades to a neutral tint
 *  - lazy-loads and decodes async by default
 */
type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string;
  fallback?: string;
};

export function Img({ src, fallback, alt = "", style, ...rest }: ImgProps) {
  const [current, setCurrent] = useState<string | undefined>(src || fallback);
  const [dead, setDead] = useState(false);

  useEffect(() => {
    setCurrent(src || fallback);
    setDead(false);
  }, [src, fallback]);

  if (dead) {
    return <span aria-label={alt} style={{ display: "block", width: "100%", height: "100%", background: "#EDE9E2", ...style }} />;
  }

  return (
    <img
      {...rest}
      alt={alt}
      src={current}
      loading={rest.loading ?? "lazy"}
      decoding={rest.decoding ?? "async"}
      style={style}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
        else setDead(true);
      }}
    />
  );
}
