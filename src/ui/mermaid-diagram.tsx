import { useEffect, useRef, useState } from "react";
import { MAX_MERMAID_SOURCE, renderMermaidSvg, sizeSvg, svgDataUrl } from "../services/host-mermaid";

/** Host Mermaid renders to SVG, shown as an inert image: no scripts, links or vault access. */
export function MermaidDiagram({ source }: { source: string }) {
  const container = useRef<HTMLDivElement>(null);
  // Start from the host theme so a dark vault does not render the chart light first; the effect refines it.
  const [dark, setDark] = useState(() => document.body.classList.contains("theme-dark"));
  useEffect(() => {
    const root = container.current?.closest<HTMLElement>(".qiaomu-agent");
    const body = container.current?.ownerDocument.body;
    if (!body) return;
    const update = () => {
      const theme = root?.dataset.qaTheme;
      setDark(theme ? theme === "dark" || theme === "black" : body.classList.contains("theme-dark"));
    };
    update();
    const observer = new MutationObserver(update);
    if (root) observer.observe(root, { attributes: true, attributeFilter: ["data-qa-theme"] });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const [image, setImage] = useState<{ url: string; width: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const tooLarge = source.length > MAX_MERMAID_SOURCE;
  useEffect(() => {
    if (tooLarge) return;
    let live = true;
    setFailed(false);
    renderMermaidSvg(source, dark ? "dark" : "default")
      .then((svg) => { if (!live) return; const sized = sizeSvg(svg); setImage({ url: svgDataUrl(sized.svg), width: sized.width }); })
      .catch(() => { if (live) { setImage(null); setFailed(true); } });
    return () => { live = false; };
  }, [source, tooLarge, dark]);
  return <div className="qa-mermaid" ref={container}>
    {image && <img src={image.url} alt="Mermaid 图表" style={{ width: image.width, maxWidth: "100%" }} />}
    {(failed || tooLarge) && <p role="status">图表未能显示，请检查源码或缩小图表。</p>}
    <details open={failed || tooLarge}><summary>图表源码</summary><pre>{source}</pre></details>
  </div>;
}
