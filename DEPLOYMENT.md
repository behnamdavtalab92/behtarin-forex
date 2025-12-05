# Backend Deployment on Render.com

## Step 1: Prepare Backend for Render

1. Make sure `.gitignore` exists in backend folder
2. Push to GitHub (or create new repo)

## Step 2: Deploy on Render

1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Name**: behtarin-forex-backend
   - **Region**: Frankfurt (Europe)
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: Free

## Step 3: Environment Variables

Add these in Render dashboard:

```
META_API_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...
MT_ACCOUNT_ID=d9e7cb60-7e95-48b0-9fa9-ec3ce12fe024
TELEGRAM_BOT_TOKEN=7923035220:AAEVdyALArcbGRDzeFQ3AWVJxAbNJNel8-E
TELEGRAM_CHANNEL=behtarinforex
VAPID_PUBLIC_KEY=BFTrrvd2Cjj_xeGOgjtqvneShOXKJzSvr9wx3lHnFwK1hEfhX_WRJDd5X4_iEuiXgi8qH4DAIrX588ey_9WNy-I
VAPID_PRIVATE_KEY=dKgXyN3J1YBbJCE4KkcRecUzpAuDWxkmUKvrCTb_B8s
ADMIN_PASSWORD=behtarin123
PORT=5000
```

## Step 4: Update Frontend

Update `.env.production` in frontend:

```
VITE_API_URL=https://behtarin-forex-backend.onrender.com/api
```

Rebuild and upload frontend to Hostinger.

## Step 5: Done!

Your backend will be at: `https://behtarin-forex-backend.onrender.com`
Your frontend will be at: `https://behdh.behdh92.site`

---

**Note**: Render free tier sleeps after 15 minutes of inactivity. 
First request after sleep takes 30-60 seconds to wake up.

