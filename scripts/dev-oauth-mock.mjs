// Dev-only stand-in for oauth2-proxy (`npm run dev`): signing in just sets a cookie. Not part of the build.
const COOKIE = 'mock_session';
const user = { user: 'dev-user-id', email: 'dev@example.com', preferredUsername: 'dev', groups: ['admins'] };

export default function devOauthMock() {
    return {
        name: 'dev-oauth-mock',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url, 'http://localhost');
                if (!url.pathname.startsWith('/oauth2/')) return next();

                const signedIn = (req.headers.cookie ?? '').includes(`${COOKIE}=1`);
                const rd = url.searchParams.get('rd');
                const back = rd && rd.startsWith('/') && !rd.startsWith('//') ? rd : '/';
                const redirect = (cookie) => {
                    res.statusCode = 302;
                    res.setHeader('Set-Cookie', `${COOKIE}=${cookie}; Path=/; SameSite=Lax`);
                    res.setHeader('Location', back);
                    res.end();
                };

                if (url.pathname === '/oauth2/start') return redirect('1');
                if (url.pathname === '/oauth2/sign_out') return redirect('; Max-Age=0');
                if (url.pathname === '/oauth2/userinfo') {
                    res.statusCode = signedIn ? 200 : 401;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(signedIn ? JSON.stringify(user) : '{}');
                }
                next();
            });
        },
    };
}
