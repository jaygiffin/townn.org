const http = require('http');
const https = require('https');

const request = function(url, method = 'GET', postData) {
	const asURLobj = new URL(url);
	const lib = asURLobj.protocol === "https" ? https : http;

	/*const params = {
		method: method,
		host: asURLobj.hostname,
		port: asURLobj.port || (asURLobj.protocol === "https" ? 443 : 80),
		path: asURLobj.pathname || '/',
	};*/

	return new Promise((resolve, reject) => {
		const req = lib.request(url, /*params,*/ function(res) {
			if (res.statusCode < 200 || res.statusCode >= 400) {
				return reject(new Error(`Status Code: ${res.statusCode}`));
			}

			const data = [];

			res.on('data', chunk => {
				data.push(chunk);
			});

			res.on('end', () => resolve( Buffer.concat(data) ));
		});

		req.on('error', reject);

		if (postData) {
			req.write(postData);
		}

		// IMPORTANT
		req.end();
	});
};

module.exports = {request};
