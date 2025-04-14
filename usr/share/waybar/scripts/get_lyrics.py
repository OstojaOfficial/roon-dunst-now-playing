import sys
import requests
import json
import os

with open(os.path.expanduser("~/.apikeys/musixmatch"), "r") as file:
    musixmatch_token = file.read().strip()

def get_lyrics(artist, song_title):
    search_url = "https://api.musixmatch.com/ws/1.1/track.search"
    params = {
        "q_track_artist": f"{artist} {song_title}",
        "apikey": musixmatch_token,
        "s_track_rating": "desc",
        "f_has_lyrics": "1"
    }

    response = requests.get(search_url, params=params)
    if response.status_code != 200:
        return f"Error al buscar la canción: {response.status_code}"

    data = response.json()
    tracks = data.get("message", {}).get("body", {}).get("track_list", [])
    if not tracks:
        return "No results found for this track."

    track_id = None
    for t in tracks:
        t_title = t["track"]["track_name"].lower()
        t_artist = t["track"]["artist_name"].lower()
        if song_title.lower() in t_title and artist.lower() in t_artist:
            track_id = t["track"]["track_id"]
            print("\n Filtered search result:")
            print("Track found:", t["track"]["track_name"])
            print("Artist foung:", t["track"]["artist_name"])
            print("Track ID:", track_id)
            print("---")
            break

    if not track_id:
        track_id = tracks[0]["track"]["track_id"]
        print("\n generic search result:")
        print("Title found:", tracks[0]["track"]["track_name"])
        print("Artist found:", tracks[0]["track"]["artist_name"])
        print("Track ID:", track_id)
        print("---")

    lyrics_url = "https://api.musixmatch.com/ws/1.1/track.lyrics.get"
    lyrics_params = {
        "track_id": track_id,
        "apikey": musixmatch_token
    }

    lyrics_response = requests.get(lyrics_url, params=lyrics_params)
    if lyrics_response.status_code != 200:
        return f"Error obtaining lyrics: {lyrics_response.status_code}"

    lyrics_data = lyrics_response.json()
    lyrics = lyrics_data.get("message", {}).get("body", {}).get("lyrics", {}).get("lyrics_body", "")
    return lyrics or "no lyrics available."

if len(sys.argv) != 3:
    print("Usage: python get_lyrics.py <artist> <song>")
    sys.exit(1)

artist = sys.argv[1]
song_title = sys.argv[2]
lyrics = get_lyrics(artist, song_title)
print(lyrics)

