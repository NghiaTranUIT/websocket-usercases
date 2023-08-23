var WebSocket = require("ws");

var HttpsProxyAgent = require("https-proxy-agent");
var url = require("url");
const { exit } = require("process");

// Approve Proxyman Certificate
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const myArgs = process.argv.slice(2);
const protocol = myArgs[0] ?? "wss";
const isEnabledWebsocketServer = myArgs[1];

var URL;
switch (protocol) {
  case "wss":
    URL = "wss://ws.postman-echo.com/raw";
    break;
  case "ws":
    URL =
      "ws://echo.websocket.events";
      break;
  default:
    // New feature, allow passing the custom URL
    URL = protocol;
    break;
}

////////////////////////
// Websocket Server Side (Optional)
////////////////////////
var websocketServer;
if (isEnabledWebsocketServer === 'server') {
  websocketServer = new WebSocket.WebSocketServer({ port: 8080 });
  websocketServer.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
      console.log('[NodeJS] Server received: %s', data);
      ws.send(data);
    });
  
    ws.send('Hello from Proxyman Websocket Server at port 8080!');
  });
  console.log("✅ Local Websocket started at port 8080")
}

////////////////////////
// Websocket Client Side
////////////////////////

// HTTP/HTTPS proxy to connect to
var proxy = "http://0.0.0.0:9090";
var options = url.parse(proxy);
var agent = new HttpsProxyAgent(options);
const ws = new WebSocket(URL, { agent: agent });
// const ws = new WebSocket(URL);

var shouldExit = false;
console.log(`WS connection is opened! URL = ${URL}`);

ws.on("open", function open() {

  // Text
  console.log("[NodeJS] Websocket Client is opened!");
  ws.send("Hello from Proxyman Websocket Client");

  // JSON
  const obj = { name: "John", age: 30, city: "New York" };
  const myJSON = JSON.stringify(obj);
  console.log("[NodeJS] ⬆️ Send JSON 1");
  ws.send(myJSON);

  // Ping
  console.log("[NodeJS] ⬆️ Ping");
  ws.ping();
});

ws.on("message", function message(data) {
  console.log("[NodeJS] ⬇️ Received: %s", data);

  if (shouldExit) {
    ws.close();
  }
});

ws.on("error", function message(err) {
  console.log("[NodeJS] ❌ Err: %s", err);
});

ws.on("pong", () => {
  console.log("[NodeJS] ⬇️ Pong!");

  // try to send a JSON again
  const obj = { name: "Noah", items: [1, 2, 3, 4] };
  const myJSON = JSON.stringify(obj);
  console.log("[NodeJS] ⬆️ Send JSON 2");
  ws.send(myJSON);

  // exit
  shouldExit = true;
});

ws.on("close", function clear() {
  console.log("[NodeJS] Closed!");
  exit(0);

});
