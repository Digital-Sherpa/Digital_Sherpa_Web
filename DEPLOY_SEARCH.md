# Hosting the Search Engine

Since your Search Engine is a Python application (FastAPI) and your main Backend is already on Render, the best place to host the Search Engine is also **Render**. This keeps your backend services together.

## Step 1: Deploy to Render

1.  **Push your latest changes** to GitHub.
2.  Go to your [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your `digital-sherpa` repository.
5.  **Critical Configuration**:
    *   **Name:** `digital-sherpa-search` (or similar)
    *   **Root Directory:** `searchEngine` (Available under "Advanced" or basic settings)
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -U pip setuptools wheel && pip install -r requirements.txt`
    *   **Start Command:** `python main.py`
6.  **Environment Variables** (Add these in the "Environment" tab):
    *   `MONGODB_URI`: (Copy the same connection string you use for your main backend)
    *   `PYTHON_VERSION`: `3.9` (Recommended)
7.  Click **Create Web Service**.

Render will now build and deploy your Search Engine. Once finished, it will give you a URL (e.g., `https://digital-sherpa-search.onrender.com`).

## Step 2: Connect Frontend (Vercel)

Now you need to tell your Vercel frontend to use this new live Search Engine instead of looking for `localhost:8000`.

1.  Go to your **Vercel Dashboard**.
2.  Select your `digital-sherpa` project.
3.  Go to **Settings** -> **Environment Variables**.
4.  Add/Update the following variable:
    *   **Key:** `REACT_APP_SEARCH_API_URL`
    *   **Value:** Your new Render Search URL (e.g., `https://digital-sherpa-search.onrender.com`) - **Important:** Do not add a trailing slash `/`.
5.  **Redeploy** your frontend (go to Deployments -> select latest -> Redeploy) for the changes to take effect.

## Verification

Once both are deployed:
1.  Open your website.
2.  Try searching for "temples".
3.  If it works and shows results, you're all set! 🚀
