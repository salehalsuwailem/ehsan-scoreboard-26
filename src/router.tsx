import { createContext, useContext, useEffect, useState } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * موجّه صفحات خفيف مبني على الـ hash — بدون أي مكتبة خارجية،
 * ويعمل على أي استضافة ثابتة دون إعدادات إعادة توجيه.
 */
const RouteContext = createContext<string>("/");

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash === "" ? "/" : hash;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return <RouteContext.Provider value={path}>{children}</RouteContext.Provider>;
}

export function usePath(): string {
  return useContext(RouteContext);
}

/** يستخرج معرّف المجموعة من مسار مثل ‎/group/G01. */
export function matchGroup(path: string): string | null {
  const m = path.match(/^\/group\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
