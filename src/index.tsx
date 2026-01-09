import React, { createContext, useEffect, useState, useRef } from "react";

export interface ClientGuardProps {
  apiKey: string;
  projectSlug: string;
  heading: string;
  message: string;
  apiUrl?: string; // Default can be overwritten
  children: React.ReactNode;
}

interface GuardContextType {
  opacity: number;
  isOverdue: boolean;
}

const GuardContext = createContext<GuardContextType>({
  opacity: 0,
  isOverdue: false,
});

export const ClientGuardProvider = ({
  apiKey,
  projectSlug,
  heading,
  message,
  apiUrl = "http://127.0.0.1:8000/api", // Replace with your production URL
  children,
}: ClientGuardProps) => {
  const [opacity, setOpacity] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  // Create a randomized ID so it cannot be targeted by static CSS (e.g., #blocker { display: none })
  const overlayId = useRef(
    `guard-${Math.random().toString(36).substring(2, 9)}`,
  );

  // 1. API Polling Logic
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/opacity`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Project-Slug": projectSlug,
            Accept: "application/json",
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        if (typeof data.opacity === "number") {
          setOpacity(data.opacity);

          // If opacity is high (>= 80%), we treat it as "effectively broken" and disable scroll
          const criticalLevel = data.opacity >= 0.8;
          setIsOverdue(criticalLevel);

          if (criticalLevel) {
            document.body.style.overflow = "hidden";
          } else {
            document.body.style.overflow = "";
          }
        }
      } catch (error) {
        console.error("Guard check failed silently.");
      }
    };

    fetchStatus();
    // Check every 30 minutes
    const interval = setInterval(fetchStatus, 1000 * 60 * 30);
    return () => clearInterval(interval);
  }, [apiKey, projectSlug, apiUrl]);

  // 2. DOM Injection & Reinforcement (The "Self-Healing" Logic)
  useEffect(() => {
    // If there is no opacity required, ensure we clean up and exit
    if (opacity <= 0) {
      const existing = document.getElementById(overlayId.current);
      if (existing) existing.remove();
      return;
    }

    const renderOverlay = () => {
      let overlay = document.getElementById(overlayId.current);

      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = overlayId.current;
        document.body.appendChild(overlay);
      }

      // Enforce Critical Styles (inline to override stylesheets)
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        zIndex: "2147483647", // Max possible Z-index
        pointerEvents: opacity >= 0.1 ? "all" : "none", // Block clicks if visible
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        backdropFilter: isOverdue ? "blur(4px)" : "none",
        transition: "background-color 0.5s ease",
        color: "#ffffff",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "20px",
      });

      // Render the Text Content using React Portal behavior (manual mount)
      if (opacity > 0.1) {
        const content = `
          <div style="max-width: 600px; background: rgba(0,0,0,0.8); padding: 40px; border-radius: 12px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
            <h1 style="margin-bottom: 20px; font-size: 2rem; color: #ff4444;">${heading}</h1>
            <p style="font-size: 1.2rem; line-height: 1.6;">${message}</p>
          </div>
        `;
        overlay.innerHTML = content;
      } else {
        overlay.innerHTML = "";
      }
    };

    // Run immediately
    renderOverlay();

    // 3. MutationObserver: Watch for tampering
    const observer = new MutationObserver((mutations) => {
      let tamperingDetected = false;

      mutations.forEach((mutation) => {
        // Did they remove our node?
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((node) => {
            if ((node as HTMLElement).id === overlayId.current) {
              tamperingDetected = true;
            }
          });
        }

        // Did they change attributes on our node (e.g. style="display: none")?
        if (mutation.target === document.getElementById(overlayId.current)) {
          const el = mutation.target as HTMLElement;
          if (
            el.style.display === "none" ||
            el.style.opacity === "0" ||
            el.style.visibility === "hidden"
          ) {
            tamperingDetected = true;
          }
        }
      });

      if (tamperingDetected) {
        // Punish tampering: Re-render immediately
        renderOverlay();
        // Optional: Increase annoyance if they try to hack it
        document.body.style.overflow = "hidden";
      }
    });

    observer.observe(document.body, {
      childList: true, // Watch direct children (node removal)
      subtree: true, // Watch deeply (attribute changes)
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
      const el = document.getElementById(overlayId.current);
      if (el) el.remove();
    };
  }, [opacity, isOverdue, heading, message]);

  return (
    <GuardContext.Provider value={{ opacity, isOverdue }}>
      {children}
    </GuardContext.Provider>
  );
};

export const useClientGuard = () => React.useContext(GuardContext);
