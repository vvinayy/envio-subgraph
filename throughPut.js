/**************************************************************
 * Sheets covered:
 *  - node: A = Node Wallet Address, B = Account ID (12-digit)
 *           Writes daily columns: C = YYYY-MM-DD (cost UnblendedCost),
 *                                 D = YYYY-MM-DD (mints)
 *  - county: A = county_name
 *            Writes B = unique properties minted
 *
 * Hyperindex endpoint: https://indexer.hyperindex.xyz/985b3b3/v1/graphql
 * AWS Cost Explorer:   https://ce.us-east-1.amazonaws.com
 **************************************************************/

/** ===== Common helpers ===== **/
function toYMD_(d) {
    const yyyy = d.getUTCFullYear();
    const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd   = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function utcDayToUnixRange_(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    const start = Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
    const end   = Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
    return { start, end };
}

/**
 * Ensure a column with a given header exists exactly at desiredIndex1Based.
 * If not present anywhere, insert at desired index and set header.
 * If present elsewhere, insert at desired index, copy over, delete original.
 */
function ensureColumnAtIndex_(sheet, desiredIndex1Based, headerText) {
    const lastCol = sheet.getLastColumn();
    for (let c = 1; c <= lastCol; c++) {
        const h = (sheet.getRange(1, c).getValue() || "").toString().trim();
        if (h === headerText) {
            if (c === desiredIndex1Based) return c;
            sheet.insertColumnBefore(desiredIndex1Based);
            const dest = desiredIndex1Based;
            sheet.getRange(1, c + (c >= dest ? 1 : 0), sheet.getMaxRows(), 1)
                .copyTo(sheet.getRange(1, dest, sheet.getMaxRows(), 1), { contentsOnly: false });
            sheet.deleteColumn(c + (c >= dest ? 1 : 0));
            return dest;
        }
    }
    sheet.insertColumnBefore(desiredIndex1Based);
    sheet.getRange(1, desiredIndex1Based).setValue(headerText);
    return desiredIndex1Based;
}

/**************************************************************
 * ============ NODE SHEET: COSTS (AWS CE) + MINTS ============
 **************************************************************/
const NODE_SHEET_NAME    = "node";
const NODE_WALLET_COL    = 1; // Column A
const NODE_ACCOUNTID_COL = 2; // Column B

/** ---- AWS Cost Explorer config ---- **/
const CE_ENDPOINT = "https://ce.us-east-1.amazonaws.com";
const CE_SERVICE  = "ce";
const CE_REGION   = "us-east-1";
const CE_TARGET   = "AWSInsightsIndexService.GetCostAndUsage";
const COST_METRIC = "UnblendedCost"; // or "AmortizedCost"

/** ---- Hyperindex (mints) config ---- **/
const HYPERINDEX_ENDPOINT = "YOUR_ENDPOINT";
const DAILY_MINTS_LIMIT   = 1000;

const DAILY_MINTS_QUERY = `
query MintsByDay($start: numeric!, $end: numeric!, $limit: Int!, $offset: Int!) {
  DataSubmittedWithLabel(
    where: { datetime: { _gte: $start, _lte: $end } }
    order_by: { id: asc }
    limit: $limit
    offset: $offset
  ) {
    id
    datetime
    submitter
  }
}`;

/** ---- AWS CE: signed call + totalizer ---- **/
function getTotalsForAccountsSince(accountIds, startYMD, endYMD) {
    const payload = {
        TimePeriod: { Start: startYMD, End: endYMD }, // End exclusive
        Granularity: "DAILY",
        Metrics: [COST_METRIC],
        GroupBy: [{ Type: "DIMENSION", Key: "LINKED_ACCOUNT" }],
        Filter: { Dimensions: { Key: "LINKED_ACCOUNT", Values: accountIds } }
    };
    const res = callCostExplorer_(payload);
    const totals = {};
    const days = (res && res.ResultsByTime) ? res.ResultsByTime : [];
    for (const day of days) {
        for (const g of (day.Groups || [])) {
            const acct = (g.Keys && g.Keys[0]) || "";
            const amtStr = g && g.Metrics && g.Metrics[COST_METRIC] && g.Metrics[COST_METRIC].Amount || "0";
            const amt = parseFloat(amtStr) || 0;
            totals[acct] = (totals[acct] || 0) + amt;
        }
    }
    return totals;
}

function callCostExplorer_(payloadObj) {
    const accessKey    = PropertiesService.getScriptProperties().getProperty("AWS_ACCESS_KEY_ID");
    const secretKey    = PropertiesService.getScriptProperties().getProperty("AWS_SECRET_ACCESS_KEY");
    const sessionToken = PropertiesService.getScriptProperties().getProperty("AWS_SESSION_TOKEN"); // optional
    if (!accessKey || !secretKey) throw new Error("Missing AWS credentials in Script Properties.");

    const method  = "POST";
    const host    = "ce.us-east-1.amazonaws.com";
    const path    = "/";
    const payload = JSON.stringify(payloadObj);
    const amzDate = toAmzDate_(new Date());
    const dateStamp = amzDate.substring(0, 8);

    const contentType = "application/x-amz-json-1.1";
    const canonicalHeaders =
        "content-type:" + contentType + "\n" +
        "host:" + host + "\n" +
        "x-amz-date:" + amzDate + "\n" +
        "x-amz-target:" + CE_TARGET + "\n" +
        (sessionToken ? ("x-amz-security-token:" + sessionToken + "\n") : "");
    const signedHeaders = "content-type;host;x-amz-date;x-amz-target" + (sessionToken ? ";x-amz-security-token" : "");

    const canonicalRequest = [
        method, path, "",
        canonicalHeaders,
        signedHeaders,
        sha256Hex_(payload)
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${CE_REGION}/${CE_SERVICE}/aws4_request`;
    const stringToSign = [algorithm, amzDate, credentialScope, sha256Hex_(canonicalRequest)].join("\n");

    const signingKey = getSignatureKey_(secretKey, dateStamp, CE_REGION, CE_SERVICE);
    const signature = toHex_(Utilities.computeHmacSha256Signature(
        Utilities.newBlob(stringToSign, "application/octet-stream").getBytes(), signingKey
    ));

    const headers = {
        "Content-Type": contentType,
        "X-Amz-Date": amzDate,
        "X-Amz-Target": CE_TARGET,
        "Authorization": `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    };
    if (sessionToken) headers["X-Amz-Security-Token"] = sessionToken;

    const resp = UrlFetchApp.fetch(CE_ENDPOINT, {
        method: "post",
        contentType,
        headers,
        payload,
        muteHttpExceptions: true
    });

    const status = resp.getResponseCode();
    const body = resp.getContentText();
    if (status < 200 || status >= 300) throw new Error(`Cost Explorer error ${status}: ${body}`);
    return JSON.parse(body);
}

// SigV4 helpers
function toAmzDate_(d) {
    const yyyy = d.getUTCFullYear();
    const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd   = String(d.getUTCDate()).padStart(2, "0");
    const hh   = String(d.getUTCHours()).padStart(2, "0");
    const mi   = String(d.getUTCMinutes()).padStart(2, "0");
    const ss   = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}
function sha256Hex_(s) {
    const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
    return toHex_(raw);
}
function toHex_(bytes) {
    return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16)).padStart(2, "0")).join("");
}
function hmacBytes_(keyBytes, dataStr) {
    const dataBytes = Utilities.newBlob(dataStr, "application/octet-stream").getBytes();
    return Utilities.computeHmacSha256Signature(dataBytes, keyBytes);
}
function getSignatureKey_(key, dateStamp, region, service) {
    const kSecret  = Utilities.newBlob("AWS4" + key, "application/octet-stream").getBytes();
    const kDate    = hmacBytes_(kSecret, dateStamp);
    const kRegion  = hmacBytes_(kDate, region);
    const kService = hmacBytes_(kRegion, service);
    return hmacBytes_(kService, "aws4_request");
}

