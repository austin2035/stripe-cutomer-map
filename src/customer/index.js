import React, { useState, useEffect, useMemo, useRef } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { ISO_COUNTRIES } from "../lib/constants";
import HoverTooltip from "../components/hovertooltip";
import { getRuntimeFilePath } from "../lib/runtime";
import getRegionName from "../lib/regionName";
import emojiFlags from "emoji-flags";

import "../style.css";


var colorScale = scaleLinear()
  .domain([0, 100])
  .range(["#b1b1f9", "#4066B4"]);

export default function Customer() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const showRef = useRef(false);
  const [show, setShow] = useState(false);

  const [sortData, setSortData] = useState([]); // [{country: {val: 100, percent: '10%'}}
  const regionDataRef = React.useRef(null);
  const [tooltip, setTooltipPopup] = useState();

  function getFillColor(code) {
    const countryData = data[code];
    if (!countryData) return '#f3f3f3';
    const visitors = countryData ? countryData : 0;
    return colorScale(visitors);
  }

  function getOpacity(code) {
    return 1;
  }

  async function getRegionNames(locale) {
    let regionNames = regionDataRef[locale];
    if (!regionNames) {
      regionNames = await getRegionName(locale);
      regionDataRef[locale] = regionNames;
    }
    return regionNames;
  }

  async function handleHover(code) {
    const countryData = data[code];
    let regionNames = await getRegionNames('en-US');

    setTooltipPopup(
      `${regionNames[code]}: ${countryData ? countryData : 0}`,
    );
  }

  function getGeoData() {
    return getRuntimeFilePath('static/datamaps.world.json')
  }

  async function calcSortData(data) {
    // 过滤掉 max 和 min
    const filteredData = Object.entries(data).filter(([key]) => key !== 'max' && key !== 'min' && key !== 'total');

    // 排序并取前10个
    const sortedData = filteredData.sort((a, b) => b[1] - a[1]).slice(0, 10);

    let regionNames = await getRegionNames('en-US');

    // 计算百分比并生成新的数组
    const total = data.total;
    const result = sortedData.map(([key, value]) => {
      const percent = ((value / total) * 100).toFixed(0) + '%';
      return { [regionNames[key]]: { val: value, percent: percent, code: key } };
    });
    setSortData(result);
  }

  useEffect(() => {

    window.addEventListener("message", function (event) {
      if (event.source !== window) {
        return;
      }
      const { data } = event;
      const {key, val} = data;
      switch (key) {
        case "customerRegionCount":
          calcSortData(data.val);
          colorScale = scaleLinear()
            .domain([data.val['min'], data.val['max']])
            .range(["#b1b1f9", "#4066B4"]);
          setData(data.val);
          break;
        case "notCustomerPage":
          setShow(false);
          setData(null);
          break;
        case "cutomerPageShow":
          showRef.current = true;
          setShow(showRef.current);
          break;
        case "customerPageLoadingStatus":
          setLoading(JSON.parse(val));
          break;
        default:
          break;
      }
    });
  }, []);

  return (
    <>
      {loading &&
        <div className="flex flex-row items-center">
          <svg className="w-6 h-6 text-gray-200 animate-spin  fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
          <div className="text-lg text-black font-bold ml-3 py-10">Global Insights loading...</div>
        </div>
      }

      {show && (<div className="flex flex-row w-full my-[30px]">
        <div
          className="region-data w-full"
          onMouseLeave={() => setTooltipPopup(null)}
        >
          <ComposableMap projection="geoMercator">
            <ZoomableGroup zoom={0.8} minZoom={0.7} center={[20, 40]}>
              <Geographies geography={getGeoData()}>
                {({ geographies }) => {
                  return geographies.map(geo => {
                    const code = ISO_COUNTRIES[geo.id];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(code)}
                        stroke={'#3086e6'}
                        opacity={getOpacity(code)}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#FFDE95' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseOver={() => handleHover(code)}
                        onMouseOut={() => setTooltipPopup(null)}
                      />
                    );
                  });
                }}
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          {tooltip && <HoverTooltip>{tooltip}</HoverTooltip>}
        </div>


        <div className="data-list bg-[white] w-[360px]">
          <div className="flex flex-row justify-between items-center px-[10px] pb-6">
            <div className="text-lg font-bold">Countries and Regions</div>
            <div>Customers</div>
          </div>

          <ul>
            {sortData.map((item, index) => {
              const key = Object.keys(item)[0];
              const value = item[key];
              return (
                <li key={index} className="flex flex-row justify-between px-[10px] py-[5px] border-b-[1px] border-[#f3f3f3] text-lg">
                  <div className="">
                    {emojiFlags.countryCode(value.code) ? emojiFlags.countryCode(value.code).emoji : ''}
                    <span className="ml-2">
                      {key}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold"> {value.val} </span>
                    <span className="px-1">|</span>
                    <span className="text-[#807e7e]">
                      {value.percent}
                    </span>
                  </div>

                </li>
              )
            })}
          </ul>
        </div>
      </div>)}
    </>
  )
}