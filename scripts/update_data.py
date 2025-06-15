# scripts/update_data.py - Скрипт для обновления данных социальных сетей

import os
import json
import requests
from datetime import datetime
import yaml # Оставляем yaml, так как он может использоваться для других целей, если config.yml все еще существует, но не для генерации JS
import requests.exceptions

# --- ВАЖНО: НАСТРОЙТЕ СЕКРЕТЫ GITHUB ACTIONS ---
# Все API-ключи, токены и идентификаторы должны быть настроены как Secrets в вашем репозитории GitHub.
# Перейдите в Settings -> Secrets and variables -> Actions и добавьте каждую переменную окружения,
# которая используется ниже (например, YOUTUBE_API_KEY, TWITCH_CLIENT_ID и т.д.)
# Пример: YOUTUBE_API_KEY: 'ВАШ_КЛЮЧ'
# Если секрет отсутствует, функция API пропустит запрос и запишет ошибку в debugInfo.

# --- ВАШИ КОНФИГУРАЦИИ ---
# Используйте переменные окружения, чтобы получить секреты GitHub
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
TWITCH_CLIENT_ID = os.environ.get('TWITCH_CLIENT_ID')
TWITCH_CLIENT_SECRET = os.environ.get('TWITCH_CLIENT_SECRET')
YOUR_YOUTUBE_CHANNEL_ID = os.environ.get('YOUR_YOUTUBE_CHANNEL_ID')
YOUR_TWITCH_USERNAME = os.environ.get('YOUR_TWITCH_USERNAME')
YOUR_VK_GROUP_ID = os.environ.get('YOUR_VK_GROUP_ID') # Убедитесь, что это ID группы (например, 123456789 - числовой ID)
YOUR_VK_USER_ID = os.environ.get('YOUR_VK_USER_ID') # Убедитесь, что это ID пользователя (например, 123456789 - числовой ID)
VK_GROUP_ACCESS_TOKEN = os.environ.get('VK_GROUP_ACCESS_TOKEN') # Токен с правами доступа к группам
VK_USER_ACCESS_TOKEN = os.environ.get('VK_USER_ACCESS_TOKEN') # Токен с правами доступа к пользователям (для подписчиков)
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHANNEL_CHAT_ID = os.environ.get('TELEGRAM_CHANNEL_CHAT_ID')
INSTAGRAM_PAGE_ID = os.environ.get('INSTAGRAM_PAGE_ID') # В большинстве случаев используется Business Account ID
INSTAGRAM_BUSINESS_ACCOUNT_ID = os.environ.get('INSTAGRAM_BUSINESS_ACCOUNT_ID')
INSTAGRAM_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN')
X_BEARER_TOKEN = os.environ.get('X_BEARER_TOKEN')
YOUR_X_USER_ID = os.environ.get('YOUR_X_USER_ID')
TIKAPI_IO_API_KEY = os.environ.get('TIKAPI_IO_API_KEY')
YOUR_TIKTOK_USERNAME = os.environ.get('YOUR_TIKTOK_USERNAME')

# Путь к файлу данных
DATA_FILE_PATH = 'data.json'

# --- Загрузка текущих данных для сохранения заглушек при ошибках API ---
# Инициализация с безопасными значениями по умолчанию
current_data = {
    "followerCounts": {
        "youtube": 0, "telegram": 0, "instagram": 0, "x": 0, "twitch": 0, "tiktok": 0,
        "vk_group": 0, "vk_personal": 0
    },
    "youtubeVideos": [],
    "liveStream": {"type": "none"},
    "lastUpdated": datetime.now().isoformat(),
    "debugInfo": {} # debugInfo будет перезаписано каждый раз
}

