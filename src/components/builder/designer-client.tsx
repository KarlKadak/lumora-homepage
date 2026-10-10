"use client";

import dynamic from "next/dynamic";

// The designer is laid out from the device's width and the stored draft,
// neither of which the static HTML can know, so it renders only in the
// browser. The placeholder keeps the workspace's height meanwhile, so the
// footer does not move when the designer appears.
const Placeholder = () => (
  <div
    aria-hidden="true"
    className="h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.25rem)]"
  />
);

const Designer = dynamic(
  async () => {
    const module_ = await import("@/components/builder/designer");

    return module_.Designer;
  },
  { ssr: false, loading: Placeholder },
);

export { Designer };