/** ---- Hyperindex: fetch + aggregate mints ---- **/
function fetchDailySubmissions_(ymd) {
    const { start, end } = utcDayToUnixRange_(ymd);
    let offset = 0, out = [];
    while (true) {
        const body = JSON.stringify({
            query: DAILY_MINTS_QUERY,
            variables: { start, end, limit: DAILY_MINTS_LIMIT, offset }
        });
        const resp = UrlFetchApp.fetch(HYPERINDEX_ENDPOINT, {
            method: "post",
            contentType: "application/json",
            payload: body,
            muteHttpExceptions: true
        });
        const code = resp.getResponseCode();
        const txt  = resp.getContentText();
        if (code < 200 || code >= 300) throw new Error(`Mints HTTP ${code}: ${txt.slice(0,500)}`);
        const json = JSON.parse(txt);
        if (json.errors) throw new Error(`Mints GraphQL error(s): ${JSON.stringify(json.errors)}`);
        const rows = (json.data && json.data.DataSubmittedWithLabel) || [];
        out = out.concat(rows);
        if (rows.length < DAILY_MINTS_LIMIT) break;
        offset += DAILY_MINTS_LIMIT;
    }
    return out;
}

function aggregatePerSubmitterTotal_(rows) {
    const agg = {}; // submitterLower -> total count
    for (const r of rows) {
        const s = (r.submitter || "").toString().trim().toLowerCase();
        if (!s) continue;
        agg[s] = (agg[s] || 0) + 1;
    }
    return agg;
}

