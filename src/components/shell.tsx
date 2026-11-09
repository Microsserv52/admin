"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Cross-zone navigation must load the destination application. */
import Image from "next/image";

import { useState, useSyncExternalStore } from "react";
import { cartSchema } from "@/lib/contracts";
import {
  Button,
  IconButton,
  MenuItem,
  Select,
  useColorScheme,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useSession, isAdmin } from "@/components/session";
import { appName, basePath } from "@/lib/config";

export function ThemeSelect() {
  const { mode, setMode } = useColorScheme();
  return (
    <Select
      size="small"
      value={mode || "system"}
      onChange={(event) =>
        setMode(event.target.value as "light" | "dark" | "system")
      }
      aria-label="Color theme"
      startAdornment={<LightModeOutlined fontSize="small" sx={{ mr: 1 }} />}
    >
      <MenuItem value="system">System</MenuItem>
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
    </Select>
  );
}
const subscribeCart = (listener: () => void) => {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
};
const readCartCount = () => {
  try {
    const result = cartSchema.safeParse(
      JSON.parse(localStorage.getItem("ms52-cart-v1") || "[]"),
    );
    return result.success
      ? result.data.reduce((sum, line) => sum + line.quantity, 0)
      : 0;
  } catch {
    return 0;
  }
};
export function Shell({
  children,
  cartCount,
}: {
  children: React.ReactNode;
  cartCount?: number;
}) {
  const { account } = useSession();
  const storedCount = useSyncExternalStore(
    subscribeCart,
    readCartCount,
    () => 0,
  );
  const count = cartCount ?? storedCount;
  const [open, setOpen] = useState(false);
  const links = (
    <>
      <a href="/store/">Catalog</a>
      <a href="/store/orders/">Demo orders</a>
      {isAdmin(account) && <a href="/admin/">Admin</a>}
      <a href={account ? "/store/account/" : "/store/login/"}>
        {account ? "Account" : "Sign in"}
      </a>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="demo-bar">
        Demo store. No real payments or transactions. Nothing will be shipped.
        {process.env.NEXT_PUBLIC_APP_ENV === "fixture" &&
          " Local API fixtures; data resets on restart."}
      </div>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Microsserv52 home">
          <Image src={basePath + "/brand.png"} width={52} height={28} alt="" />
          <span>
            Microsserv<span className="brand-number">52</span>
          </span>
        </a>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links}
        </nav>
        <div className="header-actions">
          <ThemeSelect />
          <Button
            href="/store/cart/"
            variant={count ? "contained" : "outlined"}
          >
            Cart{count ? " (" + count + ")" : ""}
          </Button>
          <IconButton
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </div>
      </header>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Button onClick={() => setOpen(false)}>Close navigation</Button>
          {links}
        </nav>
      </Drawer>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div>
          <strong>Microsserv52</strong>
          <p>A working demo. A learning project.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/privacy/">Privacy & diagnostics</a>
          <a href="https://microsserv52.github.io/platform/">
            Project documentation
          </a>
          <a href="https://github.com/Microsserv52">Source organization</a>
        </nav>
        <small>{appName}. Demo orders only.</small>
      </footer>
    </>
  );
}
