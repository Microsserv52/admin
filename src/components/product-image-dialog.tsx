"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { productSchema, type Product } from "@/lib/contracts";
import { Failure } from "@/components/feedback";

const ticketSchema = z.object({
  uploadId: z.uuid(),
  uploadUrl: z.url(),
  uploadHeaders: z.object({ "If-None-Match": z.literal("*") }).optional(),
});
const maxBytes = 5 * 1024 * 1024;
export function ProductImageDialog({
  product,
  close,
}: {
  product: Product;
  close: () => void;
}) {
  const client = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [preview, setPreview] = useState("");
  const [alt, setAlt] = useState(product.image?.alt || product.name);
  const [validation, setValidation] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [validating, setValidating] = useState(false);
  const selecting = useRef(0);
  const previewUrl = useRef("");
  useEffect(() => {
    const pending = selecting;
    const objectUrl = previewUrl;
    return () => {
      pending.current++;
      URL.revokeObjectURL(objectUrl.current);
    };
  }, []);
  const save = useMutation({
    mutationFn: async (remove: boolean) => {
      const path = "/products/" + product.id + "/image";
      if (remove) return api(path, productSchema, { method: "DELETE" });
      const alternative = z
        .string()
        .trim()
        .min(1, "Describe the image.")
        .max(200)
        .parse(alt);
      if (!file)
        return api(path, productSchema, {
          method: "PATCH",
          body: JSON.stringify({ alt: alternative }),
        });
      const ticket = await api(path + "/uploads", ticketSchema, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          ...dimensions,
        }),
      });
      const url = new URL(ticket.uploadUrl);
      const origins = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const fixture =
        process.env.NEXT_PUBLIC_APP_ENV === "fixture" &&
        url.origin === location.origin &&
        url.pathname.startsWith("/api/fixture-media-upload/");
      if (
        !fixture &&
        (url.protocol !== "https:" || !origins.includes(url.origin))
      )
        throw new Error(
          "The upload destination is not configured for this environment.",
        );
      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type, ...ticket.uploadHeaders },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(
          "Image upload failed. Your previous image has not been replaced.",
        );
      return api(path, productSchema, {
        method: "PUT",
        body: JSON.stringify({ uploadId: ticket.uploadId, alt: alternative }),
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["products"] });
      close();
    },
  });
  async function select(candidate?: File) {
    const selection = ++selecting.current;
    URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = "";
    setValidating(false);
    setFile(null);
    setPreview("");
    setValidation("");
    save.reset();
    if (!candidate) return;
    if (
      !["image/jpeg", "image/png"].includes(candidate.type) ||
      candidate.size === 0 ||
      candidate.size > maxBytes
    ) {
      setValidation("Choose a JPEG or PNG file up to 5 MB.");
      return;
    }
    try {
      setValidating(true);
      const image = await createImageBitmap(candidate);
      const valid =
        image.width <= 4096 &&
        image.height <= 4096 &&
        image.width * image.height <= 16_000_000;
      const measured = { width: image.width, height: image.height };
      image.close();
      if (selection !== selecting.current) return;
      if (!valid) {
        setValidation(
          "Choose an image up to 4096 pixels per side and 16 million pixels.",
        );
        return;
      }
      setFile(candidate);
      setDimensions(measured);
      previewUrl.current = URL.createObjectURL(candidate);
      setPreview(previewUrl.current);
    } catch {
      if (selection === selecting.current)
        setValidation("This file could not be opened as an image.");
    } finally {
      if (selection === selecting.current) setValidating(false);
    }
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!save.isPending) close();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Image for {product.name}</DialogTitle>
      <DialogContent>
        <div className="form-stack">
          <p>
            One JPEG or PNG, up to 5 MB. Uploading a replacement keeps the
            current image until you save.
          </p>
          {(preview || product.image) && (
            <Image
              src={preview || product.image!.url}
              alt={alt || "Selected image preview"}
              width={480}
              height={320}
              unoptimized
              style={{ width: "100%", height: 240, objectFit: "contain" }}
            />
          )}
          <label htmlFor="product-image-file">Image file</label>
          <input
            id="product-image-file"
            type="file"
            accept="image/jpeg,image/png"
            disabled={save.isPending}
            onChange={(event) => void select(event.target.files?.[0])}
          />
          <TextField
            label="Alternative text"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            disabled={save.isPending}
            helperText="Describe what the image shows."
          />
          {validation && <Alert severity="error">{validation}</Alert>}
          {validating && <p role="status">Checking image…</p>}
          {save.error && <Failure error={save.error} />}
          {confirmRemove && (
            <Alert severity="warning">
              Remove this product image?{" "}
              <Button
                disabled={save.isPending}
                onClick={() => save.mutate(true)}
              >
                Confirm removal
              </Button>
              <Button
                disabled={save.isPending}
                onClick={() => setConfirmRemove(false)}
              >
                Keep image
              </Button>
            </Alert>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        {product.image && (
          <Button
            color="error"
            disabled={save.isPending}
            onClick={() => setConfirmRemove(true)}
          >
            Remove image
          </Button>
        )}
        <Button disabled={save.isPending} onClick={close}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={
            save.isPending ||
            validating ||
            !!validation ||
            !alt.trim() ||
            (!file && !product.image)
          }
          onClick={() => save.mutate(false)}
        >
          {save.isPending ? "Saving image…" : "Save image"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
