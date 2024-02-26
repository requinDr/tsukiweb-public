import React, { useRef, useEffect } from "react";

import { Fancybox as NativeFancybox } from "@fancyapps/ui";
import { ComponentOptionsType as FancyboxOptionsType } from "@fancyapps/ui/types/Fancybox/options";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

type Props = {
  children?: React.ReactNode,
  delegate?: string,
  options?: Partial<FancyboxOptionsType>,
  [key: string]: any
}

function Fancybox({children, delegate="[data-fancybox]", options = {}, ...props}: Props = {}) {
  const containerRef = useRef(null)
  useEffect(() => {
    NativeFancybox.bind(containerRef.current, delegate, options);

    return () => {
      NativeFancybox.unbind(containerRef.current);
      NativeFancybox.close();
    };
  });

  return <div ref={containerRef} {...props}>{children}</div>;
}

export default Fancybox;
