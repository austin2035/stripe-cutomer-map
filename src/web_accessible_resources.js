var dataProvider = null;
var originalCustomerData = [];


var customerBaseUrl = `https://dashboard.stripe.com/ajax/all_customers?expand[]=data.customer&expand[]=data.customer.default_source&expand[]=total_count&expand[]=data.default_source&expand[]=data.sources.total_count&expand[]=data.subscriptions.data.items.total_count&expand[]=data.subscriptions.total_count&include_only[]=total_count,object,has_more,url,data.id,data.created,data.test_clock,data.description,data.contact,data.email,data.address,data.livemode,data.metadata,data.name,data.object,data.contact.name,data.contact.address,data.contact.email,data.subscriptions.object,data.subscriptions.has_more,data.subscriptions.total_count,data.subscriptions.url,data.sources.object,data.sources.has_more,data.sources.total_count,data.sources.url,data.saas_statistics.id,data.saas_statistics.active_subscriptions,data.saas_statistics.mrr,data.saas_statistics.mrr_change_thirty_days,data.saas_statistics.trial_end_date,data.saas_statistics.outstanding_balance,data.default_source.id,data.default_source.created,data.default_source.object,data.default_source.type,data.default_source.last4,data.default_source.account_holder_name,data.default_source.name,data.default_source.brand,data.spend_data.currency,data.spend_data.amount_refunded,data.spend_data.first_purchase,data.spend_data.gross_spend,data.spend_data.last_purchase,data.spend_data.net_spend,data.spend_data.num_payments,data.spend_data.amount_dispute_losses,data.spend_data.average_order_value,data.default_source.owner.name,data.default_source.three_d_secure_2_eap.last4,data.default_source.three_d_secure_2.last4,data.default_source.three_d_secure.last4,data.default_source.interac_present.last4,data.default_source.ideal.iban_last4,data.default_source.chf_credit_transfer.participant_number,data.default_source.card_present.last4,data.default_source.au_becs_debit.last4,data.default_source.bacs_debit.last4,data.default_source.acss_debit.last4,data.default_source.ach_debit.last4,data.default_source.ach_credit_transfer.account_number,data.default_source.bitcoin.address,data.default_source.sofort.iban_last4,data.default_source.sepa_debit.last4,data.spend_tags.new_customer.maximum,data.spend_tags.new_customer.minimum,data.subscriptions.data.id,data.spend_tags.high_refund_rate.maximum,data.spend_tags.high_refund_rate.minimum,data.spend_tags.high_refund_rate.percentile,data.spend_tags.top_spender.maximum,data.spend_tags.top_spender.minimum,data.spend_tags.top_spender.percentile,data.default_source.card.last4,data.default_source.card.name,data.default_source.card.brand&include[]=data.subscriptions&include[]=total_count`


const fetchOriginalCustomerData = async (url, csrf, accountId) => {
  const resp = await fetch(url, {
    "headers": {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "stripe-account": accountId,
      "stripe-livemode": "true",
      "stripe-version": "2023-08-16",
      "x-request-source": "service=\"manage-srv\"; project=\"customers_merchant_dashboard\"; operation=\"UnifiedCustomersListViewQuery\"; component=\"<unknown>\"",
      "x-requested-with": "XMLHttpRequest",
      "x-stripe-csrf-token": csrf,
      "x-stripe-manage-client-revision": "a14daa8ace639ec82c08c42208f9ca149da4782a"
    },
    "referrer": "https://dashboard.stripe.com/customers",
    "body": null,
    "method": "GET",
  });
  const response = await resp.json()
  return response;
}


const getFetchCustomerUrl = (limit, starting_after = null) => {
  if (starting_after) {
    return `${customerBaseUrl}&limit=${limit}&starting_after=${starting_after}`
  }
  return `${customerBaseUrl}&limit=${limit}`
}


const fetchAllCustomerData = async (csrf, accountId) => {
  let allData = [];
  let total = 0;
  let starting_after = null;
  let batchSize = 100;

  do {
    let url = getFetchCustomerUrl(batchSize, starting_after);
    const response = await fetchOriginalCustomerData(url, csrf, accountId);
    total = response.total_count;
    allData = allData.concat(response.data);
    let lastDataItem = response.data[response.data.length - 1];
    starting_after = lastDataItem.id;
  } while (allData.length < total);

  return allData;
}

const fetchCustomerData = async () => {
  let proloadedData = getPreloadedData();
  let csrf = proloadedData[0];
  let accountId = proloadedData[1];

  window.postMessage({ key: "customerPageLoadingStatus", val: true }, "*");
  const customers = await fetchAllCustomerData(csrf, accountId);
  window.postMessage({ key: "customerPageLoadingStatus", val: false }, "*");

  var regionCount = {};
  // 初始化 max 和 min 变量
  let maxCount = 0;
  let minCount = Infinity;
  let total = customers.length;
  regionCount.total = total;

  customers.forEach(customer => {
    try {
      let region = customer.contact?.address?.country || customer.address?.country;
      if (regionCount[region]) {
        regionCount[region]++;
      } else {
        regionCount[region] = 1;
      }
      // 更新 max 和 min
      if (regionCount[region] > maxCount) {
        maxCount = regionCount[region];
      }

      if (regionCount[region] < minCount) {
        minCount = regionCount[region];
      }

    }
    catch (e) {
      console.log(e)
      console.log("分析国家或者地区失败", customer.address.country)
    }
  });

  regionCount['max'] = maxCount;
  regionCount['min'] = minCount;

  window.postMessage({ key: "customerData", val: customers }, "*")
  window.postMessage({ key: "customerRegionCount", val: regionCount }, "*")
  window.postMessage({ key: "cutomerPageShow" })
}


const getPreloadedData = () => {
  // 定义正则表达式来匹配 csrf_token
  var MERCHANT_REGEX = /merchant_id&quot;:&quot;([^&]+)&quot;/;
  var CSRF_REGEX = /csrf_token&quot;:&quot;([^&]+)&quot;/;
  var tp = document.getElementById('tiny_preloaded_json');

  if (!tp) {
    // 如果找不到 tiny_preloaded_json 元素，抛出错误
    throw new Error('tiny_preloaded_json element missing');
  }

  // 获取元素的文本内容
  tp = tp.textContent;

  // 使用正则表达式进行匹配
  var m = tp.match(CSRF_REGEX);

  // 提取 csrf_token
  var csrfToken = m ? m[1] : null;

  let n = tp.match(MERCHANT_REGEX);
  let merchantId = n ? n[1] : null;

  return [csrfToken, merchantId];
}



(function () {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
  };

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
  });

  window.addEventListener('locationchange', () => {
    isCustomerPage();
  });
})();


const isCustomerPage = async () => {
  console.log(window.location.href);
  let b = window.location.href.includes("dashboard.stripe.com/customers");
  if (b) {
    console.log("customer page")
    window.postMessage({ key: "enterCustomerPage" }, "*")
  } else {
    console.log("not customer page")
    window.postMessage({ key: "notCustomerPage" }, "*")
  }
}


const main = async () => {
  await isCustomerPage();
}


main();


window.addEventListener("message", function (e) {
  const { data } = e;
  const { key, val } = data;
  switch (key) {
    case "customerPageLoaded":
      fetchCustomerData();
      break;
    default:
      break;
  }
})