/** ---- Combined writer for a specific UTC date ---- **/
function runDailyCostAndMintsForDate(ymd) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(NODE_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${NODE_SHEET_NAME}" not found.`);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    // Prepare headers and fix positions:
    const costHeader  = `${ymd} (cost ${COST_METRIC})`;
    const mintsHeader = `${ymd} (mints)`;
    const COST_COL_INDEX  = 3; // Column C
    const MINTS_COL_INDEX = 4; // Column D

    const costCol  = ensureColumnAtIndex_(sheet, COST_COL_INDEX,  costHeader);
    const mintsCol = ensureColumnAtIndex_(sheet, MINTS_COL_INDEX, mintsHeader);
    const nowIso = new Date().toISOString();
    sheet.getRange(1, costCol ).setNote(`Updated: ${nowIso}`);
    sheet.getRange(1, mintsCol).setNote(`Updated: ${nowIso}`);

    // COSTS (per Account ID in Column B)
    const acctValues = sheet.getRange(2, NODE_ACCOUNTID_COL, lastRow - 1, 1).getValues()
        .map(r => (r[0] || "").toString().trim())
        .filter(v => /^\d{12}$/.test(v));

    let totals = {};
    if (acctValues.length) {
        const [y, m, d] = ymd.split("-").map(Number);
        const startYMD = ymd;
        const endYMD   = toYMD_(new Date(Date.UTC(y, m - 1, d + 1))); // end exclusive
        totals = getTotalsForAccountsSince(acctValues, startYMD, endYMD);
    }

    const costOutRange = sheet.getRange(2, costCol, lastRow - 1, 1);
    const costOutVals  = costOutRange.getValues();
    for (let i = 0; i < lastRow - 1; i++) {
        const acct = (sheet.getRange(i + 2, NODE_ACCOUNTID_COL).getValue() || "").toString().trim();
        costOutVals[i][0] = /^\d{12}$/.test(acct) ? parseFloat(totals[acct] || 0) : "";
    }
    costOutRange.setValues(costOutVals).setNumberFormat("0.00");

    // MINTS (per wallet in Column A)
    let rows = [];
    try {
        rows = fetchDailySubmissions_(ymd);
    } catch (e) {
        sheet.getRange(1, mintsCol).setNote(`Mints fetch failed: ${e.message} @ ${nowIso}`);
        rows = [];
    }
    const agg = aggregatePerSubmitterTotal_(rows);

    const wallets = sheet.getRange(2, NODE_WALLET_COL, lastRow - 1, 1).getValues()
        .map(r => (r[0] || "").toString().trim().toLowerCase());

    const mintsOutRange = sheet.getRange(2, mintsCol, lastRow - 1, 1);
    const mintsOutVals  = Array.from({ length: lastRow - 1 }, () => [""]);
    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        const total = Number(agg[w] || 0);
        mintsOutVals[i][0] = total > 0 ? total : "";
    }
    mintsOutRange.setValues(mintsOutVals).setNumberFormat("0");
}

function runDailyCostAndMintsForYesterdayUtc() {
    const now = new Date();
    const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    y.setUTCDate(y.getUTCDate() - 1);
    const ymd = toYMD_(y);
    runDailyCostAndMintsForDate(ymd);
}

