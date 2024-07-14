
import React from "react";
import { createRoot } from "react-dom/client";
import Customer from "./customer";


const injectCustomer = async () => {
  const container = document.createElement("div");
  container.id = "customer-chart";
  let customerEleAnchor = document.getElementById("secondary-nav");

  if (!customerEleAnchor) {
    setTimeout(injectCustomer, 200);
    return;
  }

  if (document.getElementById(container.id)) {
    window.postMessage({ key: "customerPageLoaded" }, "*")
    return;
  }

  customerEleAnchor.appendChild(container);
  createRoot(container).render(<Customer />);
  window.postMessage({ key: "customerPageLoaded" }, "*")

}



// 注入 web_accessible_resources.js
const injectScript = async () => {
  return new Promise((resolve, reject) => {
    function injectScript(file_path, tag) {
      const node = document.getElementsByTagName(tag)[0];
      const script = document.createElement('script');
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', file_path);
      node.appendChild(script);
    }

    injectScript(chrome.runtime.getURL('js/web_accessible_resources.js'), 'body');
    console.log("注入 web_accessible_resources.js 完成")
    resolve();
  });
}

const injectCss = async () => {
  console.log(" *** 注入 css *** ")
  const head = document.getElementsByTagName('head');
  const styleTag = document.createElement('link');
  styleTag.rel = 'stylesheet';
  styleTag.href = chrome.runtime.getURL('css/injectCSS.css');
  head[0].appendChild(styleTag);
}


const main = async () => {
  await injectScript();
  await injectCss();
}


main();


window.addEventListener("message", function (e) {
  const { data } = e;
  const { key } = data;

  if (key != "enterCustomerPage") return;
  injectCustomer();
})