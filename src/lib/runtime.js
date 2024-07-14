export const getRuntimeFilePath = (path)  => {
  return chrome.runtime.getURL(path);
}

export const fetchRuntimeResource = async(path) => {
  const url = chrome.runtime.getURL(path);
  return fetch(url).then(response => response.json());
}
