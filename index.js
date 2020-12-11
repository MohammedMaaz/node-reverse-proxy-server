const http = require("http");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});
const PORT = 3000;

function startServer(port) {
  try {
    let prevUrl = '';
    http
      .createServer(function (req, res) {
        console.log("headers:", req.headers);
	const url = req.url;
        console.log("url:", url);
	if(prevUrl !== url)
        	proxy.web(req, res, { target: url });
	else res.end();
	prevUrl = url;
      })
      .listen(port);
    console.log("Starting Proxy Server");
  } catch (e) {
    console.log("Error:", e);
    startServer(port);
  }
}

startServer(PORT);
