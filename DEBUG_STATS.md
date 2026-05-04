# Debugging Dashboard Stats

## Quick Tests

### 1. Test the API Endpoint Directly
Open in browser: `http://localhost:3000/api/stats`

You should see JSON like:
```json
{
  "success": true,
  "data": {
    "totalForms": 0,
    "totalUsers": 3,
    "totalSubmissions": 0,
    "authorizedIPs": 0
  }
}
```

### 2. Check Browser Console
1. Open Dashboard page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for any errors

### 3. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the dashboard
4. Look for `/api/stats` request
5. Check if it returns 200 status
6. Click on it to see the response

### 4. Verify Database Connection
Visit: `http://localhost:3000/api/test`

Should show database connection status.

### 5. Common Issues

**Issue: Stats showing 0 for everything**
- Solution: This is normal if you haven't created any forms/IPs yet
- Create a form or user to see the count increase

**Issue: API returns error**
- Check MongoDB connection in `.env.local`
- Verify MongoDB Atlas is accessible
- Check server console for errors

**Issue: Stats stuck on "..."**
- Check browser console for JavaScript errors
- Verify API endpoint is accessible
- Check network tab for failed requests

## Expected Behavior

- On page load: Shows "..." briefly, then real numbers
- If no data: Shows 0 (which is correct)
- If error: Shows 0 and logs error to console

