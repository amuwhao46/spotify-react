import { useState, useEffect } from "react"
import useAuth from "./useAuth"
import TrackSearchResult from "./TrackSearchResult"
import { Container, Form } from "react-bootstrap"
import SpotifyWebApi from "spotify-web-api-node"
import Player from "./Player"
import axios from "axios"

const spotifyApi = new SpotifyWebApi({
    clientId: 'fc24ace5aa794c269a5723ac954569e9',
})

export default function Dashboard({ code }) {
    // useState(s)
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [playingTrack, setPlayingTrack] = useState()
    const [lyrics, setLyrics] = useState("")

    function chooseTrack(track) {
        setPlayingTrack(track)
        setSearch("")
        setLyrics("")
    }

    // Gets access token
    useEffect(() => {
        if (!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    // Keeps track of Search metadata
    useEffect(() => {
        if (!search) return setSearchResults([])
        if (!accessToken) return

        // Cancels search if a new request happens
        let cancel = false

        spotifyApi.searchTracks(search)
        .then(res => {
            if (cancel) return
            // Instead of for loop :D
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce(
                    (smallest, image) => {
                        if (image.height < smallest.height) return image 
                        return smallest
                    }, track.album.images[0])

                return {
                    artistName: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url,
                }
            }))
        })

        return () => cancel = true
    }, [search, accessToken])

    // Get Lyrics
    useEffect(() => {
        if (!playingTrack) return
        axios.get('https://localhost:3001/lyrics', {
            params: {
                track: playingTrack.title,
                artist: playingTrack.artist,
            }
        }).then(res => {
            setLyrics(res.data.lyrics)
        })
    }, [playingTrack])

    return <Container className="d-flex flex-column py-2" style={{height: "100vh"}}>
        <Form.Control 
        type="search" 
        placeholder="Search Songs or Artists" 
        value={search} 
        onChange= {e => setSearch(e.target.value)}
        />
        <div className="flex-grow-1 my-2" style={{overflowY: "auto"}}>
            {searchResults.map(track => (
                <TrackSearchResult 
                track={track} 
                key={track.uri} 
                chooseTrack={chooseTrack} />
            ))}

            {searchResults.length === 0 && (
                <div className="text-center" style={{ whiteSpace: "pre"}}>
                    {lyrics}
                </div>
            )}
        </div>
        <div>
            <Player 
                accessToken={accessToken} 
                trackUri={playingTrack?.uri} />
            </div>
    </Container>
}
