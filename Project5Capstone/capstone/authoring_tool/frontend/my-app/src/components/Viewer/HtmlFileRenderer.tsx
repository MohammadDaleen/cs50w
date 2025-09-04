import { observer } from "mobx-react";
import { useRef, useEffect } from "react";
import { useVM } from "../../viewModel/context";
import { LoadingCover } from "..";
import { makeStyles } from "@fluentui/react-components";
import type { Resource } from "../../types";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  renderer: {
    position: "relative", // this is needed so we can use the loading cover
    display: "flex",
    flexDirection: "column" /* Adjust the layout direction */,
    height: "100%" /* Ensure the container fills the available height */,
    width: "100%",
  },
  iframe: {
    flex: "1" /* Allow the content to grow and fill the remaining space */,
    overflowY: "auto" /* Ensure scrolling when content overflows */,
    width: "100%",
    height: "100%",
  },
});

/**
 * HtmlFileRenderer Component
 * Dynamically renders HTML content inside an iframe.
 * @param {string} src - The HTML string to be rendered in the iframe.
 */
export const HtmlFileRenderer = observer(({ src }: { src: string }) => {
  const vm = useVM();
  const styles = useStyles();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleIframeLoad = () => {
      if (iframeRef.current) {
        const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDocument) {
          // Ensure iframe head exists
          const iframeHead = iframeDocument.head || iframeDocument.createElement("head");
          // Append CSS resources
          const cssResourcesUrls = vm.CssResources.map((resource) => resource.blobUrl ?? resource.url);
          if (cssResourcesUrls && cssResourcesUrls.length) {
            cssResourcesUrls.forEach((url) => {
              // Create a <link> tag for the CSS file
              const styleLink = iframeDocument.createElement("link");
              styleLink.rel = "stylesheet";
              styleLink.type = "text/css";
              styleLink.crossOrigin = "anonymous";
              styleLink.href = url;
              // Append the <link> tag to the iframe's <head>
              iframeHead.appendChild(styleLink);
            });
          }
          // Append the interactive model CSS
          // This CSS adds a glassmorphism effect to the figure elements containing .pszoomer
          const interactiveModelCss =
            `
            figure > .pszoomer{
              position: relative;       /* establishes a stacking context */
            }
            ` +
            /*  2: create the overlay and the centred label */
            `
            figure > .pszoomer::before,
            figure > .pszoomer::after{
              content: "";
              position: absolute;
              inset: 0;                 /* cover the whole pszoomer block */
              z-index: 1000;            /* higher than whatever .pszoomer has */
              pointer-events: auto;     /* block clicks (set to 'none' for passthrough) */
            }
            ` +
            /* glass-blur layer */
            `
            figure > .pszoomer::before{
              backdrop-filter: blur(8px);
              background: rgba(0,0,0,.25);
            }
            ` +
            /* centred message - default or per-block via data-label */
            ` 
            figure > .pszoomer::after{
              content: attr(data-label, "Works only in the app.");
              display: flex;
              align-items: center;
              justify-content: center;
              font: 700 1rem/1 sans-serif;
              color: #fff;
              text-align: center;
            }
            `;
          const interactiveModelStyleTag = iframeDocument.createElement("style");
          interactiveModelStyleTag.textContent = interactiveModelCss;
          iframeHead.appendChild(interactiveModelStyleTag);
          // Append JS resources
          let jsResources = vm.JsResources;
          if (jsResources.length) {
            // TODO: Make this more dynamic, this assumes we are using these resources, make it some other way so the data dictates everything and we done need to initialize the packages here
            // basically head.load.js was used to load the files from filesystem, but now we need to do this in this file and initalize the packages here as well
            // Add head.load.min.js (it will be used to add the other JS files to the head)
            const headLoadResource: Resource | undefined = vm.GetResourceByFileName("head.load.min.js");
            if (headLoadResource) {
              const scriptTag = iframeDocument.createElement("script");
              scriptTag.type = "text/javascript";
              scriptTag.src = headLoadResource.blobUrl ?? headLoadResource.url;
              scriptTag.async = false;
              scriptTag.crossOrigin = "anonymous";
              scriptTag.setAttribute("onload", "initializeApp()");
              // scriptTag.defer = true;
              // Add custom attribute
              scriptTag.setAttribute("data-file-name", headLoadResource.fileName);
              // Append the script tag to the iframe head or body
              iframeHead.appendChild(scriptTag);
            }
            jsResources = jsResources.filter((r) => r.fileName !== "head.load.min.js");
            // Add custom initialization script (must run before other scripts)
            const initScript = iframeDocument.createElement("script");
            initScript.type = "text/javascript";
            // initScript.async = false;
            // initScript.crossOrigin = "anonymous";
            const svgResourcesUrls = vm.SvgResources?.map((resource) => resource.blobUrl ?? resource.url);
            initScript.textContent = `
              ${svgResourcesUrls?.length ? `window.svgPaths = ${JSON.stringify(svgResourcesUrls)};` : ""}
              function initializeApp() {
                var files = ${JSON.stringify(jsResources.map((r) => r.blobUrl ?? r.url))};
                // add .scroll-container class to the body
                var body = document.body;
                body.classList.add("scroll-container");
                head.load(
                  files,
                  function () {
                    console.log("initialization script is starting execution!");
                    svg4everybody();
                    LM.sendMessageToParent("contentLoaded", null);
                    if (LM.settings.autoInitLM) {
                      LM.init();
                    }
                    console.log("initialization script is done executing!");
                  }
                );
              }`;
            iframeHead.appendChild(initScript);
          }
          vm.AreStylesLoading = false;
        }
      }
    };
    // Attach the load event listener
    const iframe = iframeRef.current;
    iframe?.addEventListener("load", handleIframeLoad);
    // Cleanup event listener
    return () => iframe?.removeEventListener("load", handleIframeLoad);
  }, [vm.CssResources, vm.JsResources, vm.SvgResources]);

  return (
    <div className={styles.renderer}>
      <LoadingCover loading={vm.AreStylesLoading} label={"Applying Styles..."}>
        {/* Render the iframe with full width and height return */}
        <iframe ref={iframeRef} src={src} className={styles.iframe} title="HTML File Viewer" />
      </LoadingCover>
    </div>
  );
});
