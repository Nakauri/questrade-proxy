// api/questrade-proxy.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, refreshToken, apiServer, accessToken, accountId, endpoint } = req.body;

    try {
        if (action === 'getToken') {
            // Get access token from refresh token
            const tokenResponse = await fetch('https://login.questrade.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
            });

            const data = await tokenResponse.text();
            
            if (!tokenResponse.ok) {
                console.error('Token request failed:', tokenResponse.status, data);
                return res.status(tokenResponse.status).json({ 
                    error: 'Token request failed', 
                    details: data,
                    status: tokenResponse.status
                });
            }

            try {
                const jsonData = JSON.parse(data);
                return res.status(200).json(jsonData);
            } catch (e) {
                return res.status(500).json({ 
                    error: 'Invalid JSON response from Questrade', 
                    details: data 
                });
            }

        } else if (action === 'apiCall') {
            // Make authenticated API calls
            const apiUrl = `${apiServer}${endpoint}`;
            console.log('Making API call to:', apiUrl);

            const apiResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const data = await apiResponse.text();
            
            if (!apiResponse.ok) {
                console.error('API call failed:', apiResponse.status, data);
                return res.status(apiResponse.status).json({ 
                    error: 'API call failed', 
                    details: data,
                    status: apiResponse.status
                });
            }

            try {
                const jsonData = JSON.parse(data);
                return res.status(200).json(jsonData);
            } catch (e) {
                return res.status(500).json({ 
                    error: 'Invalid JSON response from Questrade API', 
                    details: data 
                });
            }

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
}