function createDailyCostAndMintsTrigger() {
    ScriptApp.getProjectTriggers().forEach(t => {
        if (t.getHandlerFunction() === "runDailyCostAndMintsForYesterdayUtc") ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger("runDailyCostAndMintsForYesterdayUtc")
        .timeBased()
        .atHour(1)      // local script timezone
        .nearMinute(10)
        .everyDays(1)
        .create();
    Logger.log("Daily trigger created for cost+mints (yesterday UTC).");
}

function disableDailyCostAndMintsTrigger() {
    ScriptApp.getProjectTriggers().forEach(t => {
        if (t.getHandlerFunction() === "runDailyCostAndMintsForYesterdayUtc") ScriptApp.deleteTrigger(t);
    });
    Logger.log("Daily cost+mints trigger disabled.");
}

/**************************************************************
 * ================= COUNTY SHEET: UNIQUE PROPS ================
 **************************************************************/
const COUNTY_SHEET_NAME   = "county";
const COUNTY_NAME_COL     = 1; // Column A
const COUNTY_STATS_QUERY  = `
query Unknown_missingRelation_address_id {
  CountyStats {
    unique_properties_count
    county_name
  }
}`;

function fetchCountyStats_() {
    const resp = UrlFetchApp.fetch(HYPERINDEX_ENDPOINT, {
        method: "post",
        contentType: "application/json",
        muteHttpExceptions: true,
        payload: JSON.stringify({ query: COUNTY_STATS_QUERY })
    });
    const code = resp.getResponseCode();
    const body = resp.getContentText();
    if (code < 200 || code >= 300) throw new Error(`CountyStats HTTP ${code}: ${body.slice(0,500)}`);
    const json = JSON.parse(body);
    if (json.errors) throw new Error(`CountyStats GraphQL error(s): ${JSON.stringify(json.errors)}`);
    const rows = (json.data && json.data.CountyStats) || [];
    const map = {};
    for (const r of rows) {
        const name = ((r && r.county_name) || "").toString().trim().toLowerCase();
        const count = Number(r && r.unique_properties_count) || 0;
        if (name) map[name] = count;
    }
    return map; // nameLower -> count
}

/** Write "unique properties minted" to Column B on "county" sheet. */
function runCountyStatsOnce() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(COUNTY_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${COUNTY_SHEET_NAME}" not found.`);

    const HEADER = "unique properties minted";
    sheet.getRange(1, 2).setValue(HEADER); // Column B header

    const lastRow = sheet.getLastRow();
    const nowIso = new Date().toISOString();
    if (lastRow < 2) {
        sheet.getRange(1, 2).setNote(`Last updated: ${nowIso} • source: CountyStats`);
        Logger.log(`[${COUNTY_SHEET_NAME}] Header set; no data rows.`);
        return;
    }

    const nameToCount = fetchCountyStats_();
    const names = sheet.getRange(2, COUNTY_NAME_COL, lastRow - 1, 1)
        .getValues()
        .map(r => (r[0] || "").toString().trim().toLowerCase());

    const outRange = sheet.getRange(2, 2, lastRow - 1, 1); // Column B
    const outVals = names.map(n => [n ? (nameToCount[n] ?? "") : ""]);
    outRange.setValues(outVals).setNumberFormat("0");
    sheet.getRange(1, 2).setNote(`Last updated: ${nowIso} • source: CountyStats`);
    Logger.log(`[${COUNTY_SHEET_NAME}] Updated Column B "${HEADER}" for ${lastRow - 1} rows.`);
}

function createCountyStatsTriggerEvery6h() {
    ScriptApp.getProjectTriggers().forEach(t => {
        if (t.getHandlerFunction() === "runCountyStatsOnce") ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger("runCountyStatsOnce").timeBased().everyHours(6).create();
    Logger.log("6-hour trigger created for county stats.");
}

function disableCountyStatsTrigger() {
    ScriptApp.getProjectTriggers().forEach(t => {
        if (t.getHandlerFunction() === "runCountyStatsOnce") ScriptApp.deleteTrigger(t);
    });
    Logger.log("County stats trigger disabled.");
}

/**************************************************************
 * Convenience: run both (yesterday UTC + county)
 **************************************************************/
function updateCountyNodeSheets() {
    runDailyCostAndMintsForYesterdayUtc();
    runCountyStatsOnce();
}
