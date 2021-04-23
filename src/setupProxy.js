const {createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(createProxyMiddleware('/auth', { target: 'http://localhost:8080/' }));
    app.use(createProxyMiddleware('/login/', { target: 'http://localhost:8080/' }));
    app.use(createProxyMiddleware('/getData/', { target: 'http://localhost:8080/' }));
};
