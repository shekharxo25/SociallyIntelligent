#!/usr/bin/env python3
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

# Environment Variables
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Service key bypasses RLS
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

def make_supabase_request(table, method="GET", data=None, params=None, is_upsert=False):
    """Utility to perform Supabase REST API requests using standard urllib"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    if params:
        url += "?" + urllib.parse.urlencode(params)
        
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    if is_upsert:
        headers["Prefer"] = "resolution=merge-duplicates"
        
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else []
    except Exception as e:
        print(f"Supabase REST API Error on {table}: {e}")
        return None

def make_youtube_request(endpoint, params):
    """Utility to query YouTube Data API v3"""
    params["key"] = YOUTUBE_API_KEY
    url = f"https://www.googleapis.com/youtube/v3/{endpoint}?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"YouTube API Error on {endpoint}: {e}")
        return None

def main():
    if not SUPABASE_URL or not SUPABASE_KEY or not YOUTUBE_API_KEY:
        print("Missing required environment variables. Please check SUPABASE_URL, SUPABASE_KEY, and YOUTUBE_API_KEY.")
        return

    print("Starting Ingestion Sync...")
    
    # 1. Fetch all platform accounts of type 'youtube' from Supabase
    print("Fetching active YouTube accounts from Supabase...")
    accounts = make_supabase_request("platform_accounts", params={"platform": "eq.youtube"})
    
    if not accounts:
        print("No YouTube platform accounts found to sync.")
        return
        
    print(f"Found {len(accounts)} YouTube account(s). Starting sync...")
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    for acc in accounts:
        acc_id = acc["id"]
        channel_id = acc["external_id"]
        handle = acc["handle"]
        
        if not channel_id:
            print(f"Skipping account {handle} - external_id (channel ID) is missing.")
            continue
            
        print(f"\nProcessing YouTube channel {handle} (ID: {channel_id})...")
        
        # 2. Fetch Channel Statistics from YouTube API
        channel_data = make_youtube_request("channels", {
            "part": "statistics,snippet",
            "id": channel_id
        })
        
        if not channel_data or not channel_data.get("items"):
            print(f"Could not retrieve details for channel {channel_id}.")
            continue
            
        channel_stats = channel_data["items"][0]["statistics"]
        subscribers = int(channel_stats.get("subscriberCount", 0))
        total_views = int(channel_stats.get("viewCount", 0))
        video_count = int(channel_stats.get("videoCount", 0))
        
        print(f"Stats - Subscribers: {subscribers} | Views: {total_views} | Videos: {video_count}")
        
        # 3. Create Daily Aggregate Record
        daily_agg = {
            "platform_account_id": acc_id,
            "date": today_str,
            "followers": subscribers,
            "impressions": total_views,
            "engagements": 0, # Calculated dynamically from video metric increases
            "engagement_rate": 0.0,
            "extra": {"video_count": video_count, "synced_at": datetime.utcnow().isoformat()}
        }
        
        # Fetch existing daily_aggregates for today to combine if needed
        # We perform an upsert
        make_supabase_request("daily_aggregates", method="POST", data=daily_agg, is_upsert=True)
        print("Daily aggregate upserted.")

        # 4. Fetch Recent Videos (uploads playlist)
        # First get the uploads playlist ID (usually starts with UU instead of UC)
        uploads_playlist_id = "UU" + channel_id[2:] if channel_id.startswith("UC") else channel_id
        
        playlist_items = make_youtube_request("playlistItems", {
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": 10
        })
        
        if not playlist_items or not playlist_items.get("items"):
            print("No recent videos found in the uploads playlist.")
            continue
            
        video_ids = []
        video_map = {}
        
        for item in playlist_items["items"]:
            snippet = item["snippet"]
            video_id = item["contentDetails"]["videoId"]
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            published_at = snippet.get("publishedAt", "")
            url = f"https://youtube.com/watch?v={video_id}"
            
            # Format published_at datetime
            posted_at = published_at
            
            # Add to list of videos
            video_ids.append(video_id)
            video_map[video_id] = {
                "platform_account_id": acc_id,
                "platform_post_id": video_id,
                "url": url,
                "posted_at": posted_at,
                "content_text": title,
                "content_type": "video"
            }
            
        if not video_ids:
            continue
            
        # 5. Fetch Specific Video Metrics (Views, Likes, Comments)
        video_details = make_youtube_request("videos", {
            "part": "statistics",
            "id": ",".join(video_ids)
        })
        
        if not video_details or not video_details.get("items"):
            print("Could not retrieve video statistics.")
            continue
            
        total_recent_engagements = 0
        total_recent_views = 0
            
        for v_item in video_details["items"]:
            v_id = v_item["id"]
            stats = v_item["statistics"]
            
            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0))
            comments = int(stats.get("commentCount", 0))
            
            total_recent_views += views
            total_recent_engagements += (likes + comments)
            
            # Upsert Post into Supabase
            post_data = video_map[v_id]
            post_upsert_res = make_supabase_request("posts", method="POST", data=post_data, is_upsert=True)
            
            if post_upsert_res and len(post_upsert_res) > 0:
                inserted_post = post_upsert_res[0]
                post_db_id = inserted_post["id"]
                
                # Insert Metrics
                metrics_data = {
                    "post_id": post_db_id,
                    "views": views,
                    "likes": likes,
                    "comments": comments,
                    "shares": 0,
                    "saves": 0,
                    "reach": views
                }
                make_supabase_request("post_metrics", method="POST", data=metrics_data)
                print(f"Upserted video '{post_data['content_text'][:30]}...' with stats (Views: {views}, Likes: {likes})")
                
        # 6. Update daily aggregate engagements and engagement rate for today
        if total_recent_views > 0:
            agg_rate = (total_recent_engagements / total_recent_views) * 100
            update_agg = {
                "platform_account_id": acc_id,
                "date": today_str,
                "engagements": total_recent_engagements,
                "engagement_rate": round(agg_rate, 4)
            }
            make_supabase_request("daily_aggregates", method="POST", data=update_agg, is_upsert=True)
            print(f"Updated today's engagement metrics. Rate: {round(agg_rate, 2)}%")

    print("\nIngestion Complete!")

if __name__ == "__main__":
    main()
