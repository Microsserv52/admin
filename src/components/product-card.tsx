"use client";
import { Button } from "@mui/material";
import { type Product } from "@/lib/contracts";
import { money } from "@/lib/api";
export function ProductCard({
  product,
  add,
}: {
  product: Product;
  add?: () => void;
}) {
  return (
    <article className="product-card">
      <a
        className="product-tile"
        href={"/store/product/?id=" + product.id}
        aria-label={"View " + product.name}
      >
        <span aria-hidden="true">{product.name.slice(0, 2).toUpperCase()}</span>
        <small>Product image unavailable</small>
      </a>
      <div className="product-card-info">
        <a className="product-title" href={"/store/product/?id=" + product.id}>
          {product.name}
        </a>
        <p className="muted">Per {product.unit}</p>
        <strong>{money(product.price)}</strong>
        {add && (
          <Button variant="outlined" onClick={add} fullWidth>
            Add to demo cart
          </Button>
        )}
      </div>
    </article>
  );
}
