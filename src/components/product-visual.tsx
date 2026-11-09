"use client";
import Image from "next/image";
import { useState } from "react";
import { type Product } from "@/lib/contracts";

export function ProductVisual({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const image = product.image;
  return image && failed !== image.url ? (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      unoptimized
      priority={priority}
      onError={() => setFailed(image.url)}
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "1.2",
        objectFit: "cover",
        borderRadius: 4,
      }}
    />
  ) : (
    <>
      <span aria-hidden="true">{product.name.slice(0, 2).toUpperCase()}</span>
      <small>Product image unavailable</small>
    </>
  );
}