# Попытка загрузить существующие данные из data.json
if os.path.exists(DATA_FILE_PATH):
    try:
        with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            # Копируем существующие данные, если они валидны, чтобы сохранить заглушки
            # и избежать потери данных при частичных ошибках API.
            if 'followerCounts' in existing_data and isinstance(existing_data['followerCounts'], dict):
                for platform, count in existing_data['followerCounts'].items():
                    current_data['followerCounts'][platform] = count

            if 'youtubeVideos' in existing_data and isinstance(existing_data['youtubeVideos'], list):
                current_data['youtubeVideos'] = existing_data['youtubeVideos']
            if 'liveStream' in existing_data and isinstance(existing_data['liveStream'], dict):
                current_data['liveStream'] = existing_data['liveStream']
            # debugInfo всегда очищается и заполняется заново в текущем запуске
            current_data['debugInfo'] = {}

    except json.JSONDecodeError:
        print("Warning: data.json is corrupted or empty, starting with default values.")
    except Exception as e:
        print(f"Warning: An unexpected error occurred while loading existing data.json: {e}. Starting with default values.")

# Создаем глобальный объект данных, который будет заполняться
data = current_data
data['debugInfo'] = {} # Убедимся, что debugInfo чисто для текущего запуска


# --- Функции получения данных для разных платформ ---

