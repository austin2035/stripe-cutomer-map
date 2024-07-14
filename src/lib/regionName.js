import { fetchRuntimeResource } from "./runtime";

const fetchRegionResource = async (locale) => {
  let response = await fetchRuntimeResource(`static/country/${locale}.json`);
  return response;
}

const getRegionName = async (locale) => {
  let regionData = null;
  try {
    regionData = await fetchRegionResource(locale);
  } catch (e) {
    regionData = await fetchRegionResource("en-US");
    console.log(e)
  }
  return regionData;
}

export default getRegionName;