def get_youtube_channel_stats(channel_id, api_key):
    """Получает количество подписчиков YouTube канала."""
    if not channel_id:
        data['debugInfo']['youtube_subs_error'] = "YouTube Channel ID missing."
        print("YouTube Channel ID missing.")
        return None
    if not api_key:
        data['debugInfo']['youtube_subs_error'] = "YouTube API Key missing."
        print("YouTube API Key missing.")
        return None
    url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={api_key}"
    try:
        response = requests.get(url)
        response.raise_for_status() # Вызывает HTTPError для плохих ответов (4xx, 5xx)
        json_data = response.json()
        if json_data.get('items'):
            return int(json_data['items'][0]['statistics']['subscriberCount'])
        else:
            data['debugInfo']['youtube_subs_error'] = "No YouTube channel data found."
            print("No YouTube channel data found.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['youtube_subs_error'] = f"Error fetching YouTube subs (request): {e}"
        print(f"Error fetching YouTube subs (request): {e}")
    except Exception as e:
        data['debugInfo']['youtube_subs_error'] = f"Unexpected error fetching YouTube subs: {e}"
        print(f"Unexpected error fetching YouTube subs: {e}")
    return None

def get_youtube_recent_videos(channel_id, api_key, max_results=20):
    """Получает список последних видео YouTube канала."""
    if not channel_id:
        data['debugInfo']['youtube_videos_error'] = "YouTube Channel ID missing for videos."
        print("YouTube Channel ID missing for videos.")
        return []
    if not api_key:
        data['debugInfo']['youtube_videos_error'] = "YouTube API Key missing for videos."
        print("YouTube API Key missing for videos.")
        return []
    url_channel = f"https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id={channel_id}&key={api_key}"
    try:
        response_channel = requests.get(url_channel)
        response_channel.raise_for_status()
        channel_json = response_channel.json()
        if not channel_json.get('items'):
            data['debugInfo']['youtube_videos_error'] = "No YouTube channel contentDetails found."
            print("No YouTube channel contentDetails found.")
            return []
        uploads_playlist_id = channel_json['items'][0]['contentDetails']['relatedPlaylists']['uploads']

        url_playlist = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={uploads_playlist_id}&key={api_key}&maxResults={max_results}"
        response_playlist = requests.get(url_playlist)
        response_playlist.raise_for_status()
        playlist_json = response_playlist.json()
        videos = []
        for item in playlist_json.get('items', []):
            snippet = item['snippet']
            video_id = snippet['resourceId']['videoId']
            title = snippet['title']
            # Выбираем наилучшее доступное качество миниатюры
            thumbnail_url = snippet.get('thumbnails', {}).get('maxres', {}).get('url') or \
                            snippet.get('thumbnails', {}).get('standard', {}).get('url') or \
                            snippet.get('thumbnails', {}).get('high', {}).get('url') or \
                            snippet.get('thumbnails', {}).get('medium', {}).get('url') or \
                            snippet.get('thumbnails', {}).get('default', {}).get('url')
            videos.append({"id": video_id, "title": title, "thumbnailUrl": thumbnail_url})
        return videos
    except requests.exceptions.RequestException as e:
        data['debugInfo']['youtube_videos_error'] = f"Error fetching YouTube videos (request): {e}"
        print(f"Error fetching YouTube videos (request): {e}")
    except Exception as e:
        data['debugInfo']['youtube_videos_error'] = f"Unexpected error fetching YouTube videos: {e}"
        print(f"Unexpected error fetching YouTube videos: {e}")
    return []

def get_youtube_live_status(channel_id, api_key):
    """Проверяет, ведет ли YouTube канал прямую трансляцию."""
    if not channel_id:
        data['debugInfo']['youtube_live_error'] = "YouTube Channel ID missing for live status."
        print("YouTube Channel ID missing for live status.")
        return None
    if not api_key:
        data['debugInfo']['youtube_live_error'] = "YouTube API Key missing for live status."
        print("YouTube API Key missing for live status.")
        return None
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={channel_id}&eventType=live&type=video&key={api_key}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('items'):
            video_id = json_data['items'][0]['id']['videoId']
            title = json_data['items'][0]['snippet']['title']
            return {"type": "youtube", "id": video_id, "title": title, "youtubeChannelId": channel_id}
    except requests.exceptions.RequestException as e:
        data['debugInfo']['youtube_live_error'] = f"Error fetching YouTube live status (request): {e}"
        print(f"Error fetching YouTube live status (request): {e}")
    except Exception as e:
        data['debugInfo']['youtube_live_error'] = f"Unexpected error fetching YouTube live status: {e}"
        print(f"Unexpected error fetching YouTube live status: {e}")
    return None

def get_twitch_access_token(client_id, client_secret):
    """Получает токен доступа Twitch API."""
    if not client_id:
        data['debugInfo']['twitch_token_error'] = "Twitch Client ID missing."
        print("Twitch Client ID missing.")
        return None
    if not client_secret:
        data['debugInfo']['twitch_token_error'] = "Twitch Client Secret missing."
        print("Twitch Client Secret missing.")
        return None
    url = f"https://id.twitch.tv/oauth2/token?client_id={client_id}&client_secret={client_secret}&grant_type=client_credentials"
    try:
        response = requests.post(url)
        response.raise_for_status()
        return response.json()['access_token']
    except requests.exceptions.RequestException as e:
        data['debugInfo']['twitch_token_error'] = f"Error getting Twitch access token (request): {e}"
        print(f"Error getting Twitch access token (request): {e}")
    except Exception as e:
        data['debugInfo']['twitch_token_error'] = f"Unexpected error getting Twitch access token: {e}"
        print(f"Unexpected error getting Twitch access token: {e}")
    return None

def get_twitch_user_info(username, client_id, access_token):
    """Получает ID пользователя Twitch по его имени пользователя."""
    if not username:
        data['debugInfo']['twitch_user_error'] = "Twitch Username missing."
        print("Twitch Username missing.")
        return None
    if not client_id:
        data['debugInfo']['twitch_user_error'] = "Twitch Client ID missing for user info."
        print("Twitch Client ID missing for user info.")
        return None
    if not access_token:
        data['debugInfo']['twitch_user_error'] = "Twitch Access Token missing for user info."
        print("Twitch Access Token missing for user info.")
        return None
    url = f"https://api.twitch.tv/helix/users?login={username}"
    headers = {"Client-ID": client_id, "Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('data'):
            return json_data['data'][0]['id']
        else:
            data['debugInfo']['twitch_user_error'] = f"No Twitch user data found for {username}."
            print(f"No Twitch user data found for {username}.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['twitch_user_error'] = f"Error fetching Twitch user ID for {username} (request): {e}"
        print(f"Error fetching Twitch user ID for {username} (request): {e}")
    except Exception as e:
        data['debugInfo']['twitch_user_error'] = f"Unexpected error fetching Twitch user ID for {username}: {e}"
        print(f"Unexpected error fetching Twitch user ID for {username}: {e}")
    return None

def get_twitch_follower_count(user_id, client_id, access_token):
    """Получает количество фолловеров Twitch канала."""
    if not user_id:
        data['debugInfo']['twitch_followers_error'] = "Twitch User ID missing for followers."
        print("Twitch User ID missing for followers.")
        return None
    if not client_id:
        data['debugInfo']['twitch_followers_error'] = "Twitch Client ID missing for followers."
        print("Twitch Client ID missing for followers.")
        return None
    if not access_token:
        data['debugInfo']['twitch_followers_error'] = "Twitch Access Token missing for followers."
        print("Twitch Access Token missing for followers.")
        return None
    url = f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={user_id}"
    headers = {"Client-ID": client_id, "Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        return json_data['total']
    except requests.exceptions.RequestException as e:
        data['debugInfo']['twitch_followers_error'] = f"Error fetching Twitch followers for {user_id} (request): {e}"
        print(f"Error fetching Twitch followers for {user_id} (request): {e}")
    except Exception as e:
        data['debugInfo']['twitch_followers_error'] = f"Unexpected error fetching Twitch followers for {user_id}: {e}"
        print(f"Unexpected error fetching Twitch followers for {user_id}: {e}")
    return None

def get_twitch_live_status(username, client_id, access_token):
    """Проверяет, ведет ли Twitch канал прямую трансляцию."""
    if not username:
        data['debugInfo']['twitch_live_error'] = "Twitch Username missing for live status."
        print("Twitch Username missing for live status.")
        return None
    if not client_id:
        data['debugInfo']['twitch_live_error'] = "Twitch Client ID missing for live status."
        print("Twitch Client ID missing for live status.")
        return None
    if not access_token:
        data['debugInfo']['twitch_live_error'] = "Twitch Access Token missing for live status."
        print("Twitch Access Token missing for live status.")
        return None
    url = f"https://api.twitch.tv/helix/streams?user_login={username}"
    headers = {"Client-ID": client_id, "Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('data'):
            stream_info = json_data['data'][0]
            return {"type": "twitch", "id": stream_info['id'], "title": stream_info['title'], "twitchChannelName": username}
        else:
            data['debugInfo']['twitch_live_error'] = f"No active Twitch stream found for {username}."
            print(f"No active Twitch stream found for {username}.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['twitch_live_error'] = f"Error fetching Twitch live status for {username} (request): {e}"
        print(f"Error fetching Twitch live status for {username} (request): {e}")
    except Exception as e:
        data['debugInfo']['twitch_live_error'] = f"Unexpected error fetching Twitch live status for {username}: {e}"
        print(f"Unexpected error fetching Twitch live status for {username}: {e}")
    return None

def get_vk_group_members(group_id, access_token): # Использует VK_GROUP_ACCESS_TOKEN
    """Получает количество участников VK группы."""
    if not group_id:
        data['debugInfo']['vk_group_error'] = "VK Group ID missing."
        print("VK Group ID missing.")
        return None
    if not access_token:
        data['debugInfo']['vk_group_error'] = "VK Group Access Token missing. Cannot fetch group members."
        print("VK Group Access Token missing. Cannot fetch group members.")
        return None

    # VK API method: groups.getById, parameter group_id (not group_ids)
    # The 'group_id' parameter takes a numeric ID directly.
    # If the group is public and the token has 'groups' scope, it should work.
    url = f"https://api.vk.com/method/groups.getById?group_id={group_id}&fields=members_count&v=5.199&access_token={access_token}"
    print(f"Fetching VK group members from URL: {url}") # Для отладки

    try:
        response = requests.get(url)
        response.raise_for_status() # Вызывает HTTPError для плохих ответов (4xx, 5xx)
        json_data = response.json()

        if 'error' in json_data:
            error_obj = json_data['error']
            error_msg = error_obj.get('error_msg', 'Unknown VK API error')
            error_code = error_obj.get('error_code', 'N/A')
            data['debugInfo']['vk_group_error'] = f"VK Group API Error {error_code}: {error_msg}. Request params: group_id={group_id}"
            print(f"VK Group API Error {error_code}: {error_msg}")
            return None

        if 'response' in json_data and json_data['response']:
            # Проверяем, есть ли поле members_count. Если нет, это может быть приватная группа или проблема с правами токена.
            if 'members_count' in json_data['response'][0]:
                return json_data['response'][0].get('members_count')
            else:
                data['debugInfo']['vk_group_error'] = "VK group data found but 'members_count' is missing (possibly private group or insufficient token permissions)."
                print("VK group data found but 'members_count' is missing (possibly private group or insufficient token permissions).")
                return None
        else:
            data['debugInfo']['vk_group_error'] = "No VK group data found in response or empty response."
            print("No VK group data found in response or empty response.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['vk_group_error'] = f"Error fetching VK group members (request exception): {e}"
        print(f"Error fetching VK group members (request exception): {e}")
    except json.JSONDecodeError as e:
        data['debugInfo']['vk_group_error'] = f"Error decoding VK group response JSON: {e}. Response content: {response.text[:200]}..."
        print(f"Error decoding VK group response JSON: {e}")
    except Exception as e:
        data['debugInfo']['vk_group_error'] = f"Unexpected error fetching VK group members: {e}"
        print(f"Unexpected error fetching VK group members: {e}")
    return None

def get_vk_user_followers(user_id, access_token): # Использует VK_USER_ACCESS_TOKEN
    """Получает количество фолловеров VK пользователя."""
    if not user_id:
        data['debugInfo']['vk_personal_error'] = "VK User ID missing."
        print("VK User ID missing.")
        return None
    if not access_token:
        data['debugInfo']['vk_personal_error'] = "VK User Access Token missing. Cannot fetch user followers."
        print("VK User Access Token missing. Cannot fetch user followers.")
        return None

    url = f"https://api.vk.com/method/users.get?user_ids={user_id}&fields=followers_count&v=5.199&access_token={access_token}"
    print(f"Fetching VK user followers from URL: {url}") # Для отладки

    try:
        response = requests.get(url)
        response.raise_for_status()
        json_data = response.json()

        if 'error' in json_data:
            error_obj = json_data['error']
            error_msg = error_obj.get('error_msg', 'Unknown VK API error')
            error_code = error_obj.get('error_code', 'N/A')
            data['debugInfo']['vk_personal_error'] = f"VK User API Error {error_code}: {error_msg}. Request params: user_id={user_id}"
            print(f"VK User API Error {error_code}: {error_msg}")
            return None

        if 'response' in json_data and json_data['response']:
            # Проверяем, есть ли поле followers_count. Если нет, это может быть приватный аккаунт.
            if 'followers_count' in json_data['response'][0]:
                return json_data['response'][0].get('followers_count')
            else:
                data['debugInfo']['vk_personal_error'] = "VK user data found but 'followers_count' is missing (possibly private profile or insufficient token permissions)."
                print("VK user data found but 'followers_count' is missing (possibly private profile or insufficient token permissions).")
                return None
        else:
            data['debugInfo']['vk_personal_error'] = "No VK personal user data found in response or empty response."
            print("No VK personal user data found in response or empty response.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['vk_personal_error'] = f"Error fetching VK user followers (request exception): {e}"
        print(f"Error fetching VK user followers (request exception): {e}")
    except json.JSONDecodeError as e:
        data['debugInfo']['vk_personal_error'] = f"Error decoding VK user response JSON: {e}. Response content: {response.text[:200]}..."
        print(f"Error decoding VK user response JSON: {e}")
    except Exception as e:
        data['debugInfo']['vk_personal_error'] = f"Unexpected error fetching VK user followers: {e}"
        print(f"Unexpected error fetching VK user followers: {e}")
    return None

def get_telegram_channel_members(bot_token, channel_chat_id):
    """Получает количество участников Telegram канала."""
    if not bot_token:
        data['debugInfo']['telegram_error'] = "Telegram Bot Token missing."
        print("Telegram Bot Token missing.")
        return None
    if not channel_chat_id:
        data['debugInfo']['telegram_error'] = "Telegram Channel Chat ID missing."
        print("Telegram Channel Chat ID missing.")
        return None
    url = f"https://api.telegram.org/bot{bot_token}/getChatMembersCount?chat_id={channel_chat_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('ok') and 'result' in json_data:
            return json_data['result']
        else:
            data['debugInfo']['telegram_error'] = f"Telegram API error: {json_data.get('description', 'Unknown error')}"
            print(f"Telegram API error: {json_data.get('description', 'Unknown error')}")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['telegram_error'] = f"Error fetching Telegram channel members (request): {e}"
        print(f"Error fetching Telegram channel members (request): {e}")
    except Exception as e:
        data['debugInfo']['telegram_error'] = f"Unexpected error fetching Telegram channel members: {e}"
        print(f"Unexpected error fetching Telegram channel members: {e}")
    return None

def get_instagram_follower_count(business_account_id, access_token):
    """Получает количество фолловеров Instagram бизнес-аккаунта."""
    if not business_account_id:
        data['debugInfo']['instagram_error'] = "Instagram Business Account ID missing."
        print("Instagram Business Account ID missing.")
        return None
    if not access_token:
        data['debugInfo']['instagram_error'] = "Instagram Access Token missing."
        print("Instagram Access Token missing.")
        return None

    url = f"https://graph.facebook.com/v19.0/{business_account_id}/insights?metric=followers_count&period=day&access_token={access_token}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('data') and json_data['data'][0].get('values'):
            return json_data['data'][0]['values'][0]['value']
        else:
            data['debugInfo']['instagram_error'] = "No Instagram follower data found or API response format unexpected."
            print("No Instagram follower data found.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['instagram_error'] = f"Error fetching Instagram followers (request): {e}"
        print(f"Error fetching Instagram followers (request): {e}")
    except Exception as e:
        data['debugInfo']['instagram_error'] = f"Unexpected error fetching Instagram followers: {e}"
        print(f"Unexpected error fetching Instagram followers: {e}")
    return None

def get_x_follower_count(user_id, bearer_token):
    """Получает количество фолловеров X (Twitter) аккаунта."""
    if not user_id:
        data['debugInfo']['x_error'] = "X (Twitter) User ID missing."
        print("X (Twitter) User ID missing.")
        return None
    if not bearer_token:
        data['debugInfo']['x_error'] = "X (Twitter) Bearer Token missing."
        print("X (Twitter) Bearer Token missing.")
        return None

    url = f"https://api.twitter.com/2/users/{user_id}?user.fields=public_metrics"
    headers = {"Authorization": f"Bearer {bearer_token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        if json_data.get('data') and json_data['data'].get('public_metrics'):
            return json_data['data']['public_metrics']['followers_count']
        else:
            data['debugInfo']['x_error'] = "No X (Twitter) public_metrics data found or API response format unexpected."
            print("No X (Twitter) public_metrics data found.")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['x_error'] = f"Error fetching X (Twitter) followers (request): {e}"
        print(f"Error fetching X (Twitter) followers (request): {e}")
    except Exception as e:
        data['debugInfo']['x_error'] = f"Unexpected error fetching X (Twitter) followers: {e}"
        print(f"Unexpected error fetching X (Twitter) followers: {e}")
    return None

def get_tiktok_follower_count(username, api_key):
    """Получает количество фолловеров TikTok аккаунта через TikAPI.io."""
    if not username:
        data['debugInfo']['tiktok_error'] = "TikTok username missing."
        print("TikTok username missing.")
        return None
    if not api_key:
        data['debugInfo']['tiktok_error'] = "TikAPI.io API Key missing."
        print("TikAPI.io API Key missing.")
        return None

    url = f"https://api.tikapi.io/profile/user/{username}"
    headers = {
        "x-api-key": api_key,
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        json_data = response.json()

        if json_data.get('data') and json_data['data'].get('stats'):
            return json_data['data']['stats'].get('followerCount')
        elif json_data.get('user') and json_data['user'].get('stats'): # Альтернативный путь в ответе
            return json_data['user']['stats'].get('followerCount')
        else:
            data['debugInfo']['tiktok_error'] = f"TikAPI.io response format unexpected: {json_data}"
            print(f"TikAPI.io response format unexpected: {json_data}")
    except requests.exceptions.RequestException as e:
        data['debugInfo']['tiktok_error'] = f"Error fetching TikTok followers from TikAPI.io: {e}"
        print(f"Error fetching TikTok followers from TikAPI.io: {e}")
    except json.JSONDecodeError as e:
        data['debugInfo']['tiktok_error'] = f"Error decoding TikAPI.io response JSON: {e}"
        print(f"Error decoding TikAPI.io response JSON: {e}")
    except Exception as e:
        data['debugInfo']['tiktok_error'] = f"Unexpected error fetching TikTok followers: {e}"
        print(f"Unexpected error fetching TikTok followers: {e}")
    return None

# --- Выполнение запросов и обновление данных ---

# YouTube
print("\n--- Fetching YouTube Data ---")
yt_subs = get_youtube_channel_stats(YOUR_YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY)
if yt_subs is not None:
    data['followerCounts']['youtube'] = yt_subs
    print(f"YouTube Subscribers: {yt_subs}")
else:
    print("YouTube Subscribers: Not fetched.")

yt_videos = get_youtube_recent_videos(YOUR_YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY)
data['youtubeVideos'] = yt_videos
if yt_videos:
    print(f"YouTube Videos fetched: {len(yt_videos)}")
else:
    print("YouTube Videos: Not fetched.")

yt_live = get_youtube_live_status(YOUR_YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY)
if yt_live:
    print(f"YouTube Live Status: Active - {yt_live.get('title')}")
else:
    print("YouTube Live Status: Inactive.")

# Twitch
print("\n--- Fetching Twitch Data ---")
twitch_access_token = get_twitch_access_token(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)
twitch_user_id = None
if twitch_access_token:
    print("Twitch Access Token obtained.")
    twitch_user_id = get_twitch_user_info(YOUR_TWITCH_USERNAME, TWITCH_CLIENT_ID, twitch_access_token)
    if twitch_user_id:
        print(f"Twitch User ID for {YOUR_TWITCH_USERNAME}: {twitch_user_id}")
        twitch_followers = get_twitch_follower_count(twitch_user_id, TWITCH_CLIENT_ID, twitch_access_token)
        if twitch_followers is not None:
            data['followerCounts']['twitch'] = twitch_followers
            print(f"Twitch Followers: {twitch_followers}")
        else:
            print("Twitch Followers: Not fetched.")

        twitch_live = get_twitch_live_status(YOUR_TWITCH_USERNAME, TWITCH_CLIENT_ID, twitch_access_token)
        if twitch_live:
            print(f"Twitch Live Status: Active - {twitch_live.get('title')}")
        else:
            print("Twitch Live Status: Inactive.")

        # Определяем основной Live Stream (приоритизируем YouTube)
        if yt_live:
            data['liveStream'] = yt_live
            if twitch_live:
                data['liveStream']['twitchLive'] = twitch_live # Добавляем инфо о Twitch, если YouTube - основной стрим
            print("Live Stream: YouTube is primary.")
        elif twitch_live:
            data['liveStream'] = twitch_live
            print("Live Stream: Twitch is primary.")
        else:
            data['liveStream'] = {"type": "none"}
            print("Live Stream: None active.")
    else:
        if 'twitch_user_error' not in data['debugInfo']: # Добавляем общую ошибку, только если нет более специфичной
            data['debugInfo']['twitch_general_error'] = "Twitch user ID could not be fetched, skipping Twitch live/followers."
            print(data['debugInfo']['twitch_general_error'])
        data['liveStream'] = {"type": "none"} # Убедимся, что liveStream сброшен, если Twitch не работает
else:
    if 'twitch_token_error' not in data['debugInfo']: # Добавляем общую ошибку, только если нет более специфичной
        data['debugInfo']['twitch_general_error'] = "Twitch access token could not be fetched, skipping Twitch live/followers."
        print(data['debugInfo']['twitch_general_error'])
    data['liveStream'] = {"type": "none"} # Убедимся, что liveStream сброшен, если Twitch не работает


# VK (Обновлено с использованием отдельных access_token)
print("\n--- Fetching VK Data ---")
vk_group_members = get_vk_group_members(YOUR_VK_GROUP_ID, VK_GROUP_ACCESS_TOKEN)
if vk_group_members is not None:
    data['followerCounts']['vk_group'] = vk_group_members
    print(f"VK Group Members: {vk_group_members}")
else:
    print("VK Group Members: Not fetched.")
    # debugInfo уже заполняется внутри функции, здесь можно добавить общую фразу
    if 'vk_group_error' not in data['debugInfo']: # Если специфической ошибки нет
        data['debugInfo']['vk_group_status'] = "Failed to fetch VK group members, check token and ID."

vk_personal_followers = get_vk_user_followers(YOUR_VK_USER_ID, VK_USER_ACCESS_TOKEN)
if vk_personal_followers is not None:
    data['followerCounts']['vk_personal'] = vk_personal_followers
    print(f"VK Personal Followers: {vk_personal_followers}")
else:
    print("VK Personal Followers: Not fetched.")
    # debugInfo уже заполняется внутри функции, здесь можно добавить общую фразу
    if 'vk_personal_error' not in data['debugInfo']: # Если специфической ошибки нет
        data['debugInfo']['vk_personal_status'] = "Failed to fetch VK personal followers, check token, ID, and profile privacy."


# Telegram
print("\n--- Fetching Telegram Data ---")
tg_members = get_telegram_channel_members(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_CHAT_ID)
if tg_members is not None:
    data['followerCounts']['telegram'] = tg_members
    print(f"Telegram Members: {tg_members}")
else:
    print("Telegram Members: Not fetched.")


# Instagram
print("\n--- Fetching Instagram Data ---")
if INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN:
    ig_followers = get_instagram_follower_count(INSTAGRAM_BUSINESS_ACCOUNT_ID, INSTAGRAM_ACCESS_TOKEN)
    if ig_followers is not None:
        data['followerCounts']['instagram'] = ig_followers
        print(f"Instagram Followers: {ig_followers}")
    else:
        print("Instagram Followers: Not fetched.")
else:
    data['debugInfo']['instagram_setup_warning'] = "Instagram API credentials (BUSINESS_ACCOUNT_ID, ACCESS_TOKEN) are missing. Instagram follower count will not be updated automatically."
    print(data['debugInfo']['instagram_setup_warning'])


# X (Twitter)
print("\n--- Fetching X (Twitter) Data ---")
if YOUR_X_USER_ID and X_BEARER_TOKEN:
    x_followers = get_x_follower_count(YOUR_X_USER_ID, X_BEARER_TOKEN)
    if x_followers is not None:
        data['followerCounts']['x'] = x_followers
        print(f"X (Twitter) Followers: {x_followers}")
    else:
        print("X (Twitter) Followers: Not fetched.")
else:
    data['debugInfo']['x_setup_warning'] = "X (Twitter) API credentials (USER_ID, BEARER_TOKEN) are missing. X follower count will not be updated automatically."
    print(data['debugInfo']['x_setup_warning'])

# TikTok
print("\n--- Fetching TikTok Data ---")
if YOUR_TIKTOK_USERNAME and TIKAPI_IO_API_KEY:
    tiktok_followers = get_tiktok_follower_count(YOUR_TIKTOK_USERNAME, TIKAPI_IO_API_KEY)
    if tiktok_followers is not None:
        data['followerCounts']['tiktok'] = tiktok_followers
        print(f"TikTok Followers: {tiktok_followers}")
    else:
        print("TikTok Followers: Not fetched.")
else:
    data['debugInfo']['tiktok_setup_warning'] = "TikTok API credentials (username, API Key for TikAPI.io) are missing. TikTok follower count will not be updated automatically."
    print(data['debugInfo']['tiktok_setup_warning'])


# Обновляем отметку времени последнего обновления
data['lastUpdated'] = datetime.now().isoformat()

# Save updated data
with open(DATA_FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nData updated and saved to {DATA_FILE_PATH}")
print(f"Debug Info: {json.dumps(data['debugInfo'], indent=2, ensure_ascii=False)}")